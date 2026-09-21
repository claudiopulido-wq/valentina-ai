import { NextRequest, NextResponse } from 'next/server';
import { sendMessageSchema, validationErrorResponse } from '@/lib/validation';
import { withIdempotency } from '@/lib/idempotency';
import { logger } from '@/lib/logger';
import { insertOutboundMessage } from '@/lib/conversationsService';
import { authorizeConversationsRequest, getAuthenticatedUser } from '@/lib/serverAuth';

const PLATFORM_API_BASE_URL =
  process.env.PLATFORM_API_BASE_URL || 'https://whatsapp-empresarial-production.up.railway.app';
const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY || '';

interface DispatchResult {
  httpStatus: number;
  body: Record<string, unknown>;
}

/**
 * Despacha un mensaje de operador humano al gateway compartido de WhatsApp
 * en Railway. Contrato confirmado en vivo el 2026-09-19 contra
 * whatsapp-empresarial-production.up.railway.app:
 *   POST /api/tenants/:railwayTenantId/mensajes/enviar
 *   body: { canal, contacto, mensaje }
 *   Authorization: Bearer <PLATFORM_API_KEY>  (mismo header que Knowledge Base)
 *   respuesta: { enviado: boolean, botPausadoHasta: string | null }
 */
async function dispatchToGateway(payload: {
  railwayTenantId: number;
  cleanPhone: string;
  message: string;
  channel: string;
}): Promise<DispatchResult> {
  if (!PLATFORM_API_KEY) {
    // Sin PLATFORM_API_KEY configurada: modo sandbox explícito. Se marca
    // claramente como no-real para que la UI pueda advertir al operador en
    // vez de mostrar "enviado" indistinguible de un envío real.
    return {
      httpStatus: 200,
      body: {
        success: true,
        status: 'sent',
        gateway: 'simulated_local',
        simulated: true,
        timestamp: new Date().toISOString(),
        note: 'Modo sandbox/demo: no se despachó un mensaje real (falta configurar PLATFORM_API_KEY).',
      },
    };
  }

  try {
    const railwayUrl = `${PLATFORM_API_BASE_URL}/api/tenants/${payload.railwayTenantId}/mensajes/enviar`;
    const response = await fetch(railwayUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PLATFORM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        canal: payload.channel,
        contacto: payload.cleanPhone,
        mensaje: payload.message,
      }),
      signal: AbortSignal.timeout(8000),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.enviado !== true) {
      return {
        httpStatus: response.ok ? 502 : response.status,
        body: {
          success: false,
          status: 'failed',
          gateway: 'railway_whatsapp_cloud',
          error: data.error || data.message || `El gateway de WhatsApp respondió con error ${response.status}.`,
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      httpStatus: 200,
      body: {
        success: true,
        status: 'sent',
        gateway: 'railway_whatsapp_cloud',
        botPausadoHasta: data.botPausadoHasta ?? null,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (railwayErr) {
    logger.error('Gateway Railway no disponible', {
      route: '/api/channels/whatsapp/send-message',
      railwayTenantId: payload.railwayTenantId,
      error: railwayErr instanceof Error ? railwayErr.message : String(railwayErr),
    });
    return {
      httpStatus: 502,
      body: {
        success: false,
        status: 'failed',
        gateway: 'railway_whatsapp_cloud',
        error: 'No se pudo contactar al gateway de WhatsApp. El mensaje NO fue entregado.',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * POST /api/channels/whatsapp/send-message
 * Despacha un mensaje escrito por el operador humano directamente a WhatsApp Cloud API / Railway
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = sendMessageSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { conversationId, recipient, message, senderName, channel, railwayTenantId } = parsed.data;
    const cleanPhone = recipient.replace(/[^0-9+]/g, '');
    const cleanMessage = message.trim();

    // Control de acceso: solo usuarios autenticados con permiso de intervenir
    // el chat (o SuperAdmin) pueden despachar mensajes reales por WhatsApp.
    // Antes esta ruta no verificaba nada — cualquiera con la URL podía
    // disparar mensajes reales (o escribir en el historial persistido) sin
    // haber iniciado sesión siquiera.
    if (railwayTenantId) {
      const authCheck = await authorizeConversationsRequest(request, railwayTenantId, 'write');
      if (!authCheck.authorized) {
        return authCheck.response;
      }
    } else {
      // Camino de respaldo (tenant sin railwayTenantId): no hay un tenant
      // numérico contra el cual validar aislamiento, pero se exige como
      // mínimo una sesión real antes de escribir en el historial persistido.
      const user = await getAuthenticatedUser(request);
      if (!user) {
        return NextResponse.json(
          { error: 'No autenticado. Debes iniciar sesión en la plataforma para realizar esta operación.', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }
    }

    // Idempotencia: el mismo texto hacia la misma conversación dentro de una
    // ventana corta se trata como reintento (doble clic, retry de red), no
    // como un segundo mensaje real.
    const idempotencyKey = `wa-send:${conversationId}:${cleanMessage}`;
    const { result, deduped } = await withIdempotency(idempotencyKey, 15_000, () =>
      railwayTenantId
        ? dispatchToGateway({
            railwayTenantId,
            cleanPhone,
            message: cleanMessage,
            channel: channel || 'whatsapp',
          })
        : Promise.resolve<DispatchResult>({
            httpStatus: 200,
            body: {
              success: true,
              status: 'sent',
              gateway: 'simulated_local',
              simulated: true,
              timestamp: new Date().toISOString(),
              note: 'Modo sandbox/demo: este tenant no tiene railwayTenantId configurado.',
            },
          })
    );

    // Persistir el mensaje saliente en el historial propio de Supabase solo
    // para tenants SIN railwayTenantId (no conectados al gateway compartido):
    // para los que sí lo tienen, el historial real ya vive en Railway y se
    // relee con fetchRailwayContactHistory — insertarlo aquí también sería
    // un duplicado que nunca se muestra.
    if (!railwayTenantId && result.body.success !== false) {
      await insertOutboundMessage({
        conversationId,
        senderName,
        content: cleanMessage,
        simulated: Boolean(result.body.simulated),
      });
    }

    return NextResponse.json({ ...result.body, deduped }, { status: result.httpStatus });
  } catch (err: any) {
    logger.error('Error al procesar mensaje', { route: '/api/channels/whatsapp/send-message', error: err?.message });
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor al enviar mensaje.' },
      { status: 500 }
    );
  }
}
