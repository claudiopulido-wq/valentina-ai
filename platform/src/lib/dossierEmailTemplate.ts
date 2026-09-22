import { Tenant, AuthUser } from '../types/platform';

const PORTAL_BASE_URL = process.env.PLATFORM_PUBLIC_URL || 'https://portal.valentina-ai.mx';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildWelcomeEmailSubject(tenant: Tenant): string {
  const clientName = tenant.legalBusinessName || tenant.name;
  return `Bienvenido a Valentina AI — Expediente Digital Oficial: ${clientName}`;
}

/**
 * Versión HTML del correo de bienvenida, generada server-side a partir de
 * los datos REALES del tenant/usuario (nunca confía en HTML mandado por el
 * cliente) — usada por `POST /api/dossier/send-welcome-email`. La versión de
 * texto plano equivalente que el SuperAdmin puede copiar manualmente vive en
 * `ClientDossierModal.tsx` (`generateWelcomeEmail`).
 */
export function buildWelcomeEmailHtml(tenant: Tenant, user: AuthUser): string {
  const clientName = escapeHtml(tenant.legalBusinessName || tenant.name);
  const planName = escapeHtml(tenant.plan || 'Scale');
  const fullName = escapeHtml(user.fullName);
  const email = escapeHtml(user.email);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; background: #f0f4f9; margin: 0; padding: 32px 16px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #dadce0; padding: 32px;">
    <h1 style="font-size: 18px; color: #1f1f1f; margin: 0 0 16px;">Bienvenido a Valentina AI</h1>
    <p style="font-size: 14px; color: #3c4043; line-height: 1.6;">
      Estimado/a ${fullName},
    </p>
    <p style="font-size: 14px; color: #3c4043; line-height: 1.6;">
      En nombre de todo el equipo de ingeniería de Valentina AI, le damos la más cordial bienvenida a nuestra
      infraestructura de Inteligencia Artificial Enterprise para <strong>${clientName}</strong>.
    </p>
    <p style="font-size: 14px; color: #3c4043; line-height: 1.6;">
      Su Expediente Digital de Incorporación oficial (Cotización, Convenio de Prestación de Servicios, Anexo
      RACI y Ficha de Credenciales) fue generado y está disponible para descarga en su consola bajo el
      <strong>Plan ${planName} Enterprise</strong>.
    </p>
    <div style="padding: 16px; border-radius: 12px; background: #f8f9fa; border: 1px solid #dadce0; margin: 20px 0;">
      <p style="font-size: 12px; color: #5f6368; margin: 0 0 4px;">Correo institucional</p>
      <p style="font-size: 14px; color: #0b57d0; font-weight: 600; margin: 0; font-family: monospace;">${email}</p>
    </div>
    <p style="font-size: 13px; color: #5f6368; line-height: 1.5;">
      Si todavía no ha activado su acceso, revise su bandeja de entrada por un correo previo de invitación con el
      botón para establecer su propia contraseña. Si ya tiene acceso, ingrese directamente en
      <a href="${PORTAL_BASE_URL}" style="color: #0b57d0;">${PORTAL_BASE_URL}</a>.
    </p>
    <p style="font-size: 13px; color: #5f6368; line-height: 1.6; margin-top: 24px;">
      Atentamente,<br />
      Equipo de Arquitectura &amp; Operaciones<br />
      Valentina AI Enterprise Cloud
    </p>
  </div>
</body>
</html>
`;
}
