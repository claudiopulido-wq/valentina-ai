import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/serverAuth';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { Tenant } from '@/types/platform';
import { tenantPatchSchema, validationErrorResponse } from '@/lib/validation';
import { recordAuditLog } from '@/lib/auditLog';

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

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
 * PATCH /api/tenants/[tenantId]
 * Actualiza un tenant existente (solo SuperAdmin) fusionando el objeto
 * recibido sobre el `data` guardado, para no perder campos no enviados.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authCheck = await requireSuperAdmin(request);
  if (!authCheck.authorized) return authCheck.response;

  const { tenantId } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'El cuerpo de la solicitud no es un JSON válido.', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  const parsedPatch = tenantPatchSchema.safeParse(rawBody);
  if (!parsedPatch.success) {
    return validationErrorResponse(parsedPatch.error);
  }
  const patch = parsedPatch.data as Partial<Tenant>;

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: 'Configuración interna del servidor incompleta.', code: 'SERVER_CONFIG_ERROR' },
      { status: 500 }
    );
  }

  const { data: existingRow, error: fetchError } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message, code: 'QUERY_FAILED' }, { status: 500 });
  }
  if (!existingRow) {
    return NextResponse.json({ error: 'Tenant no encontrado.', code: 'NOT_FOUND' }, { status: 404 });
  }

  const mergedData: Tenant = { ...(existingRow.data || {}), ...patch, id: tenantId };

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('tenants')
    .update({
      name: mergedData.name,
      status: mergedData.status,
      plan: mergedData.plan,
      railway_tenant_id: mergedData.railwayTenantId ?? existingRow.railway_tenant_id ?? null,
      data: mergedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenantId)
    .select('*')
    .maybeSingle();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message || 'No se pudo actualizar el tenant.', code: 'UPDATE_FAILED' },
      { status: 500 }
    );
  }

  await recordAuditLog({
    action: 'tenant.update',
    actorId: authCheck.user.id,
    actorEmail: authCheck.user.email,
    targetId: tenantId,
    details: patch,
  });

  return NextResponse.json({ tenant: mapRowToTenant(updated) });
}
