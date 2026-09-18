import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';

/**
 * POST /api/users/me/complete-password-change
 * El propio usuario ya cambió su contraseña provisional vía
 * `supabase.auth.updateUser` (con su propia sesión). Esta ruta solo limpia
 * la bandera `must_change_password` en su perfil (`platform_users`), que
 * requiere privilegios de servicio porque la tabla no permite escritura
 * directa desde el cliente (ver RLS: solo `service_role` escribe).
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado.', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured) {
    // No hay tabla real que limpiar todavía; no es un error bloqueante para el usuario.
    return NextResponse.json({ ok: true, persisted: false });
  }

  const { error } = await supabaseAdmin
    .from('platform_users')
    .update({ must_change_password: false, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error && !error.message?.includes('does not exist')) {
    logger.warn('Error al limpiar must_change_password', {
      route: '/api/users/me/complete-password-change',
      userId: user.id,
      error: error.message,
    });
  }

  return NextResponse.json({ ok: true, persisted: !error });
}
