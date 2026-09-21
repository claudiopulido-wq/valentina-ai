import { NextRequest, NextResponse } from 'next/server';
import { authorizeConversationsRequest } from '@/lib/serverAuth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const PLATFORM_API_BASE_URL =
  process.env.PLATFORM_API_BASE_URL || 'https://whatsapp-empresarial-production.up.railway.app';
const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY || '';

const pausarBotSchema = z.object({
  minutos: z.number().int().min(1).max(1440).optional(),
});

interface RouteParams {
  params: Promise<{ tenantId: string; canal: string; contacto: string }>;
}

/**
 * POST /api/tenants/[tenantId]/conversaciones/[canal]/[contacto]/pausar-bot
 * Proxy autenticado hacia Railway: pausa al bot para que un operador humano
 * tome la conversación ANTES de escribir su primer mensaje (a diferencia de
 * enviar un mensaje, que ya pausa el bot como efecto secundario). Contrato
 * confirmado en vivo el 2026-09-21: body opcional { minutos }, default 30,
 * maximo 1440; respuesta { pausado, botPausadoHasta }.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { tenantId, canal, contacto } = await params;
  const numericTenantId = parseInt(tenantId, 10);

  if (isNaN(numericTenantId)) {
    return NextResponse.json(
      { error: 'El identificador de tenant debe ser numérico.', code: 'INVALID_TENANT_ID' },
      { status: 400 }
    );
  }
  if (!canal || canal.length > 30 || !contacto || contacto.length > 60) {
    return NextResponse.json({ error: 'Canal o contacto inválido.', code: 'INVALID_PARAMS' }, { status: 400 });
  }

  const authCheck = await authorizeConversationsRequest(request, numericTenantId, 'write');
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  let minutos: number | undefined;
  try {
    const rawBody = await request.text();
    if (rawBody) {
      const parsed = pausarBotSchema.safeParse(JSON.parse(rawBody));
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Parámetro "minutos" inválido (debe ser entero entre 1 y 1440).', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      minutos = parsed.data.minutos;
    }
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es un JSON válido.', code: 'INVALID_JSON' }, { status: 400 });
  }

  if (!PLATFORM_API_KEY) {
    logger.error('PLATFORM_API_KEY no configurada', {
      route: '/api/tenants/[tenantId]/conversaciones/[canal]/[contacto]/pausar-bot',
      tenantId: numericTenantId,
    });
    return NextResponse.json(
      { error: 'Configuración interna del servidor incompleta.', code: 'SERVER_CONFIG_ERROR' },
      { status: 500 }
    );
  }

  try {
    const railwayUrl = `${PLATFORM_API_BASE_URL}/api/tenants/${numericTenantId}/conversaciones/${encodeURIComponent(canal)}/${encodeURIComponent(contacto)}/pausar-bot`;
    const response = await fetch(railwayUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PLATFORM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(minutos ? { minutos } : {}),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    logger.error('Error al conectar con Railway (pausar-bot)', {
      route: '/api/tenants/[tenantId]/conversaciones/[canal]/[contacto]/pausar-bot',
      tenantId: numericTenantId,
      error: error?.message,
    });
    return NextResponse.json(
      { error: 'Error de comunicación con el gateway de conversaciones.', code: 'GATEWAY_ERROR' },
      { status: 502 }
    );
  }
}
