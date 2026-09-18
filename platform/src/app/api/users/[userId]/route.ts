import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/serverAuth';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { MOCK_USERS } from '@/data/mockData';
import { userPatchSchema, validationErrorResponse } from '@/lib/validation';
import { recordAuditLog } from '@/lib/auditLog';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

const PATCHABLE_FIELDS: Record<string, string> = {
  status: 'status',
  role: 'role',
  level: 'level',
  tenantId: 'tenant_id',
  jobTitle: 'job_title',
  notes: 'notes',
};

/**
 * PATCH /api/users/[userId]
 * Actualiza campos del perfil (ej. suspender/activar una cuenta). Solo
 * SuperAdmin. Si el usuario todavía no tiene fila en `platform_users` (cuenta
 * semilla heredada), la crea en este momento a partir de MOCK_USERS + el
 * parche, migrándola a la tabla real en su primer cambio administrativo.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authCheck = await requireSuperAdmin(request);
  if (!authCheck.authorized) return authCheck.response;

  const { userId } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'El cuerpo de la solicitud no es un JSON válido.', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  const parsedBody = userPatchSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return validationErrorResponse(parsedBody.error);
  }

  const patch: Record<string, any> = {};
  for (const [key, column] of Object.entries(PATCHABLE_FIELDS)) {
    if (key in parsedBody.data) patch[column] = (parsedBody.data as Record<string, unknown>)[key];
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: 'Configuración interna del servidor incompleta.', code: 'SERVER_CONFIG_ERROR' },
      { status: 500 }
    );
  }

  patch.updated_at = new Date().toISOString();

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('platform_users')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .maybeSingle();

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message, code: 'UPDATE_FAILED' },
      { status: 500 }
    );
  }

  if (updated) {
    await recordAuditLog({
      action: 'user.update',
      actorId: authCheck.user.id,
      actorEmail: authCheck.user.email,
      targetId: userId,
      details: parsedBody.data,
    });
    return NextResponse.json({ user: updated });
  }

  // No existía fila todavía: migrar la cuenta semilla heredada a la tabla real.
  const seed = MOCK_USERS.find((u) => u.id === userId);
  if (!seed) {
    return NextResponse.json(
      { error: 'Usuario no encontrado.', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  const { password: _seedPassword, ...seedRest } = seed;
  const insertRow = {
    id: seed.id,
    email: seed.email,
    full_name: seed.fullName,
    tenant_id: seed.tenantId,
    role: seed.role,
    level: seed.level || null,
    job_title: seed.jobTitle || null,
    status: seed.status,
    notes: seed.notes || null,
    must_change_password: Boolean(seed.mustChangePassword),
    ...patch,
  };
  void seedRest;

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('platform_users')
    .insert(insertRow)
    .select('*')
    .maybeSingle();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: insertError?.message || 'No se pudo migrar la cuenta a la tabla platform_users.', code: 'MIGRATE_FAILED' },
      { status: 500 }
    );
  }

  await recordAuditLog({
    action: 'user.update',
    actorId: authCheck.user.id,
    actorEmail: authCheck.user.email,
    targetId: userId,
    details: { ...parsedBody.data, migratedFromSeed: true },
  });

  return NextResponse.json({ user: inserted });
}
