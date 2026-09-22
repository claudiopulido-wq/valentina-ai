import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/serverAuth';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { sendMail } from '@/lib/mailer';
import { recordAuditLog } from '@/lib/auditLog';

const PORTAL_BASE_URL = process.env.PLATFORM_PUBLIC_URL || 'https://portal.valentina-ai.mx';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * POST /api/users/[userId]/resend-invitation
 * Vuelve a generar el enlace de invitación (el anterior sigue siendo válido
 * hasta su expiración, pero regenerarlo cubre el caso de "se me venció" o
 * "no me llegó") y reenvía el correo. Solo tiene sentido mientras el usuario
 * sigue en `status: 'pending'` — si ya aceptó, no hay nada que reenviar.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const authCheck = await requireSuperAdmin(request);
  if (!authCheck.authorized) return authCheck.response;

  const { userId } = await params;

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: 'Configuración interna del servidor incompleta.', code: 'SERVER_CONFIG_ERROR' },
      { status: 500 }
    );
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('platform_users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Usuario no encontrado.', code: 'NOT_FOUND' }, { status: 404 });
  }

  if (profile.status !== 'pending') {
    return NextResponse.json(
      { error: 'Este usuario ya aceptó su invitación; no hay nada que reenviar.', code: 'ALREADY_ACCEPTED' },
      { status: 409 }
    );
  }

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'invite',
    email: profile.email,
    options: {
      redirectTo: `${PORTAL_BASE_URL}/aceptar-invitacion`,
      data: {
        full_name: profile.full_name,
        role: profile.role,
        tenant_id: profile.tenant_id,
        level: profile.level || undefined,
        job_title: profile.job_title || undefined,
      },
    },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json(
      { error: linkError?.message || 'No se pudo regenerar el enlace de invitación.', code: 'AUTH_INVITE_ERROR' },
      { status: 502 }
    );
  }

  const mailResult = await sendMail({
    to: profile.email,
    subject: 'Tu acceso a Valentina AI — Consola Empresarial',
    senderName: 'Valentina AI',
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; background: #f0f4f9; margin: 0; padding: 32px 16px;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #dadce0; padding: 32px;">
    <h1 style="font-size: 18px; color: #1f1f1f; margin: 0 0 16px;">Bienvenido a Valentina AI</h1>
    <p style="font-size: 14px; color: #3c4043; line-height: 1.6;">
      Te reenviamos tu invitación a la Consola Empresarial de Valentina AI. Haz clic para activar tu cuenta:
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${linkData.properties.action_link}" style="display: inline-block; background: #0b57d0; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
        Activar mi cuenta
      </a>
    </div>
  </div>
</body></html>
`,
  });

  await recordAuditLog({
    action: 'user.invite_resend',
    actorId: authCheck.user.id,
    actorEmail: authCheck.user.email,
    targetId: userId,
    details: { email: profile.email, emailSimulated: mailResult.simulated },
  });

  return NextResponse.json({
    success: true,
    emailSimulated: mailResult.simulated,
    emailError: mailResult.success ? undefined : mailResult.error,
  });
}
