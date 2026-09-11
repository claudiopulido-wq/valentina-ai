import { AuthUser } from '../types/platform';

export interface KnowledgeItem {
  id: number;
  titulo: string;
  contenido: string;
  categoria: string;
  activo?: boolean;
  indexado?: boolean;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgeServiceError {
  message: string;
  code?: string;
  status: number;
}

/**
 * Encabezados de autorización y sesión para las llamadas a los Route Handlers de Next.js.
 */
async function getAuthHeaders(user: AuthUser | null): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (user) {
    headers['x-user-id'] = user.id;
  }

  // Si Supabase está disponible en el browser, adjuntar el JWT real de la sesión
  if (typeof window !== 'undefined') {
    try {
      const { supabase } = await import('./supabaseClient');
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    } catch (e) {
      // Fallback suave
    }
  }

  return headers;
}

/**
 * Obtiene la lista completa de documentos activos para un tenant.
 */
export async function fetchKnowledgeDocs(
  tenantId: number,
  user: AuthUser | null
): Promise<KnowledgeItem[]> {
  const headers = await getAuthHeaders(user);
  const response = await fetch(`/api/tenants/${tenantId}/knowledge`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: KnowledgeServiceError = {
      message: errorData.error || `Error al obtener documentos (${response.status})`,
      code: errorData.code,
      status: response.status,
    };
    throw error;
  }

  const data = await response.json();
  // La API de Railway puede devolver { items: [...] } o un arreglo directo
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data.items)) {
    return data.items;
  }
  return [];
}

/**
 * Crea una nueva entrada en la base de conocimientos con cálculo de embeddings vectoriales.
 */
export async function createKnowledgeDoc(
  tenantId: number,
  user: AuthUser | null,
  payload: { titulo: string; contenido: string; categoria: string }
): Promise<KnowledgeItem> {
  const headers = await getAuthHeaders(user);
  const response = await fetch(`/api/tenants/${tenantId}/knowledge`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: KnowledgeServiceError = {
      message:
        response.status === 409
          ? 'Ya existe un documento con este título. Por favor ingresa uno diferente.'
          : data.error || `Error al guardar documento (${response.status})`,
      code: data.code,
      status: response.status,
    };
    throw error;
  }

  return data.item || data;
}

/**
 * Edición parcial de un documento existente.
 */
export async function updateKnowledgeDoc(
  tenantId: number,
  user: AuthUser | null,
  id: number,
  payload: Partial<{ titulo: string; contenido: string; categoria: string }>
): Promise<KnowledgeItem> {
  const headers = await getAuthHeaders(user);
  const response = await fetch(`/api/tenants/${tenantId}/knowledge/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: KnowledgeServiceError = {
      message:
        response.status === 409
          ? 'Ya existe un documento con este título. Por favor ingresa uno diferente.'
          : data.error || `Error al actualizar documento (${response.status})`,
      code: data.code,
      status: response.status,
    };
    throw error;
  }

  return data.item || data;
}

/**
 * Eliminación lógica de un documento en la base de conocimientos.
 */
export async function deleteKnowledgeDoc(
  tenantId: number,
  user: AuthUser | null,
  id: number
): Promise<void> {
  const headers = await getAuthHeaders(user);
  const response = await fetch(`/api/tenants/${tenantId}/knowledge/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok && response.status !== 204) {
    const data = await response.json().catch(() => ({}));
    const error: KnowledgeServiceError = {
      message: data.error || `Error al eliminar documento (${response.status})`,
      code: data.code,
      status: response.status,
    };
    throw error;
  }
}

/**
 * Reintenta el cálculo del embedding vectorial en Voyage AI.
 */
export async function reindexKnowledgeDoc(
  tenantId: number,
  user: AuthUser | null,
  id: number
): Promise<KnowledgeItem> {
  const headers = await getAuthHeaders(user);
  const response = await fetch(`/api/tenants/${tenantId}/knowledge/${id}/reindexar`, {
    method: 'POST',
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: KnowledgeServiceError = {
      message: data.error || `Error al reindexar documento (${response.status})`,
      code: data.code,
      status: response.status,
    };
    throw error;
  }

  return data.item || data;
}
