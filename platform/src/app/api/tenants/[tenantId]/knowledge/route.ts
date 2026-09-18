import { NextRequest, NextResponse } from 'next/server';
import { authorizeKnowledgeRequest } from '@/lib/serverAuth';
import { knowledgeCreateSchema, validationErrorResponse } from '@/lib/validation';
import { logger } from '@/lib/logger';

const PLATFORM_API_BASE_URL =
  process.env.PLATFORM_API_BASE_URL || 'https://whatsapp-empresarial-production.up.railway.app';
const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY || '';

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

/**
 * GET /api/tenants/[tenantId]/knowledge
 * Listar todo el contenido activo de la base de conocimientos para el tenant.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const numericTenantId = parseInt(tenantId, 10);

  if (isNaN(numericTenantId)) {
    return NextResponse.json(
      { error: 'El identificador de tenant debe ser numérico.', code: 'INVALID_TENANT_ID' },
      { status: 400 }
    );
  }

  // 1. Control de Acceso & Prevención de IDOR
  const authCheck = await authorizeKnowledgeRequest(request, numericTenantId, 'read');
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  // 2. Validación de configuración del servidor
  if (!PLATFORM_API_KEY) {
    logger.error('PLATFORM_API_KEY no configurada', { route: '/api/tenants/[tenantId]/knowledge', tenantId: numericTenantId });
    return NextResponse.json(
      { error: 'Configuración interna del servidor incompleta.', code: 'SERVER_CONFIG_ERROR' },
      { status: 500 }
    );
  }

  // 3. Llamada segura servidor-a-servidor a Railway
  try {
    const railwayUrl = `${PLATFORM_API_BASE_URL}/api/tenants/${numericTenantId}/knowledge`;
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
    logger.error('Error al conectar con Railway Knowledge API', {
      route: '/api/tenants/[tenantId]/knowledge',
      tenantId: numericTenantId,
      error: error?.message,
    });
    return NextResponse.json(
      { error: 'Error de comunicación con el servicio de base de conocimientos.', code: 'GATEWAY_ERROR' },
      { status: 502 }
    );
  }
}

/**
 * POST /api/tenants/[tenantId]/knowledge
 * Crear una nueva entrada en la base de conocimientos con cálculo de embeddings vectoriales.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const numericTenantId = parseInt(tenantId, 10);

  if (isNaN(numericTenantId)) {
    return NextResponse.json(
      { error: 'El identificador de tenant debe ser numérico.', code: 'INVALID_TENANT_ID' },
      { status: 400 }
    );
  }

  // 1. Control de Acceso & Prevención de IDOR (Permiso de Escritura Requerido)
  const authCheck = await authorizeKnowledgeRequest(request, numericTenantId, 'write');
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  // 2. Validación de payload
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'El cuerpo de la solicitud no es un JSON válido.', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  const parsed = knowledgeCreateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }
  const { titulo, contenido, categoria } = parsed.data;

  if (!PLATFORM_API_KEY) {
    return NextResponse.json(
      { error: 'Configuración interna del servidor incompleta.', code: 'SERVER_CONFIG_ERROR' },
      { status: 500 }
    );
  }

  // 3. Llamada a Railway
  try {
    const railwayUrl = `${PLATFORM_API_BASE_URL}/api/tenants/${numericTenantId}/knowledge`;
    const response = await fetch(railwayUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PLATFORM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ titulo, contenido, categoria }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    logger.error('Error al crear documento en Railway', {
      route: '/api/tenants/[tenantId]/knowledge',
      tenantId: numericTenantId,
      error: error?.message,
    });
    return NextResponse.json(
      { error: 'Error de comunicación con el servicio de base de conocimientos.', code: 'GATEWAY_ERROR' },
      { status: 502 }
    );
  }
}
