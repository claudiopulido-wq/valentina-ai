import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';

/**
 * GET /api/users/me
 * Devuelve el perfil autoritativo (rol, tenant, nivel) del usuario dueño del
 * JWT de Supabase Auth enviado en el header Authorization. El cliente lo
 * llama justo después de un login exitoso para no depender de un directorio
 * de usuarios pre-cargado en el navegador (que puede estar desactualizado si
 * la cuenta se creó en otro dispositivo o después de cargar la página).
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado.', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  return NextResponse.json({ user });
}
