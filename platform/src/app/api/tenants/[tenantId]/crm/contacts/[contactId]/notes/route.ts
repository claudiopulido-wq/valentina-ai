import { NextRequest, NextResponse } from 'next/server';
import { authorizeCrmRequest } from '@/lib/serverAuth';
import { LEVEL_CONFIGS } from '@/lib/permissions';
import { getContactById, addCrmActivity } from '@/lib/crmService';

interface RouteParams {
  params: Promise<{ tenantId: string; contactId: string }>;
}

/**
 * POST /api/tenants/[tenantId]/crm/contacts/[contactId]/notes
 * Agrega una nota libre al timeline de actividad del contacto. Solo puede
 * anotar quien administra el CRM completo o quien tiene ese lead asignado
 * a sí mismo — igual regla de visibilidad que el resto del CRM.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { tenantId, contactId } = await params;

  const authCheck = await authorizeCrmRequest(request, tenantId);
  if (!authCheck.authorized) return authCheck.response;
  const user = authCheck.user;

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  if (!content) {
    return NextResponse.json({ error: 'La nota no puede estar vacía.', code: 'INVALID_BODY' }, { status: 400 });
  }

  const current = await getContactById(tenantId, contactId);
  if (!current) {
    return NextResponse.json({ error: 'Contacto no encontrado.', code: 'NOT_FOUND' }, { status: 404 });
  }

  const levelConfig = user.role === 'superadmin' ? null : user.level ? LEVEL_CONFIGS[user.level] : null;
  const canManageCRM = user.role === 'superadmin' || Boolean(levelConfig?.canManageCRM);

  if (!canManageCRM && current.assigned_to !== user.id) {
    return NextResponse.json(
      { error: 'Solo puedes agregar notas a leads que tienes asignados.', code: 'FORBIDDEN_WRITE_ACTION' },
      { status: 403 }
    );
  }

  await addCrmActivity({
    tenantId,
    contactId,
    actorId: user.id,
    actorName: user.fullName,
    type: 'note',
    content,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
