import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, requireSuperAdmin } from '@/lib/serverAuth';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { Tenant } from '@/types/platform';
import { tenantCreateSchema, validationErrorResponse } from '@/lib/validation';
import { recordAuditLog } from '@/lib/auditLog';

function mapRowToTenant(row: Record<string, any>): Tenant {
  const data = (row.data || {}) as Tenant;
  return {
    ...data,
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    plan: row.plan,
    railwayTenantId: row.railway_tenant_id ?? data.railwayTenantId,
  };
}

/**
 * GET /api/tenants
 * SuperAdmin ve el directorio completo; cualquier otro usuario autenticado
 * solo puede ver la fila de su propia empresa (aislamiento multi-tenant).
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado.', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ tenants: [] });
  }

  let query = supabaseAdmin.from('tenants').select('*').order('created_at', { ascending: false });
  if (user.role !== 'superadmin') {
    if (!user.tenantId) {
      return NextResponse.json({ tenants: [] });
    }
    query = query.eq('id', user.tenantId);
  }

  const { data, error } = await query;
  if (error) {
    if (error.message?.includes('does not exist')) {
      return NextResponse.json({ tenants: [] });
    }
    return NextResponse.json({ error: error.message, code: 'QUERY_FAILED' }, { status: 500 });
  }

  return NextResponse.json({ tenants: (data || []).map(mapRowToTenant) });
}

/**
 * POST /api/tenants
 * Alta de un nuevo tenant (solo SuperAdmin). Persiste en Supabase para que
 * exista de forma compartida entre dispositivos/sesiones, en vez de vivir
 * únicamente en el localStorage del navegador que lo creó.
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireSuperAdmin(request);
  if (!authCheck.authorized) return authCheck.response;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'El cuerpo de la solicitud no es un JSON válido.', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  const parsed = tenantCreateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }
  const tenant = parsed.data as unknown as Tenant;

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: 'Configuración interna del servidor incompleta.', code: 'SERVER_CONFIG_ERROR' },
      { status: 500 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .upsert({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status || 'active',
      plan: tenant.plan || 'Growth',
      railway_tenant_id: tenant.railwayTenantId ?? null,
      data: tenant,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || 'No se pudo guardar el tenant.', code: 'INSERT_FAILED' },
      { status: 500 }
    );
  }

  await recordAuditLog({
    action: 'tenant.create',
    actorId: authCheck.user.id,
    actorEmail: authCheck.user.email,
    targetId: tenant.id,
    details: { slug: tenant.slug, name: tenant.name, plan: tenant.plan },
  });

  return NextResponse.json({ tenant: mapRowToTenant(data) }, { status: 201 });
}
