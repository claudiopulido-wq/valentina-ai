import { NextRequest, NextResponse } from 'next/server';
import { authorizeConversationsRequest } from '@/lib/serverAuth';
import { logger } from '@/lib/logger';

const PLATFORM_API_BASE_URL =
  process.env.PLATFORM_API_BASE_URL || 'https://whatsapp-empresarial-production.up.railway.app';
const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY || '';

interface RouteParams {
  params: Promise<{ tenantId: string; contacto: string }>;
}

/**
 * GET /api/tenants/[tenantId]/conversaciones/whatsapp/[contacto]
 * Proxy autenticado hacia Railway: historial cronológico completo de un
 * contacto específico (usado al abrir una conversación en la bandeja).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { tenantId, contacto } = await params;
  const numericTenantId = parseInt(tenantId, 10);

  if (isNaN(numericTenantId)) {
    return NextResponse.json(
      { error: 'El identificador de tenant debe ser numérico.', code: 'INVALID_TENANT_ID' },
      { status: 400 }
    );
  }

  if (!contacto || contacto.length > 60) {
    return NextResponse.json(
      { error: 'Identificador de contacto inválido.', code: 'INVALID_CONTACT_ID' },
      { status: 400 }
    );
  }

  const authCheck = await authorizeConversationsRequest(request, numericTenantId, 'read');
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  if (!PLATFORM_API_KEY) {
    logger.error('PLATFORM_API_KEY no configurada', {
      route: '/api/tenants/[tenantId]/conversaciones/whatsapp/[contacto]',
      tenantId: numericTenantId,
    });
    return NextResponse.json(
      { error: 'Configuración interna del servidor incompleta.', code: 'SERVER_CONFIG_ERROR' },
      { status: 500 }
    );
  }

  try {
    const railwayUrl = `${PLATFORM_API_BASE_URL}/api/tenants/${numericTenantId}/conversaciones/whatsapp/${encodeURIComponent(contacto)}`;
    const response = await fetch(railwayUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PLATFORM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    logger.error('Error al conectar con Railway Conversaciones API', {
      route: '/api/tenants/[tenantId]/conversaciones/whatsapp/[contacto]',
      tenantId: numericTenantId,
      error: error?.message,
    });
    return NextResponse.json(
      { error: 'Error de comunicación con el gateway de conversaciones.', code: 'GATEWAY_ERROR' },
      { status: 502 }
    );
  }
}
