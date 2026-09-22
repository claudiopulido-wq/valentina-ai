import { NextRequest, NextResponse } from 'next/server';
import { authorizeCrmRequest } from '@/lib/serverAuth';
import { LEVEL_CONFIGS } from '@/lib/permissions';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

/**
 * GET /api/tenants/[tenantId]/crm/team
 * Roster de `platform_users` activos del tenant, usado para poblar el
 * dropdown de reasignación. Solo lo puede ver quien administra el CRM
 * completo (Director/Coordinador/SuperAdmin) — un vendedor no necesita ni
 * debe ver el directorio de todo el equipo para reclamar sus propios leads.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;

  const authCheck = await authorizeCrmRequest(request, tenantId);
  if (!authCheck.authorized) return authCheck.response;
  const user = authCheck.user;

  const levelConfig = user.role === 'superadmin' ? null : user.level ? LEVEL_CONFIGS[user.level] : null;
  const canManageCRM = user.role === 'superadmin' || Boolean(levelConfig?.canManageCRM);
  if (!canManageCRM) {
    return NextResponse.json(
      { error: 'Solo quien administra el CRM puede ver el directorio del equipo.', code: 'FORBIDDEN_TAB_ACCESS' },
      { status: 403 }
    );
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ members: [] }, { status: 200 });
  }

  const { data, error } = await supabaseAdmin
    .from('platform_users')
    .select('id, full_name, level')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .order('full_name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'No se pudo listar el equipo.', code: 'QUERY_FAILED' }, { status: 500 });
  }

  const members = (data || []).map((row) => ({
    id: row.id as string,
    fullName: row.full_name as string,
    level: (row.level as string) || null,
  }));

  return NextResponse.json({ members }, { status: 200 });
}
