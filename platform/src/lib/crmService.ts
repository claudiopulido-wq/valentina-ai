import { supabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';
import { ChannelType, Contact, CrmActivity, PipelineStage } from '../types/platform';

/**
 * Capa de CRM interno: asignación de leads a vendedores/asesores, etapa del
 * embudo de ventas, y timeline de actividad. Es independiente de dónde vive
 * la conversación en sí (Railway o las tablas propias de respaldo) — la
 * tabla `contacts` es el ancla única de identidad, indexada por
 * (tenant_id, channel_origin, phone_or_email), y este servicio es el único
 * punto de escritura sobre ella para los campos de CRM.
 */

export interface ContactRow {
  id: string;
  tenant_id: string;
  name: string | null;
  phone_or_email: string;
  channel_origin: string;
  city: string | null;
  qualification_score: number | null;
  tags: string[] | null;
  assigned_to: string | null;
  pipeline_stage: string;
  stage_updated_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface CrmContactFields {
  contactId: string;
  assignedTo: string | null;
  assignedToName: string | null;
  pipelineStage: PipelineStage;
  stageUpdatedAt: string | null;
  lostReason: string | null;
  tags: string[];
}

const DEFAULT_STAGE: PipelineStage = 'nuevo';

export const PIPELINE_STAGES: PipelineStage[] = [
  'nuevo',
  'contactado',
  'calificado',
  'propuesta',
  'ganado',
  'perdido',
];

/**
 * Lee un contacto por id, siempre acotado a `tenant_id`, para que un
 * `contactId` de otro tenant nunca resuelva nada (IDOR) aunque alguien lo
 * adivine o lo copie de otra pestaña.
 */
export async function getContactById(tenantId: string, contactId: string): Promise<ContactRow | null> {
  if (!isSupabaseAdminConfigured) return null;

  const { data } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', contactId)
    .maybeSingle();

  return data || null;
}

/**
 * Busca la fila de `contacts` para (tenant, canal, identificador) y la crea
 * si no existe todavía. Es el mismo patrón que ya usaba
 * `insertInboundMessage` en conversationsService.ts, ahora centralizado aquí
 * para que tanto el pipeline de Railway como el de respaldo compartan una
 * sola fuente de verdad de identidad CRM.
 */
export async function findOrCreateCrmContact(input: {
  tenantId: string;
  channel: ChannelType | string;
  phoneOrEmail: string;
  name?: string;
}): Promise<ContactRow | null> {
  if (!isSupabaseAdminConfigured) return null;

  const cleanIdentifier = input.phoneOrEmail.trim();
  if (!cleanIdentifier) return null;

  const { data: existing } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('tenant_id', input.tenantId)
    .eq('channel_origin', input.channel)
    .eq('phone_or_email', cleanIdentifier)
    .maybeSingle();

  if (existing) {
    // Si ahora conocemos un nombre real y antes no lo teníamos, lo guardamos
    // — nunca sobrescribe un nombre ya capturado.
    if (input.name && !existing.name) {
      const { data: updated } = await supabaseAdmin
        .from('contacts')
        .update({ name: input.name, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select('*')
        .maybeSingle();
      return updated || existing;
    }
    return existing;
  }

  const { data: created, error } = await supabaseAdmin
    .from('contacts')
    .insert({
      tenant_id: input.tenantId,
      name: input.name || null,
      phone_or_email: cleanIdentifier,
      channel_origin: input.channel,
      pipeline_stage: DEFAULT_STAGE,
      tags: [],
    })
    .select('*')
    .maybeSingle();

  if (error) {
    // Carrera posible: dos peticiones concurrentes intentan crear el mismo
    // contacto (mismo tenant+canal+identificador) al mismo tiempo. El índice
    // único en Supabase rechaza el segundo insert; en ese caso simplemente
    // volvemos a leer la fila que sí se creó.
    if (error.code === '23505') {
      const { data: raceWinner } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .eq('tenant_id', input.tenantId)
        .eq('channel_origin', input.channel)
        .eq('phone_or_email', cleanIdentifier)
        .maybeSingle();
      return raceWinner || null;
    }
    console.warn('[crmService] No se pudo crear el contacto:', error.message);
    return null;
  }

  return created;
}

/**
 * Resuelve los campos de CRM para decorar una conversación, incluyendo el
 * nombre del vendedor/asesor asignado (join contra platform_users, no
 * denormalizado, para no arrastrar un nombre desactualizado si esa persona
 * cambia su nombre después).
 */
export async function getCrmFieldsForContact(contactRow: ContactRow): Promise<CrmContactFields> {
  let assignedToName: string | null = null;

  if (contactRow.assigned_to && isSupabaseAdminConfigured) {
    const { data: assignedUser } = await supabaseAdmin
      .from('platform_users')
      .select('full_name')
      .eq('id', contactRow.assigned_to)
      .maybeSingle();
    assignedToName = assignedUser?.full_name || null;
  }

  return {
    contactId: contactRow.id,
    assignedTo: contactRow.assigned_to,
    assignedToName,
    pipelineStage: (contactRow.pipeline_stage as PipelineStage) || DEFAULT_STAGE,
    stageUpdatedAt: contactRow.stage_updated_at,
    lostReason: contactRow.lost_reason,
    tags: contactRow.tags || [],
  };
}

export interface UpdateContactPatch {
  assignedTo?: string | null;
  pipelineStage?: PipelineStage;
  lostReason?: string | null;
}

/**
 * Actualiza asignación/etapa de un contacto y registra la actividad
 * correspondiente en el timeline. El control de acceso (quién puede hacer
 * qué) se valida ANTES de llamar a esta función, en el Route Handler.
 */
export async function updateCrmContact(
  contactId: string,
  patch: UpdateContactPatch,
  actor: { id: string; name: string }
): Promise<ContactRow | null> {
  if (!isSupabaseAdminConfigured) return null;

  const { data: before } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .maybeSingle();

  if (!before) return null;

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.assignedTo !== undefined) updatePayload.assigned_to = patch.assignedTo;
  if (patch.pipelineStage !== undefined) {
    updatePayload.pipeline_stage = patch.pipelineStage;
    updatePayload.stage_updated_at = new Date().toISOString();
  }
  if (patch.lostReason !== undefined) updatePayload.lost_reason = patch.lostReason;

  const { data: updated, error } = await supabaseAdmin
    .from('contacts')
    .update(updatePayload)
    .eq('id', contactId)
    .select('*')
    .maybeSingle();

  if (error || !updated) {
    console.warn('[crmService] No se pudo actualizar el contacto:', error?.message);
    return null;
  }

  if (patch.assignedTo !== undefined && patch.assignedTo !== before.assigned_to) {
    let assignedToName: string | null = null;
    if (patch.assignedTo) {
      const { data: u } = await supabaseAdmin
        .from('platform_users')
        .select('full_name')
        .eq('id', patch.assignedTo)
        .maybeSingle();
      assignedToName = u?.full_name || null;
    }
    await addCrmActivity({
      tenantId: before.tenant_id,
      contactId,
      actorId: actor.id,
      actorName: actor.name,
      type: 'assignment_change',
      content: patch.assignedTo
        ? `Asignado a ${assignedToName || patch.assignedTo}`
        : 'Se quitó la asignación (sin dueño)',
      metadata: { from: before.assigned_to, to: patch.assignedTo },
    });
  }

  if (patch.pipelineStage !== undefined && patch.pipelineStage !== before.pipeline_stage) {
    await addCrmActivity({
      tenantId: before.tenant_id,
      contactId,
      actorId: actor.id,
      actorName: actor.name,
      type: 'stage_change',
      content: `Etapa cambiada de "${before.pipeline_stage}" a "${patch.pipelineStage}"`,
      metadata: { from: before.pipeline_stage, to: patch.pipelineStage },
    });
  }

  return updated;
}

export async function addCrmActivity(input: {
  tenantId: string;
  contactId: string;
  actorId?: string;
  actorName?: string;
  type: CrmActivity['type'];
  content?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseAdminConfigured) return;

  const { error } = await supabaseAdmin.from('crm_activities').insert({
    tenant_id: input.tenantId,
    contact_id: input.contactId,
    actor_id: input.actorId || null,
    actor_name: input.actorName || null,
    type: input.type,
    content: input.content || null,
    metadata: input.metadata || {},
  });

  if (error) {
    console.warn('[crmService] No se pudo registrar actividad CRM:', error.message);
  }
}

function mapActivityRow(row: any): CrmActivity {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    contactId: row.contact_id,
    actorId: row.actor_id || undefined,
    actorName: row.actor_name || undefined,
    type: row.type,
    content: row.content || undefined,
    metadata: row.metadata || undefined,
    createdAt: row.created_at,
  };
}

export async function listCrmActivities(tenantId: string, contactId: string): Promise<CrmActivity[]> {
  if (!isSupabaseAdminConfigured) return [];

  const { data, error } = await supabaseAdmin
    .from('crm_activities')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[crmService] No se pudo listar actividad CRM:', error.message);
    return [];
  }

  return (data || []).map(mapActivityRow);
}

export interface CrmContactListItem {
  contactId: string;
  name: string | null;
  phoneOrEmail: string;
  channelOrigin: string;
  assignedTo: string | null;
  assignedToName: string | null;
  pipelineStage: PipelineStage;
  stageUpdatedAt: string | null;
  lostReason: string | null;
  tags: string[];
  qualificationScore: number | null;
  city: string | null;
  createdAt: string;
}

export interface ContactRowWithAssignee extends ContactRow {
  assigned_user?: { full_name: string } | { full_name: string }[] | null;
}

/**
 * Lee todos los contactos de un tenant, con el nombre del asignado resuelto
 * en la misma consulta (join contra `platform_users`). Devuelve las filas
 * crudas (snake_case) para que el llamador pueda aplicar
 * `filterContactsByVisibility` ANTES de mapear al formato de respuesta —
 * así el filtro de seguridad opera sobre el mismo campo `assigned_to` que ya
 * usan las demás funciones de este archivo.
 */
export async function listContactsForTenant(tenantId: string): Promise<ContactRowWithAssignee[]> {
  if (!isSupabaseAdminConfigured) return [];

  const { data, error } = await supabaseAdmin
    .from('contacts')
    .select('*, assigned_user:platform_users(full_name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[crmService] No se pudo listar contactos del CRM:', error.message);
    return [];
  }

  return (data || []) as ContactRowWithAssignee[];
}

export function mapContactRowToListItem(row: ContactRowWithAssignee): CrmContactListItem {
  const assignedUserRaw = row.assigned_user;
  const assignedToName = Array.isArray(assignedUserRaw) ? assignedUserRaw[0]?.full_name : assignedUserRaw?.full_name;

  return {
    contactId: row.id,
    name: row.name,
    phoneOrEmail: row.phone_or_email,
    channelOrigin: row.channel_origin,
    assignedTo: row.assigned_to,
    assignedToName: assignedToName || null,
    pipelineStage: (row.pipeline_stage as PipelineStage) || DEFAULT_STAGE,
    stageUpdatedAt: row.stage_updated_at,
    lostReason: row.lost_reason,
    tags: row.tags || [],
    qualificationScore: row.qualification_score,
    city: row.city,
    createdAt: row.created_at,
  };
}

/**
 * Aplica la regla de visibilidad del CRM: quien puede administrar el
 * pipeline completo (Director/Coordinador/SuperAdmin) ve todos los
 * contactos del tenant; el resto solo ve los suyos o los que aún no tienen
 * dueño (para poder reclamarlos).
 */
export function filterContactsByVisibility<T extends { assigned_to: string | null }>(
  rows: T[],
  userId: string,
  canManageCRM: boolean
): T[] {
  if (canManageCRM) return rows;
  return rows.filter((r) => r.assigned_to === null || r.assigned_to === userId);
}

export interface CsvContactRow {
  name: string | null;
  phone_or_email: string;
  channel_origin: string;
  pipeline_stage: string;
  assigned_to_name: string | null;
  qualification_score: number | null;
  tags: string[] | null;
  city: string | null;
  created_at: string;
}

/**
 * Convierte una fila cruda de `contacts` (con el join a `platform_users` ya
 * resuelto por `listContactsForTenant`/la consulta de un solo contacto) al
 * formato exacto que espera `buildContactsCsv`.
 */
export function mapContactRowToCsvRow(row: ContactRowWithAssignee): CsvContactRow {
  const assignedUserRaw = row.assigned_user;
  const assignedToName = Array.isArray(assignedUserRaw) ? assignedUserRaw[0]?.full_name : assignedUserRaw?.full_name;

  return {
    name: row.name,
    phone_or_email: row.phone_or_email,
    channel_origin: row.channel_origin,
    pipeline_stage: row.pipeline_stage,
    assigned_to_name: assignedToName || null,
    qualification_score: row.qualification_score,
    tags: row.tags,
    city: row.city,
    created_at: row.created_at,
  };
}

/**
 * Lee un solo contacto (acotado a tenant) con su nombre de asignado ya
 * resuelto, para la exportación individual.
 */
export async function getContactWithAssigneeById(
  tenantId: string,
  contactId: string
): Promise<ContactRowWithAssignee | null> {
  if (!isSupabaseAdminConfigured) return null;

  const { data } = await supabaseAdmin
    .from('contacts')
    .select('*, assigned_user:platform_users(full_name)')
    .eq('tenant_id', tenantId)
    .eq('id', contactId)
    .maybeSingle();

  return (data as ContactRowWithAssignee) || null;
}

/**
 * Construye un CSV simple (RFC 4180) a partir de contactos del CRM — usado
 * tanto para la descarga de un solo contacto como para el pipeline completo.
 */
export function buildContactsCsv(
  rows: Array<{
    name: string | null;
    phone_or_email: string;
    channel_origin: string;
    pipeline_stage: string;
    assigned_to_name: string | null;
    qualification_score: number | null;
    tags: string[] | null;
    city: string | null;
    created_at: string;
  }>
): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = [
    'Nombre',
    'Telefono o Email',
    'Canal',
    'Etapa',
    'Asignado a',
    'Score IA',
    'Etiquetas',
    'Ciudad',
    'Primer Contacto',
  ];

  const lines = rows.map((r) =>
    [
      escape(r.name || 'Sin nombre'),
      escape(r.phone_or_email),
      escape(r.channel_origin),
      escape(r.pipeline_stage),
      escape(r.assigned_to_name || 'Sin asignar'),
      escape(String(r.qualification_score ?? '')),
      escape((r.tags || []).join('; ')),
      escape(r.city || ''),
      escape(r.created_at),
    ].join(',')
  );

  return [header.map(escape).join(','), ...lines].join('\r\n');
}
