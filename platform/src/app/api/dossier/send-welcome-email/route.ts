import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, getPlatformUserById } from '@/lib/serverAuth';
import { getTenantById } from '@/lib/tenantLookup';
import { sendMail } from '@/lib/mailer';
import { buildWelcomeEmailHtml, buildWelcomeEmailSubject } from '@/lib/dossierEmailTemplate';
import { recordDossierEmission } from '@/lib/dossierLog';

/**
 * POST /api/dossier/send-welcome-email
 * Envía el correo de bienvenida REAL (no simulado) del Expediente Digital,
 * usando el mismo SMTP de Google Workspace que ya usan las invitaciones de
 * equipo (`src/lib/mailer.ts`). El tenant/usuario se leen del servidor con
 * `supabaseAdmin` -- nunca se confía en datos de plantilla mandados por el
 * cliente.
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireSuperAdmin(request);
  if (!authCheck.authorized) return authCheck.response;

  let body: { tenantId?: string; userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es un JSON válido.', code: 'INVALID_JSON' }, { status: 400 });
  }

  const { tenantId, userId } = body;
  if (!tenantId || !userId) {
    return NextResponse.json({ error: 'Faltan tenantId o userId.', code: 'INVALID_BODY' }, { status: 400 });
  }

  const [tenant, user] = await Promise.all([getTenantById(tenantId), getPlatformUserById(userId)]);

  if (!tenant) {
    return NextResponse.json({ error: 'Empresa no encontrada.', code: 'TENANT_NOT_FOUND' }, { status: 404 });
  }
  if (!user || user.tenantId !== tenantId) {
    return NextResponse.json(
      { error: 'El usuario no existe o no pertenece a esta empresa.', code: 'USER_NOT_FOUND' },
      { status: 404 }
    );
  }

  const mailResult = await sendMail({
    to: user.email,
    subject: buildWelcomeEmailSubject(tenant),
    senderName: 'Valentina AI',
    html: buildWelcomeEmailHtml(tenant, user),
  });

  if (!mailResult.success) {
    return NextResponse.json(
      { error: mailResult.error || 'No se pudo enviar el correo.', code: 'MAIL_SEND_FAILED' },
      { status: 502 }
    );
  }

  const folio = `WELCOME-${new Date().getFullYear()}-${user.id.slice(-6).toUpperCase()}`;
  await recordDossierEmission({
    tenantId,
    userId,
    folio,
    documentType: 'all',
    action: 'email_sent',
    snapshot: { tenantName: tenant.name, userEmail: user.email, plan: tenant.plan, emailSimulated: mailResult.simulated },
    actorId: authCheck.user.id,
    actorEmail: authCheck.user.email,
  });

  return NextResponse.json({ success: true, emailSimulated: mailResult.simulated }, { status: 200 });
}
