import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/serverAuth';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { AuthUser } from '@/types/platform';
import { inviteUserSchema, validationErrorResponse } from '@/lib/validation';
import { sendMail } from '@/lib/mailer';
import { logger } from '@/lib/logger';
import { recordAuditLog } from '@/lib/auditLog';

const PORTAL_BASE_URL = process.env.PLATFORM_PUBLIC_URL || 'https://portal.valentina-ai.mx';

/**
 * POST /api/users/invite
 * Agrega un usuario a una empresa YA EXISTENTE (a diferencia de POST
 * /api/users, que siempre crea la cuenta con una contraseña que el
 * SuperAdmin ve y transmite manualmente). Aquí nadie ve ni transmite ninguna
 * contraseña: `auth.admin.generateLink({ type: 'invite' })` crea la cuenta
 * en Supabase Auth con una clave aleatoria interna y devuelve un enlace de
 * un solo uso que nosotros mismos enviamos por correo con nuestra marca
 * (Supabase no manda ningún correo en este modo).
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireSuperAdmin(request);
  if (!authCheck.authorized) return authCheck.response;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es un JSON válido.', code: 'INVALID_JSON' }, { status: 400 });
  }

  const parsed = inviteUserSchema.safeParse(rawBody);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }
  const { email, fullName, tenantId, level, jobTitle, notes } = parsed.data;

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      {
        error: 'Configuración interna del servidor incompleta: falta SUPABASE_SERVICE_ROLE_KEY. No se puede invitar la cuenta real.',
        code: 'SERVER_CONFIG_ERROR',
      },
      { status: 500 }
    );
  }

  const cleanEmail = String(email).toLowerCase().trim();

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'invite',
    email: cleanEmail,
    options: {
      redirectTo: `${PORTAL_BASE_URL}/aceptar-invitacion`,
      data: {
        full_name: fullName,
        role: 'tenant_admin',
        tenant_id: tenantId || null,
        level: level || undefined,
        job_title: jobTitle || undefined,
      },
    },
  });

  if (linkError || !linkData?.user) {
    const isDuplicate = linkError?.message?.toLowerCase().includes('already registered');
    return NextResponse.json(
      {
        error: isDuplicate
          ? 'Ya existe una cuenta de Supabase Auth con este correo.'
          : linkError?.message || 'Error al generar la invitación en Supabase Auth.',
        code: isDuplicate ? 'DUPLICATE_EMAIL' : 'AUTH_INVITE_ERROR',
      },
      { status: isDuplicate ? 409 : 502 }
    );
  }

  const newUserId = linkData.user.id;
  const actionLink = linkData.properties?.action_link;

  const { error: profileError } = await supabaseAdmin.from('platform_users').insert({
    id: newUserId,
    email: cleanEmail,
    full_name: fullName,
    tenant_id: tenantId || null,
    role: 'tenant_admin',
    level: level || null,
    job_title: jobTitle || null,
    status: 'pending',
    notes: notes || null,
    must_change_password: false,
  });

  if (profileError) {
    logger.error('Invitación creada en Auth pero falló el perfil en platform_users', {
      route: '/api/users/invite',
      userId: newUserId,
      error: profileError.message,
    });
    return NextResponse.json(
      {
        error:
          'La invitación se generó en Supabase Auth, pero no se pudo guardar su perfil (tenant/rol). Verifica que la tabla platform_users exista.',
        code: 'PROFILE_INSERT_FAILED',
        userId: newUserId,
      },
      { status: 207 }
    );
  }

  let mailResult: Awaited<ReturnType<typeof sendMail>> = { success: true, simulated: true };
  if (actionLink) {
    mailResult = await sendMail({
      to: cleanEmail,
      subject: 'Tu acceso a Valentina AI — Consola Empresarial',
      senderName: 'Valentina AI',
      html: buildInviteEmailHtml({ fullName, actionLink }),
    });
  }

  await recordAuditLog({
    action: 'user.invite',
    actorId: authCheck.user.id,
    actorEmail: authCheck.user.email,
    targetId: newUserId,
    details: { email: cleanEmail, tenantId: tenantId || null, level: level || null, emailSimulated: mailResult.simulated },
  });

  const user: AuthUser = {
    id: newUserId,
    email: cleanEmail,
    fullName,
    tenantId: tenantId || null,
    role: 'tenant_admin',
    level: level || undefined,
    jobTitle: jobTitle || undefined,
    status: 'pending',
    notes: notes || undefined,
    mustChangePassword: false,
    createdAt: new Date().toISOString().split('T')[0],
  };

  return NextResponse.json(
    { user, emailSimulated: mailResult.simulated, emailError: mailResult.success ? undefined : mailResult.error },
    { status: 201 }
  );
}

function buildInviteEmailHtml(input: { fullName: string; actionLink: string }): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; background: #f0f4f9; margin: 0; padding: 32px 16px;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #dadce0; padding: 32px;">
    <h1 style="font-size: 18px; color: #1f1f1f; margin: 0 0 16px;">Bienvenido a Valentina AI</h1>
    <p style="font-size: 14px; color: #3c4043; line-height: 1.6;">
      Hola ${escapeHtml(input.fullName)}, se te dio de alta en la Consola Empresarial de Valentina AI.
      Para activar tu cuenta y establecer tu propia contraseña, haz clic en el siguiente botón:
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${input.actionLink}" style="display: inline-block; background: #0b57d0; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
        Activar mi cuenta
      </a>
    </div>
    <p style="font-size: 12px; color: #5f6368; line-height: 1.5;">
      Si no esperabas este correo, puedes ignorarlo con confianza — tu acceso no quedará activo hasta que sigas este enlace.
    </p>
  </div>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
