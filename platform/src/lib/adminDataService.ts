import { AuthUser, Tenant } from '../types/platform';

export interface AdminServiceError {
  message: string;
  code?: string;
  status: number;
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (typeof window !== 'undefined') {
    try {
      const { supabase } = await import('./supabaseClient');
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    } catch {
      // Sin sesión disponible: la petición se hará sin Authorization y el
      // servidor la rechazará con 401, que es el comportamiento correcto.
    }
  }

  return headers;
}

async function parseErrorOrThrow(response: Response): Promise<never> {
  const data = await response.json().catch(() => ({}));
  const error: AdminServiceError = {
    message: data.error || `Error inesperado (${response.status})`,
    code: data.code,
    status: response.status,
  };
  throw error;
}

/** Perfil autoritativo del usuario autenticado (rol, tenant, nivel real). */
export async function fetchMyProfile(): Promise<AuthUser | null> {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/users/me', { headers, cache: 'no-store' });
  if (!response.ok) return null;
  const data = await response.json().catch(() => ({}));
  return data.user || null;
}

/** Directorio de tenants: todos para SuperAdmin, solo el propio para el resto. */
export async function fetchTenants(): Promise<Tenant[]> {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/tenants', { headers, cache: 'no-store' });
  if (!response.ok) return [];
  const data = await response.json().catch(() => ({}));
  return Array.isArray(data.tenants) ? data.tenants : [];
}

export async function createTenant(tenant: Tenant): Promise<Tenant> {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/tenants', {
    method: 'POST',
    headers,
    body: JSON.stringify(tenant),
  });
  if (!response.ok) await parseErrorOrThrow(response);
  const data = await response.json();
  return data.tenant;
}

export async function updateTenant(tenantId: string, patch: Partial<Tenant>): Promise<Tenant> {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/tenants/${tenantId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patch),
  });
  if (!response.ok) await parseErrorOrThrow(response);
  const data = await response.json();
  return data.tenant;
}

/** Directorio completo de usuarios (solo SuperAdmin). */
export async function fetchUsers(): Promise<AuthUser[]> {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/users', { headers, cache: 'no-store' });
  if (!response.ok) return [];
  const data = await response.json().catch(() => ({}));
  return Array.isArray(data.users) ? data.users : [];
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  tenantId: string | null;
  role: AuthUser['role'];
  level?: AuthUser['level'];
  jobTitle?: string;
  notes?: string;
  password: string;
}

/** Alta real de usuario: crea la cuenta en Supabase Auth + su perfil. */
export async function createUser(payload: CreateUserPayload): Promise<AuthUser> {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/users', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseErrorOrThrow(response);
  const data = await response.json();
  return data.user;
}

export async function updateUser(
  userId: string,
  patch: Partial<Pick<AuthUser, 'status' | 'role' | 'level' | 'tenantId' | 'jobTitle' | 'notes'>>
): Promise<AuthUser> {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patch),
  });
  if (!response.ok) await parseErrorOrThrow(response);
  const data = await response.json();
  return data.user;
}

/** Resetea la contraseña REAL en Supabase Auth y devuelve la nueva clave temporal (una sola vez). */
export async function resetUserPassword(userId: string): Promise<string> {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/users/${userId}/reset-password`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) await parseErrorOrThrow(response);
  const data = await response.json();
  return data.tempPassword;
}

/** Limpia la bandera `mustChangePassword` del propio perfil tras el primer cambio de clave. */
export async function completeForcedPasswordChange(): Promise<void> {
  const headers = await getAuthHeaders();
  await fetch('/api/users/me/complete-password-change', { method: 'POST', headers }).catch(() => {
    // Best-effort: si falla, el usuario ya cambió su contraseña real en Supabase Auth;
    // solo queda desactualizada la bandera de UI, no es un error bloqueante.
  });
}

export interface InviteUserPayload {
  email: string;
  fullName: string;
  tenantId: string | null;
  level?: AuthUser['level'];
  jobTitle?: string;
  notes?: string;
}

/**
 * Agrega un usuario a una empresa YA EXISTENTE vía invitación por correo
 * (a diferencia de `createUser`, aquí nadie ve ni transmite ninguna
 * contraseña: el invitado pone la suya propia al aceptar el enlace).
 */
export async function inviteUser(payload: InviteUserPayload): Promise<AuthUser> {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/users/invite', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseErrorOrThrow(response);
  const data = await response.json();
  return data.user;
}

/** Regenera y reenvía el enlace de invitación de un usuario que sigue en estado `pending`. */
export async function resendInvitation(userId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/users/${userId}/resend-invitation`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) await parseErrorOrThrow(response);
}

/** Marca la invitación propia como aceptada (perfil pasa de `pending` a `active`). */
export async function completeInvitation(): Promise<void> {
  const headers = await getAuthHeaders();
  await fetch('/api/users/me/complete-invitation', { method: 'POST', headers }).catch(() => {
    // Best-effort, igual que completeForcedPasswordChange.
  });
}

export interface SendWelcomeEmailResult {
  success: boolean;
  emailSimulated?: boolean;
  error?: string;
}

/** Envía de verdad el correo de bienvenida del Expediente Digital al usuario indicado. */
export async function sendDossierWelcomeEmail(tenantId: string, userId: string): Promise<SendWelcomeEmailResult> {
  const headers = await getAuthHeaders();
  try {
    const response = await fetch('/api/dossier/send-welcome-email', {
      method: 'POST',
      headers,
      body: JSON.stringify({ tenantId, userId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'No se pudo enviar el correo.' };
    }
    return { success: true, emailSimulated: data.emailSimulated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de red desconocido.' };
  }
}

/** Registra en el historial de auditoría que se imprimió/copió un documento del Expediente (best-effort). */
export async function logDossierEmission(
  tenantId: string,
  userId: string | null | undefined,
  documentType: 'quote' | 'agreement' | 'raci' | 'credentials' | 'all',
  action: 'printed' | 'copied'
): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    await fetch('/api/dossier/log-emission', {
      method: 'POST',
      headers,
      body: JSON.stringify({ tenantId, userId: userId || null, documentType, action }),
    });
  } catch {
    // Best-effort: si falla el registro de auditoría, no debe bloquear al usuario.
  }
}

export interface DossierEmission {
  id: string;
  tenant_id: string;
  user_id: string | null;
  folio: string;
  document_type: string;
  action: string;
  actor_email: string;
  created_at: string;
}

/** Historial de auditoría de un Expediente (qué se imprimió/copió/mandó y cuándo). */
export async function fetchDossierEmissions(tenantId: string): Promise<DossierEmission[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/dossier/emissions?tenantId=${encodeURIComponent(tenantId)}`, {
    headers,
    cache: 'no-store',
  });
  if (!response.ok) return [];
  const data = await response.json().catch(() => ({}));
  return Array.isArray(data.emissions) ? data.emissions : [];
}
