import { NextRequest, NextResponse } from 'next/server';
import { authorizeCrmRequest } from '@/lib/serverAuth';
import { LEVEL_CONFIGS } from '@/lib/permissions';
import {
  listContactsForTenant,
  filterContactsByVisibility,
  mapContactRowToCsvRow,
  buildContactsCsv,
} from '@/lib/crmService';

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

/**
 * GET /api/tenants/[tenantId]/crm/export
 * Descarga el pipeline completo (visible para el usuario) en CSV — misma
 * regla de `filterContactsByVisibility` que el tablero Kanban, así nadie
 * exporta contactos que no podría ver en la propia pantalla.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;

  const authCheck = await authorizeCrmRequest(request, tenantId);
  if (!authCheck.authorized) return authCheck.response;
  const user = authCheck.user;

  const levelConfig = user.role === 'superadmin' ? null : user.level ? LEVEL_CONFIGS[user.level] : null;
  const canManageCRM = user.role === 'superadmin' || Boolean(levelConfig?.canManageCRM);

  const rawRows = await listContactsForTenant(tenantId);
  const visibleRows = filterContactsByVisibility(rawRows, user.id, canManageCRM);
  const csv = buildContactsCsv(visibleRows.map(mapContactRowToCsvRow));

  const today = new Date().toISOString().split('T')[0];
  const filename = `pipeline-${tenantId}-${today}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
