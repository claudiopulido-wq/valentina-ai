import { NextRequest, NextResponse } from 'next/server';
import { authorizeCrmRequest } from '@/lib/serverAuth';
import { LEVEL_CONFIGS } from '@/lib/permissions';
import { getContactById, listCrmActivities } from '@/lib/crmService';

interface RouteParams {
  params: Promise<{ tenantId: string; contactId: string }>;
}

/**
 * GET /api/tenants/[tenantId]/crm/contacts/[contactId]/activities
 * Timeline de actividad (notas, cambios de etapa, cambios de asignación) de
 * un contacto, más reciente primero.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { tenantId, contactId } = await params;

  const authCheck = await authorizeCrmRequest(request, tenantId);
  if (!authCheck.authorized) return authCheck.response;
  const user = authCheck.user;

  const current = await getContactById(tenantId, contactId);
  if (!current) {
    return NextResponse.json({ error: 'Contacto no encontrado.', code: 'NOT_FOUND' }, { status: 404 });
  }

  const levelConfig = user.role === 'superadmin' ? null : user.level ? LEVEL_CONFIGS[user.level] : null;
  const canManageCRM = user.role === 'superadmin' || Boolean(levelConfig?.canManageCRM);

  if (!canManageCRM && current.assigned_to !== null && current.assigned_to !== user.id) {
    return NextResponse.json(
      { error: 'No tienes acceso a la actividad de este lead.', code: 'FORBIDDEN_TAB_ACCESS' },
      { status: 403 }
    );
  }

  const activities = await listCrmActivities(tenantId, contactId);
  return NextResponse.json({ activities }, { status: 200 });
}
