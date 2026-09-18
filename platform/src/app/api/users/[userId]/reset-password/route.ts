import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/serverAuth';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';
import { recordAuditLog } from '@/lib/auditLog';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/** Contraseña temporal aleatoria de alta entropía (no un patrón adivinable como "Val_slug!2026"). */
function generateTempPassword(): string {
  return `Val-${randomBytes(9).toString('base64url')}!1`;
}

/**
 * POST /api/users/[userId]/reset-password
 * Resetea la contraseña REAL en Supabase Auth (solo SuperAdmin). A diferencia
 * de la versión anterior (que solo cambiaba un campo en memoria del navegador
 * sin tocar la cuenta real), esta ruta llama a `auth.admin.updateUserById`
 * con la service_role key, de modo que la nueva clave temporal sí funciona
 * para iniciar sesión.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const authCheck = await requireSuperAdmin(request);
  if (!authCheck.authorized) return authCheck.response;

  const { userId } = await params;

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      {
        error:
          'Configuración interna del servidor incompleta: falta SUPABASE_SERVICE_ROLE_KEY. No se puede resetear la contraseña real.',
        code: 'SERVER_CONFIG_ERROR',
      },
      { status: 500 }
    );
  }

  const { data: existing, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (fetchError || !existing?.user) {
    return NextResponse.json(
      {
        error:
          'No existe una cuenta de Supabase Auth para este usuario todavía (probablemente nunca inició sesión con contraseña real). Debes darla de alta primero.',
        code: 'AUTH_ACCOUNT_NOT_FOUND',
      },
      { status: 404 }
    );
  }

  const tempPassword = generateTempPassword();

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: tempPassword,
    user_metadata: {
      ...existing.user.user_metadata,
      must_change_password: true,
    },
  });

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message, code: 'PASSWORD_RESET_FAILED' },
      { status: 500 }
    );
  }

  // Reflejar el estado en el perfil (best-effort: si la tabla no existe aún, no bloquea el reset).
  const { error: profileError } = await supabaseAdmin
    .from('platform_users')
    .update({ must_change_password: true, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (profileError && !profileError.message?.includes('does not exist')) {
    logger.warn('No se pudo actualizar platform_users tras el reset', {
      route: '/api/users/[userId]/reset-password',
      userId,
      error: profileError.message,
    });
  }

  await recordAuditLog({
    action: 'user.password_reset',
    actorId: authCheck.user.id,
    actorEmail: authCheck.user.email,
    targetId: userId,
  });

  return NextResponse.json({ tempPassword });
}
