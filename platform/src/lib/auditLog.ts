import { supabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';
import { logger } from './logger';

export type AuditAction =
  | 'tenant.create'
  | 'tenant.update'
  | 'user.create'
  | 'user.update'
  | 'user.password_reset'
  | 'user.invite'
  | 'user.invite_resend'
  | 'user.invite_accept';

interface AuditEntryInput {
  action: AuditAction;
  actorId: string;
  actorEmail: string;
  targetId: string;
  details?: Record<string, unknown>;
}

/**
 * Registra una acción administrativa en la tabla `audit_log` (ver SQL en
 * SuperAdminView → "Ver esquema SQL"). Best-effort y no bloqueante: si la
 * tabla no existe todavía o Supabase no está configurado, solo se deja
 * constancia en el log estructurado — nunca se revierte ni se bloquea la
 * acción principal por un fallo de auditoría.
 *
 * Antes de esto no existía ningún registro de quién creó/editó un tenant o
 * usuario, ni cuándo: sección 4.5 de la auditoría ("Auditoría de acciones
 * administrativas").
 */
export async function recordAuditLog(entry: AuditEntryInput): Promise<void> {
  if (!isSupabaseAdminConfigured) {
    logger.info('Acción administrativa (sin persistir: falta SUPABASE_SERVICE_ROLE_KEY)', {
      action: entry.action,
      actorId: entry.actorId,
      targetId: entry.targetId,
    });
    return;
  }

  try {
    const { error } = await supabaseAdmin.from('audit_log').insert({
      action: entry.action,
      actor_id: entry.actorId,
      actor_email: entry.actorEmail,
      target_id: entry.targetId,
      details: entry.details || {},
    });

    if (error && !error.message?.includes('does not exist')) {
      logger.warn('No se pudo escribir en audit_log', { action: entry.action, error: error.message });
    }
  } catch (err: any) {
    logger.warn('Excepción al escribir en audit_log', { action: entry.action, error: err?.message });
  }
}
