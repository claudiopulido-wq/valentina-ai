import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';
import { recordAuditLog } from '@/lib/auditLog';

/**
 * POST /api/users/me/complete-invitation
 * El propio usuario invitado ya estableció su contraseña real vía
 * `supabase.auth.updateUser` (con la sesión que le dio el enlace de
 * invitación). Esta ruta solo pasa su perfil de `pending` a `active` —
 * mismo patrón que `complete-password-change`, requiere `service_role`
 * porque `platform_users` no admite escritura directa desde el cliente.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado.', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  const { error } = await supabaseAdmin
    .from('platform_users')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .eq('status', 'pending');

  if (error && !error.message?.includes('does not exist')) {
    logger.warn('Error al activar la cuenta invitada', {
      route: '/api/users/me/complete-invitation',
      userId: user.id,
      error: error.message,
    });
  } else if (!error) {
    await recordAuditLog({
      action: 'user.invite_accept',
      actorId: user.id,
      actorEmail: user.email,
      targetId: user.id,
    });
  }

  return NextResponse.json({ ok: true, persisted: !error });
}
