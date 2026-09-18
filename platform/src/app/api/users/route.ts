import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/serverAuth';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { MOCK_USERS } from '@/data/mockData';
import { AuthUser } from '@/types/platform';
import { createUserSchema, validationErrorResponse } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { recordAuditLog } from '@/lib/auditLog';

function mapRowToAuthUser(row: Record<string, any>): AuthUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    tenantId: row.tenant_id,
    role: row.role,
    level: row.level || undefined,
    jobTitle: row.job_title || undefined,
    status: row.status,
    notes: row.notes || undefined,
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: row.created_at,
  };
}

/**
 * GET /api/users
 * Directorio completo de usuarios (solo SuperAdmin). Combina la tabla real
 * `platform_users` con el directorio semilla (`MOCK_USERS`) para las cuentas
 * fundacionales que aún no se han migrado a la tabla, sin duplicar por email.
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireSuperAdmin(request);
  if (!authCheck.authorized) return authCheck.response;

  let dbUsers: AuthUser[] = [];
  if (isSupabaseAdminConfigured) {
    const { data, error } = await supabaseAdmin
      .from('platform_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error && !error.message?.includes('does not exist')) {
      logger.warn('Error al listar platform_users', { route: '/api/users', error: error.message });
    }
    if (data) {
      dbUsers = data.map(mapRowToAuthUser);
    }
  }

  const knownEmails = new Set(dbUsers.map((u) => u.email.toLowerCase()));
  const legacySeedUsers = MOCK_USERS.filter((u) => !knownEmails.has(u.email.toLowerCase())).map(
    ({ password, ...rest }) => rest
  );

  return NextResponse.json({ users: [...dbUsers, ...legacySeedUsers] });
}

/**
 * POST /api/users
 * Alta real de un usuario (solo SuperAdmin): crea la cuenta en Supabase Auth
 * con contraseña temporal ya confirmada (sin flujo de verificación por correo,
 * porque quien la da de alta es un administrador, no el propio usuario) y su
 * fila de perfil en `platform_users`.
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireSuperAdmin(request);
  if (!authCheck.authorized) return authCheck.response;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'El cuerpo de la solicitud no es un JSON válido.', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  const parsed = createUserSchema.safeParse(rawBody);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }
  const { email, fullName, tenantId, role, level, jobTitle, password, notes } = parsed.data;

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      {
        error:
          'Configuración interna del servidor incompleta: falta SUPABASE_SERVICE_ROLE_KEY. No se puede crear la cuenta real.',
        code: 'SERVER_CONFIG_ERROR',
      },
      { status: 500 }
    );
  }

  const cleanEmail = String(email).toLowerCase().trim();

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      tenant_id: tenantId || null,
      job_title: jobTitle || undefined,
      level: level || undefined,
      must_change_password: true,
    },
  });

  if (createError || !created?.user) {
    const isDuplicate = createError?.message?.toLowerCase().includes('already registered');
    return NextResponse.json(
      {
        error: isDuplicate
          ? 'Ya existe una cuenta de Supabase Auth con este correo.'
          : createError?.message || 'Error al crear la cuenta en Supabase Auth.',
        code: isDuplicate ? 'DUPLICATE_EMAIL' : 'AUTH_CREATE_ERROR',
      },
      { status: isDuplicate ? 409 : 502 }
    );
  }

  const newUserId = created.user.id;

  const { error: profileError } = await supabaseAdmin.from('platform_users').insert({
    id: newUserId,
    email: cleanEmail,
    full_name: fullName,
    tenant_id: tenantId || null,
    role,
    level: level || null,
    job_title: jobTitle || null,
    status: 'active',
    notes: notes || null,
    must_change_password: true,
  });

  if (profileError) {
    logger.error('Cuenta creada en Auth pero falló el perfil en platform_users', {
      route: '/api/users',
      userId: newUserId,
      error: profileError.message,
    });
    return NextResponse.json(
      {
        error:
          'La cuenta de acceso se creó en Supabase Auth, pero no se pudo guardar su perfil (tenant/rol). Verifica que la tabla platform_users exista y reintenta la asignación de rol manualmente.',
        code: 'PROFILE_INSERT_FAILED',
        userId: newUserId,
      },
      { status: 207 }
    );
  }

  const user: AuthUser = {
    id: newUserId,
    email: cleanEmail,
    fullName,
    tenantId: tenantId || null,
    role,
    level: level || undefined,
    jobTitle: jobTitle || undefined,
    status: 'active',
    notes: notes || undefined,
    mustChangePassword: true,
    createdAt: new Date().toISOString().split('T')[0],
  };

  await recordAuditLog({
    action: 'user.create',
    actorId: authCheck.user.id,
    actorEmail: authCheck.user.email,
    targetId: newUserId,
    details: { email: cleanEmail, role, tenantId: tenantId || null },
  });

  return NextResponse.json({ user }, { status: 201 });
}
