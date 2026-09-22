import { supabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';
import { logger } from './logger';

/**
 * Auditoría de emisiones del Expediente Digital B2B: cada vez que alguien
 * imprime, copia el correo, o envía el correo de bienvenida real de un
 * Expediente, queda un registro inmutable con un snapshot de los datos
 * usados en ese momento (para que ediciones futuras al tenant no reescriban
 * la historia de lo que realmente se le mandó a cada cliente).
 */

export type DossierDocumentType = 'quote' | 'agreement' | 'raci' | 'credentials' | 'all';
export type DossierAction = 'printed' | 'copied' | 'email_sent';

export interface DossierEmissionRow {
  id: string;
  tenant_id: string;
  user_id: string | null;
  folio: string;
  document_type: DossierDocumentType;
  action: DossierAction;
  snapshot: Record<string, unknown>;
  actor_id: string;
  actor_email: string;
  created_at: string;
}

export async function recordDossierEmission(input: {
  tenantId: string;
  userId?: string | null;
  folio: string;
  documentType: DossierDocumentType;
  action: DossierAction;
  snapshot: Record<string, unknown>;
  actorId: string;
  actorEmail: string;
}): Promise<void> {
  if (!isSupabaseAdminConfigured) return;

  const { error } = await supabaseAdmin.from('dossier_emissions').insert({
    tenant_id: input.tenantId,
    user_id: input.userId || null,
    folio: input.folio,
    document_type: input.documentType,
    action: input.action,
    snapshot: input.snapshot,
    actor_id: input.actorId,
    actor_email: input.actorEmail,
  });

  if (error && !error.message?.includes('does not exist')) {
    logger.warn('No se pudo registrar la emisión del Expediente', {
      tenantId: input.tenantId,
      action: input.action,
      error: error.message,
    });
  }
}

export async function listDossierEmissions(tenantId: string): Promise<DossierEmissionRow[]> {
  if (!isSupabaseAdminConfigured) return [];

  const { data, error } = await supabaseAdmin
    .from('dossier_emissions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    if (!error.message?.includes('does not exist')) {
      logger.warn('No se pudo listar el historial de emisiones del Expediente', {
        tenantId,
        error: error.message,
      });
    }
    return [];
  }

  return data || [];
}
