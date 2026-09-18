import { NextRequest, NextResponse } from 'next/server';
import { sendMessageSchema, validationErrorResponse } from '@/lib/validation';
import { withIdempotency } from '@/lib/idempotency';
import { logger } from '@/lib/logger';

const PLATFORM_API_BASE_URL =
  process.env.PLATFORM_API_BASE_URL || 'https://whatsapp-empresarial-production.up.railway.app';
const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY || '';

interface DispatchResult {
  httpStatus: number;
  body: Record<string, unknown>;
}

async function dispatchToGateway(payload: {
  conversationId: string;
  cleanPhone: string;
  message: string;
  senderName?: string;
  channel: string;
  phoneNumberId?: string;
  wabaId?: string;
  tenantSlug?: string;
}): Promise<DispatchResult> {
  // Si tenemos credenciales de servidor Railway configuradas, el resultado
  // reportado refleja la respuesta REAL del gateway. Antes, cualquier
  // excepción de red se atrapaba y el endpoint devolvía `success: true` de
  // todas formas (y una respuesta HTTP no-OK sin excepción ni siquiera se
  // detectaba), por lo que el operador veía "✓ Enviado" sin que el mensaje
  // hubiera llegado realmente al cliente por WhatsApp.
  if (PLATFORM_API_KEY && PLATFORM_API_BASE_URL) {
    try {
      const outboundPayload = {
        conversation_id: payload.conversationId,
        to: payload.cleanPhone,
        body: payload.message,
        sender_type: 'human_operator',
        sender_name: payload.senderName || 'Operador Humano',
        channel: payload.channel,
        phone_number_id: payload.phoneNumberId || undefined,
        waba_id: payload.wabaId || undefined,
        tenant_slug: payload.tenantSlug || undefined,
      };

      const response = await fetch(`${PLATFORM_API_BASE_URL}/api/channels/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Platform-API-Key': PLATFORM_API_KEY,
        },
        body: JSON.stringify(outboundPayload),
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const resData = await response.json();
        return {
          httpStatus: 200,
          body: {
            success: true,
            status: 'sent',
            gateway: 'railway_whatsapp_cloud',
            messageId: resData.message_id || `msg-${Date.now()}`,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // El gateway respondió, pero con un error (4xx/5xx): esto NO es éxito.
      const errorBody = await response.json().catch(() => ({}));
      return {
        httpStatus: 502,
        body: {
          success: false,
          status: 'failed',
          gateway: 'railway_whatsapp_cloud',
          error: errorBody.error || `El gateway de WhatsApp respondió con error ${response.status}.`,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (railwayErr) {
      logger.error('Gateway Railway no disponible', {
        route: '/api/channels/whatsapp/send-message',
        conversationId: payload.conversationId,
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
      messageId: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      note: 'Modo sandbox/demo: no se despachó un mensaje real (falta configurar PLATFORM_API_KEY).',
    },
  };
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

    const { conversationId, recipient, message, senderName, channel, phoneNumberId, wabaId, tenantSlug } =
      parsed.data;
    const cleanPhone = recipient.replace(/[^0-9+]/g, '');
    const cleanMessage = message.trim();

    // Idempotencia: el mismo texto hacia la misma conversación dentro de una
    // ventana corta se trata como reintento (doble clic, retry de red), no
    // como un segundo mensaje real.
    const idempotencyKey = `wa-send:${conversationId}:${cleanMessage}`;
    const { result, deduped } = await withIdempotency(idempotencyKey, 15_000, () =>
      dispatchToGateway({
        conversationId,
        cleanPhone,
        message: cleanMessage,
        senderName,
        channel: channel || 'whatsapp',
        phoneNumberId,
        wabaId,
        tenantSlug,
      })
    );

    return NextResponse.json({ ...result.body, deduped }, { status: result.httpStatus });
  } catch (err: any) {
    logger.error('Error al procesar mensaje', { route: '/api/channels/whatsapp/send-message', error: err?.message });
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor al enviar mensaje.' },
      { status: 500 }
    );
  }
}
