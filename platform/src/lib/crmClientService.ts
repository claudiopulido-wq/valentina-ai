import { getAuthHeaders } from './adminDataService';
import { CrmActivity, PipelineStage } from '../types/platform';

/**
 * Cliente del CRM interno. `tenantId` es siempre el slug interno del tenant
 * (p.ej. `tenant-valentina-ai`), no el id numérico de Railway — coincide con
 * `currentTenant.id` en toda la plataforma.
 */

export interface CrmPatchResult {
  success: boolean;
  crm?: {
    contactId: string;
    assignedTo: string | null;
    assignedToName: string | null;
    pipelineStage: PipelineStage;
    stageUpdatedAt: string | null;
    lostReason: string | null;
    tags: string[];
  };
  error?: string;
}

async function patchCrmContact(
  tenantId: string,
  contactId: string,
  patch: Record<string, unknown>
): Promise<CrmPatchResult> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/tenants/${tenantId}/crm/contacts/${contactId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(patch),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'No se pudo actualizar el CRM.' };
    }
    return { success: true, crm: data.crm };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de red desconocido.' };
  }
}

export function claimLead(tenantId: string, contactId: string, userId: string): Promise<CrmPatchResult> {
  return patchCrmContact(tenantId, contactId, { assignedTo: userId });
}

export function reassignLead(
  tenantId: string,
  contactId: string,
  userId: string | null
): Promise<CrmPatchResult> {
  return patchCrmContact(tenantId, contactId, { assignedTo: userId });
}

export function changePipelineStage(
  tenantId: string,
  contactId: string,
  stage: PipelineStage,
  lostReason?: string
): Promise<CrmPatchResult> {
  return patchCrmContact(tenantId, contactId, {
    pipelineStage: stage,
    ...(lostReason !== undefined ? { lostReason } : {}),
  });
}

export async function addCrmNote(
  tenantId: string,
  contactId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/tenants/${tenantId}/crm/contacts/${contactId}/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'No se pudo agregar la nota.' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de red desconocido.' };
  }
}

export async function fetchCrmActivities(tenantId: string, contactId: string): Promise<CrmActivity[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/tenants/${tenantId}/crm/contacts/${contactId}/activities`, {
      headers,
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const data = await response.json().catch(() => ({}));
    return Array.isArray(data?.activities) ? data.activities : [];
  } catch {
    return [];
  }
}

export interface CrmTeamMember {
  id: string;
  fullName: string;
  level: string | null;
}

export async function fetchCrmTeam(tenantId: string): Promise<CrmTeamMember[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/tenants/${tenantId}/crm/team`, { headers, cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json().catch(() => ({}));
    return Array.isArray(data?.members) ? data.members : [];
  } catch {
    return [];
  }
}
