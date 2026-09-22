import { NextRequest, NextResponse } from 'next/server';
import { authorizeConversationsRequest, getSlugForNumericTenantId } from '@/lib/serverAuth';
import { findOrCreateCrmContact, getCrmFieldsForContact } from '@/lib/crmService';
import { logger } from '@/lib/logger';

const PLATFORM_API_BASE_URL =
  process.env.PLATFORM_API_BASE_URL || 'https://whatsapp-empresarial-production.up.railway.app';
const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY || '';

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

/**
 * GET /api/tenants/[tenantId]/conversaciones
 * Proxy autenticado hacia el gateway de WhatsApp en Railway: lista de hilos
 * recientes (uno por canal+contacto) del tenant. El navegador nunca ve
 * PLATFORM_API_KEY — solo este Route Handler, que corre en el servidor.
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

  const authCheck = await authorizeConversationsRequest(request, numericTenantId, 'read');
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  if (!PLATFORM_API_KEY) {
    logger.error('PLATFORM_API_KEY no configurada', {
      route: '/api/tenants/[tenantId]/conversaciones',
      tenantId: numericTenantId,
    });
    return NextResponse.json(
      { error: 'Configuración interna del servidor incompleta.', code: 'SERVER_CONFIG_ERROR' },
      { status: 500 }
    );
  }

  try {
    const railwayUrl = `${PLATFORM_API_BASE_URL}/api/tenants/${numericTenantId}/conversaciones`;
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

    // Decorar cada hilo con los datos del CRM interno (asignación, etapa,
    // etiquetas) resueltos contra la tabla `contacts` de Supabase. Railway
    // no sabe nada de esto — es una capa que agregamos nosotros encima.
    const hilos = Array.isArray(data?.hilos) ? data.hilos : [];
    const internalTenantId = await getSlugForNumericTenantId(numericTenantId);

    const decoratedHilos = internalTenantId
      ? await Promise.all(
          hilos.map(async (hilo: any) => {
            const contactRow = await findOrCreateCrmContact({
              tenantId: internalTenantId,
              channel: hilo.canal,
              phoneOrEmail: hilo.contacto,
            });
            if (!contactRow) return hilo;
            const crm = await getCrmFieldsForContact(contactRow);
            return { ...hilo, crm };
          })
        )
      : hilos;

    return NextResponse.json({ ...data, hilos: decoratedHilos }, { status: 200 });
  } catch (error: any) {
    logger.error('Error al conectar con Railway Conversaciones API', {
      route: '/api/tenants/[tenantId]/conversaciones',
      tenantId: numericTenantId,
      error: error?.message,
    });
    return NextResponse.json(
      { error: 'Error de comunicación con el gateway de conversaciones.', code: 'GATEWAY_ERROR' },
      { status: 502 }
    );
  }
}
