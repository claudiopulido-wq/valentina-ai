import { NextRequest, NextResponse } from 'next/server';
import { authorizeCrmRequest } from '@/lib/serverAuth';
import { LEVEL_CONFIGS } from '@/lib/permissions';
import { getContactWithAssigneeById, mapContactRowToCsvRow, buildContactsCsv } from '@/lib/crmService';

interface RouteParams {
  params: Promise<{ tenantId: string; contactId: string }>;
}

/**
 * GET /api/tenants/[tenantId]/crm/contacts/[contactId]/export
 * Descarga la ficha de un solo contacto en CSV. Mismo control de acceso que
 * el resto del CRM: quien administra el pipeline puede exportar cualquier
 * contacto; un vendedor/asesor solo el suyo (o uno sin dueño).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { tenantId, contactId } = await params;

  const authCheck = await authorizeCrmRequest(request, tenantId);
  if (!authCheck.authorized) return authCheck.response;
  const user = authCheck.user;

  const contact = await getContactWithAssigneeById(tenantId, contactId);
  if (!contact) {
    return NextResponse.json({ error: 'Contacto no encontrado.', code: 'NOT_FOUND' }, { status: 404 });
  }

  const levelConfig = user.role === 'superadmin' ? null : user.level ? LEVEL_CONFIGS[user.level] : null;
  const canManageCRM = user.role === 'superadmin' || Boolean(levelConfig?.canManageCRM);

  if (!canManageCRM && contact.assigned_to !== null && contact.assigned_to !== user.id) {
    return NextResponse.json(
      { error: 'No tienes acceso a la información de este lead.', code: 'FORBIDDEN_TAB_ACCESS' },
      { status: 403 }
    );
  }

  const csv = buildContactsCsv([mapContactRowToCsvRow(contact)]);
  const filename = `contacto-${contact.phone_or_email.replace(/[^a-zA-Z0-9]/g, '') || contactId}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
