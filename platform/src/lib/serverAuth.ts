import { NextRequest, NextResponse } from 'next/server';
import { MOCK_USERS } from '../data/mockData';
import { AuthUser } from '../types/platform';
import { getAllowedTabsForUser, LEVEL_CONFIGS } from './permissions';
import { supabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';

/**
 * Respaldo mínimo mientras no exista la tabla `tenants` en Supabase (ver
 * sección "Persistencia de Tenants/Usuarios" del SQL en SuperAdminView). En
 * cuanto la tabla exista, `getSlugForNumericTenantId` deja de usar este mapa
 * y resuelve dinámicamente cualquier tenant dado de alta, no solo UGES.
 */
const FALLBACK_TENANT_ID_MAPPING: Record<string, number> = {
  'tenant-uges': 1,
};

/**
 * Convierte un tenantId numérico de la API RAG a su identificador de plataforma
 * (slug). Se resuelve dinámicamente contra la tabla `tenants` en Supabase para
 * que cualquier cliente dado de alta (no solo UGES) tenga aislamiento correcto
 * de su base de conocimientos. Si la tabla aún no existe o el admin client no
 * está configurado, cae al mapa estático de respaldo.
 */
export async function getSlugForNumericTenantId(numericId: number): Promise<string | null> {
  if (isSupabaseAdminConfigured) {
    try {
      const { data, error } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .eq('railway_tenant_id', numericId)
        .maybeSingle();

      if (!error && data?.id) {
        return data.id as string;
      }
    } catch (err) {
      console.warn('[serverAuth] No se pudo resolver tenant vía Supabase, usando respaldo estático:', err);
    }
  }

  for (const [slug, id] of Object.entries(FALLBACK_TENANT_ID_MAPPING)) {
    if (id === numericId) return slug;
  }
  return null;
}

/**
 * Guardián simple para rutas exclusivas de SuperAdmin (alta/edición de
 * tenants y usuarios, reseteo de contraseñas). Reutiliza la misma
 * verificación de JWT que `getAuthenticatedUser`.
 */
export async function requireSuperAdmin(
  request: NextRequest
): Promise<{ authorized: true; user: AuthUser } | { authorized: false; response: NextResponse }> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'No autenticado.', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    };
  }

  if (user.role !== 'superadmin') {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Solo un SuperAdmin puede realizar esta operación.', code: 'FORBIDDEN_NOT_SUPERADMIN' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user };
}

export interface AuthContext {
  user: AuthUser;
}

import { supabase, isSupabaseConfigured } from './supabaseClient';

interface PlatformUserRow {
  id: string;
  email: string;
  full_name: string;
  tenant_id: string | null;
  role: string;
  level?: string | null;
  job_title?: string | null;
  status: string;
  notes?: string | null;
  must_change_password?: boolean | null;
  created_at: string;
}

/**
 * Busca el perfil de un usuario en la tabla `platform_users` primero por id
 * (coincide con auth.users.id) y, si no aparece, por correo. Dos consultas
 * simples en vez de un filtro `.or()` armado con texto interpolado, para no
 * depender de escapar correctamente valores dentro de la sintaxis de filtros
 * de PostgREST.
 */
async function findPlatformUserProfile(id: string, email: string): Promise<PlatformUserRow | null> {
  const { data: byId } = await supabaseAdmin
    .from('platform_users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (byId) return byId;

  if (!email) return null;

  const { data: byEmail } = await supabaseAdmin
    .from('platform_users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  return byEmail || null;
}

function mapProfileRowToAuthUser(row: PlatformUserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    tenantId: row.tenant_id,
    role: row.role as AuthUser['role'],
    level: (row.level as AuthUser['level']) || undefined,
    jobTitle: row.job_title || undefined,
    status: row.status as AuthUser['status'],
    notes: row.notes || undefined,
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: row.created_at,
  };
}

/**
 * Extrae y valida la identidad del usuario a partir de los headers de la petición.
 * Verifica tokens criptográficos Supabase JWT en servidor.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');

  // Única vía de autenticación soportada: un JWT de Supabase Auth verificado
  // criptográficamente en el servidor. El header `x-user-id` NUNCA se acepta
  // como prueba de identidad: cualquier cliente puede enviarlo con un valor
  // arbitrario (spoofing / IDOR), por lo que fue eliminado por completo.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!isSupabaseConfigured || token.length < 30) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (!data?.user || error) {
      return null;
    }

    const user = data.user;
    const email = (user.email || '').toLowerCase();

    // 1. Fuente de verdad real: tabla `platform_users` en Supabase. Esto permite
    //    que cuentas provisionadas después del arranque (o desde otro navegador)
    //    resuelvan su perfil correctamente, en vez de depender del directorio
    //    estático compilado en el bundle.
    if (isSupabaseAdminConfigured) {
      try {
        const profile = await findPlatformUserProfile(user.id, email);
        if (profile) return mapProfileRowToAuthUser(profile);
      } catch (err) {
        console.warn('[serverAuth] Error al consultar platform_users:', err);
      }
    }

    // 2. Directorio semilla heredado (cuentas fundacionales aún no migradas a la tabla)
    const matched = MOCK_USERS.find(
      (u) => u.id === user.id || u.email.toLowerCase() === email
    );
    if (matched) return matched;

    // 3. Último recurso: sintetizar el perfil desde los metadatos del JWT
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
  } catch (err) {
    console.warn('[serverAuth] Error al verificar JWT en Supabase:', err);
    return null;
  }
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
    const expectedSlug = await getSlugForNumericTenantId(requestedNumericTenantId);

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
