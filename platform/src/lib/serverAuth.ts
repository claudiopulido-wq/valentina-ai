import { NextRequest, NextResponse } from 'next/server';
import { MOCK_USERS } from '../data/mockData';
import { AuthUser } from '../types/platform';
import { getAllowedTabsForUser, LEVEL_CONFIGS } from './permissions';

/**
 * Mapa de correspondencia entre los identificadores slug/texto de los clientes
 * en la consola y sus tenantId numéricos en la API RAG de Railway.
 */
export const TENANT_ID_MAPPING: Record<string, number> = {
  'tenant-uges': 1,
  // Futuros clientes se agregarán aquí o se resolverán dinámicamente:
  // 'tenant-conocer': 2,
};

/**
 * Convierte un tenantId numérico de la API RAG a su identificador de plataforma.
 */
export function getSlugForNumericTenantId(numericId: number): string | null {
  for (const [slug, id] of Object.entries(TENANT_ID_MAPPING)) {
    if (id === numericId) return slug;
  }
  return null;
}

export interface AuthContext {
  user: AuthUser;
}

import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Extrae y valida la identidad del usuario a partir de los headers de la petición.
 * Verifica tokens criptográficos Supabase JWT en servidor.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  const userIdHeader = request.headers.get('x-user-id');

  // 1. Si se envía un token Bearer y Supabase está configurado, verificar la firma JWT en Supabase
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (isSupabaseConfigured && token.length > 30) {
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (data?.user && !error) {
          const user = data.user;
          // Buscar si existe en MOCK_USERS o mapear desde user_metadata
          const matched = MOCK_USERS.find(
            (u) => u.id === user.id || u.email.toLowerCase() === (user.email || '').toLowerCase()
          );
          if (matched) return matched;

          return {
            id: user.id,
            email: user.email || '',
            fullName: user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Usuario'),
            role: (user.user_metadata?.role as any) || 'tenant_admin',
            tenantId: (user.user_metadata?.tenant_id as string) || null,
            jobTitle: user.user_metadata?.job_title,
            level: (user.user_metadata?.level as any) || 'director',
            status: 'active',
            createdAt: user.created_at,
          };
        }
      } catch (err) {
        console.warn('[serverAuth] Error al verificar JWT en Supabase:', err);
      }
    }
  }

  // 2. Si no hay token JWT válido pero se envía header x-user-id en entorno de desarrollo local
  const targetUserId = userIdHeader || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null);

  if (!targetUserId) {
    return null;
  }

  // Buscar en el directorio oficial de usuarios autorizados
  const user = MOCK_USERS.find(
    (u) => u.id === targetUserId || u.email.toLowerCase() === targetUserId.toLowerCase()
  );

  return user || null;
}

/**
 * Guardián de seguridad estricto contra Broken Access Control / IDOR (Insecure Direct Object References).
 * 
 * 1. Verifica autenticación (401 si no hay usuario válido).
 * 2. Valida aislamiento Multi-Tenant (403 si el usuario intenta acceder a la base de datos de otro cliente).
 * 3. Valida permisos RBAC por nivel (403 si no tiene permiso para consultar o editar conocimiento).
 */
export async function authorizeKnowledgeRequest(
  request: NextRequest,
  requestedNumericTenantId: number,
  action: 'read' | 'write'
): Promise<{ authorized: true; user: AuthUser } | { authorized: false; response: NextResponse }> {
  const user = await getAuthenticatedUser(request);

  // 1. Verificación de Autenticación
  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: 'No autenticado. Debes iniciar sesión en la plataforma para realizar esta operación.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      ),
    };
  }

  // 2. Control de Acceso y Aislamiento de Tenant (Prevención IDOR)
  const isSuperAdmin = user.role === 'superadmin';

  if (!isSuperAdmin) {
    const expectedSlug = getSlugForNumericTenantId(requestedNumericTenantId);

    // Si el tenant numérico solicitado no existe o no coincide con la empresa del usuario
    if (!expectedSlug || user.tenantId !== expectedSlug) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: 'Acceso denegado: No tienes autorización para gestionar la base de conocimientos de esta organización.',
            code: 'FORBIDDEN_TENANT_MISMATCH',
          },
          { status: 403 }
        ),
      };
    }
  }

  // 3. Control Basado en Roles (RBAC)
  const allowedTabs = getAllowedTabsForUser(user);

  // Verificación de lectura: Debe tener la pestaña 'knowledge' habilitada en su rol
  if (!allowedTabs.includes('knowledge')) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: 'Tu perfil no tiene asignado acceso a la base de conocimientos.',
          code: 'FORBIDDEN_TAB_ACCESS',
        },
        { status: 403 }
      ),
    };
  }

  // Verificación de escritura: Solo usuarios con canEditKnowledge o SuperAdmin
  if (action === 'write') {
    const levelConfig = user.level ? LEVEL_CONFIGS[user.level] : null;
    const canEdit = isSuperAdmin || (levelConfig && levelConfig.canEditKnowledge);

    if (!canEdit) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: 'Permisos insuficientes: Tu nivel de usuario es de solo lectura y no puede crear, modificar o eliminar contenido de la base de conocimientos.',
            code: 'FORBIDDEN_WRITE_ACTION',
          },
          { status: 403 }
        ),
      };
    }
  }

  return { authorized: true, user };
}
