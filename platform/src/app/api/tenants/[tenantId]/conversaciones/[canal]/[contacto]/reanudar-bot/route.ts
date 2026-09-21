import { NextRequest, NextResponse } from 'next/server';
import { authorizeConversationsRequest } from '@/lib/serverAuth';
import { logger } from '@/lib/logger';

const PLATFORM_API_BASE_URL =
  process.env.PLATFORM_API_BASE_URL || 'https://whatsapp-empresarial-production.up.railway.app';
const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY || '';

interface RouteParams {
  params: Promise<{ tenantId: string; canal: string; contacto: string }>;
}

/**
 * POST /api/tenants/[tenantId]/conversaciones/[canal]/[contacto]/reanudar-bot
 * Proxy autenticado hacia Railway: le devuelve el control al bot de
 * inmediato (idempotente si ya no estaba pausado). Contrato confirmado en
 * vivo el 2026-09-21: sin body, respuesta { reanudado }.
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

  if (!PLATFORM_API_KEY) {
    logger.error('PLATFORM_API_KEY no configurada', {
      route: '/api/tenants/[tenantId]/conversaciones/[canal]/[contacto]/reanudar-bot',
      tenantId: numericTenantId,
    });
    return NextResponse.json(
      { error: 'Configuración interna del servidor incompleta.', code: 'SERVER_CONFIG_ERROR' },
      { status: 500 }
    );
  }

  try {
    const railwayUrl = `${PLATFORM_API_BASE_URL}/api/tenants/${numericTenantId}/conversaciones/${encodeURIComponent(canal)}/${encodeURIComponent(contacto)}/reanudar-bot`;
    const response = await fetch(railwayUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PLATFORM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    logger.error('Error al conectar con Railway (reanudar-bot)', {
      route: '/api/tenants/[tenantId]/conversaciones/[canal]/[contacto]/reanudar-bot',
      tenantId: numericTenantId,
      error: error?.message,
    });
    return NextResponse.json(
      { error: 'Error de comunicación con el gateway de conversaciones.', code: 'GATEWAY_ERROR' },
      { status: 502 }
    );
  }
}
