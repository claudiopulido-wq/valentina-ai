import { NextRequest, NextResponse } from 'next/server';
import { authorizeKnowledgeRequest } from '@/lib/serverAuth';

const PLATFORM_API_BASE_URL =
  process.env.PLATFORM_API_BASE_URL || 'https://whatsapp-empresarial-production.up.railway.app';
const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY || '';

interface RouteParams {
  params: Promise<{ tenantId: string; id: string }>;
}

/**
 * POST /api/tenants/[tenantId]/knowledge/[id]/reindexar
 * Reintenta el cálculo del embedding vectorial en Voyage AI si falló anteriormente.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { tenantId, id } = await params;
  const numericTenantId = parseInt(tenantId, 10);
  const numericDocId = parseInt(id, 10);

  if (isNaN(numericTenantId) || isNaN(numericDocId)) {
    return NextResponse.json(
      { error: 'Los identificadores de tenant e ID deben ser numéricos.', code: 'INVALID_PARAMETERS' },
      { status: 400 }
    );
  }

  // Control de Acceso & Prevención de IDOR (Escritura)
  const authCheck = await authorizeKnowledgeRequest(request, numericTenantId, 'write');
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  if (!PLATFORM_API_KEY) {
    return NextResponse.json(
      { error: 'Configuración interna del servidor incompleta.', code: 'SERVER_CONFIG_ERROR' },
      { status: 500 }
    );
  }

  try {
    const railwayUrl = `${PLATFORM_API_BASE_URL}/api/tenants/${numericTenantId}/knowledge/${numericDocId}/reindexar`;
    const response = await fetch(railwayUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PLATFORM_API_KEY}`,
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Proxy] Error al reindexar documento en Railway:', error);
    return NextResponse.json(
      { error: 'Error de comunicación con el servicio de base de conocimientos.', code: 'GATEWAY_ERROR' },
      { status: 502 }
    );
  }
}
