import { NextRequest, NextResponse } from 'next/server';
import { authorizeCrmRequest } from '@/lib/serverAuth';
import { LEVEL_CONFIGS } from '@/lib/permissions';
import {
  getContactById,
  getCrmFieldsForContact,
  updateCrmContact,
  PIPELINE_STAGES,
  UpdateContactPatch,
} from '@/lib/crmService';
import { PipelineStage } from '@/types/platform';

interface RouteParams {
  params: Promise<{ tenantId: string; contactId: string }>;
}

/**
 * PATCH /api/tenants/[tenantId]/crm/contacts/[contactId]
 * `tenantId` aquí es el slug interno del tenant (el mismo que `contacts.tenant_id`),
 * no el id numérico de Railway.
 *
 * Cambia asignación/etapa/motivo de pérdida de un contacto del CRM. El
 * control de acceso fino es:
 *  - `canManageCRM` (director/coordinador/superadmin): puede asignar a
 *    cualquiera, reasignar, quitar asignación, y cambiar la etapa de
 *    cualquier contacto del tenant.
 *  - `canClaimLeads` (vendedor/asesor): solo puede "reclamar" (asignarse a
 *    sí mismo) un lead que todavía no tiene dueño, y solo puede cambiar la
 *    etapa/motivo de pérdida de los leads que ya tiene asignados.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { tenantId, contactId } = await params;

  const authCheck = await authorizeCrmRequest(request, tenantId);
  if (!authCheck.authorized) return authCheck.response;
  const user = authCheck.user;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.', code: 'INVALID_BODY' }, { status: 400 });
  }

  const current = await getContactById(tenantId, contactId);
  if (!current) {
    return NextResponse.json({ error: 'Contacto no encontrado.', code: 'NOT_FOUND' }, { status: 404 });
  }

  const levelConfig = user.role === 'superadmin' ? null : user.level ? LEVEL_CONFIGS[user.level] : null;
  const canManageCRM = user.role === 'superadmin' || Boolean(levelConfig?.canManageCRM);
  const canClaimLeads = Boolean(levelConfig?.canClaimLeads);
  const ownsLead = current.assigned_to === user.id;

  const patch: UpdateContactPatch = {};

  if ('pipelineStage' in body) {
    const stage = body.pipelineStage as PipelineStage;
    if (!PIPELINE_STAGES.includes(stage)) {
      return NextResponse.json({ error: 'Etapa de pipeline inválida.', code: 'INVALID_STAGE' }, { status: 400 });
    }
    if (!canManageCRM && !ownsLead) {
      return NextResponse.json(
        { error: 'Solo puedes cambiar la etapa de leads que tienes asignados.', code: 'FORBIDDEN_WRITE_ACTION' },
        { status: 403 }
      );
    }
    patch.pipelineStage = stage;
  }

  if ('lostReason' in body) {
    if (!canManageCRM && !ownsLead) {
      return NextResponse.json(
        { error: 'Solo puedes editar leads que tienes asignados.', code: 'FORBIDDEN_WRITE_ACTION' },
        { status: 403 }
      );
    }
    patch.lostReason = typeof body.lostReason === 'string' ? body.lostReason : null;
  }

  if ('assignedTo' in body) {
    if (canManageCRM) {
      patch.assignedTo = body.assignedTo || null;
    } else if (canClaimLeads) {
      const isClaimingForSelf = current.assigned_to === null && body.assignedTo === user.id;
      if (!isClaimingForSelf) {
        return NextResponse.json(
          { error: 'Solo puedes reclamar leads que todavía no tienen dueño.', code: 'FORBIDDEN_WRITE_ACTION' },
          { status: 403 }
        );
      }
      patch.assignedTo = user.id;
    } else {
      return NextResponse.json(
        { error: 'No tienes permiso para asignar leads.', code: 'FORBIDDEN_WRITE_ACTION' },
        { status: 403 }
      );
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No se proporcionó ningún cambio válido.', code: 'EMPTY_PATCH' }, { status: 400 });
  }

  const updated = await updateCrmContact(contactId, patch, { id: user.id, name: user.fullName });
  if (!updated) {
    return NextResponse.json({ error: 'No se pudo actualizar el contacto.', code: 'UPDATE_FAILED' }, { status: 500 });
  }

  const crm = await getCrmFieldsForContact(updated);
  return NextResponse.json({ crm }, { status: 200 });
}
