import { NextRequest, NextResponse } from 'next/server';
import { authorizeCrmRequest } from '@/lib/serverAuth';
import { LEVEL_CONFIGS } from '@/lib/permissions';
import { listContactsForTenant, filterContactsByVisibility, mapContactRowToListItem } from '@/lib/crmService';

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

/**
 * GET /api/tenants/[tenantId]/crm/contacts
 * Lista completa del pipeline del tenant (para el tablero Kanban), acotada
 * por la misma regla de visibilidad que el resto del CRM: quien administra
 * el pipeline completo ve todos los contactos; un vendedor/asesor solo ve
 * los suyos y los que aún no tienen dueño.
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
  const contacts = visibleRows.map(mapContactRowToListItem);

  return NextResponse.json({ contacts }, { status: 200 });
}
