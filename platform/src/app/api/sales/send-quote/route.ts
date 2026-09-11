import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { CommercialQuote } from '@/types/platform';

interface SendQuotePayload {
  quote: CommercialQuote;
  emailTo: string;
  personalNote?: string;
}

/**
 * POST /api/sales/send-quote
 * Envío oficial de cotizaciones ejecutivas vía Google Workspace for Education / SMTP
 */
export async function POST(req: NextRequest) {
  try {
    const body: SendQuotePayload = await req.json();
    const { quote, emailTo, personalNote } = body;

    if (!quote || !emailTo) {
      return NextResponse.json(
        { error: 'Datos de cotización o destinatario faltantes.' },
        { status: 400 }
      );
    }

    const workspaceUser =
      process.env.GOOGLE_WORKSPACE_USER ||
      process.env.SMTP_USER ||
      'claudio.pulido@uges.edu.mx';
    const workspacePassword =
      process.env.GOOGLE_WORKSPACE_APP_PASSWORD || process.env.SMTP_PASSWORD;

    const emailSubject = `Propuesta Comercial Oficial: ${quote.companyName} — Valentina AI [${quote.folio}]`;

    // Plantilla HTML Ejecutiva
    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; color: #1f1f1f; margin: 0; padding: 24px; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #dadce0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #0b57d0; color: #ffffff; padding: 28px 32px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 12px; opacity: 0.9; }
    .body { padding: 32px; }
    .salute { font-size: 15px; font-weight: 600; color: #1f1f1f; margin-bottom: 12px; }
    .note { background: #f0f4f9; border-left: 4px solid #0b57d0; padding: 14px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #3c4043; margin-bottom: 24px; font-style: italic; }
    .card { background: #f8f9fa; border: 1px solid #dadce0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .card-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #5f6368; letter-spacing: 0.5px; margin-bottom: 12px; }
    .metric-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e2ec; font-size: 13px; }
    .metric-row:last-child { border-bottom: none; }
    .roi-highlight { background: #e6f4ea; border: 1px solid #ceead6; border-radius: 10px; padding: 16px; margin-bottom: 24px; text-align: center; }
    .roi-amount { font-size: 22px; font-weight: 800; color: #137333; font-family: monospace; }
    .roi-sub { font-size: 11px; color: #0d652d; margin-top: 4px; }
    .checklist { margin: 16px 0; padding-left: 20px; font-size: 12px; color: #3c4043; }
    .checklist li { margin-bottom: 6px; }
    .bank { background: #fef7e0; border: 1px solid #feefc3; border-radius: 10px; padding: 16px; font-size: 12px; color: #843800; margin-bottom: 24px; }
    .footer { padding: 24px 32px; background: #f8f9fa; border-top: 1px solid #dadce0; text-align: center; font-size: 11px; color: #5f6368; }
    .footer a { color: #0b57d0; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Valentina AI Studio</h1>
      <p>Propuesta Técnico-Comercial &bull; Folio: ${quote.folio}</p>
    </div>

    <div class="body">
      <div class="salute">Estimado(a) ${quote.contactName},</div>
      <p style="font-size: 13px; line-height: 1.6; color: #3c4043;">
        Es un placer presentarle la propuesta formal para la automatización e implementación de agentes con Inteligencia Artificial para <strong>${quote.companyName}</strong>.
      </p>

      ${personalNote ? `<div class="note">"${personalNote}"</div>` : ''}

      <div class="card">
        <div class="card-title">Resumen de la Inversión (Plan ${quote.plan})</div>
        <div class="metric-row">
          <span>Modalidad de Facturación:</span>
          <strong>${quote.billingPeriod === 'annual' ? 'Anual (-2 Meses Bonificados)' : 'Mensual Estándar'}</strong>
        </div>
        <div class="metric-row">
          <span>Inversión Única de Implementación (Setup):</span>
          <strong style="font-family: monospace;">$${quote.setupFeeMxn.toLocaleString('es-MX')} MXN</strong>
        </div>
        <div class="metric-row">
          <span>Suscripción Recurrente del Servicio:</span>
          <strong style="font-family: monospace; color: #0b57d0;">$${quote.monthlyFeeMxn.toLocaleString('es-MX')} MXN/mes</strong>
        </div>
      </div>

      <div class="roi-highlight">
        <div class="roi-amount">+$${quote.monthlySavingsMxn.toLocaleString('es-MX')} MXN / mes</div>
        <div class="roi-sub">Ahorro mensual proyectado en comparación con nómina tradicional. Amortización estimada en ~${quote.amortizationDays} días.</div>
      </div>

      <div class="card-title">Alcance Modular Acordado</div>
      <ul class="checklist">
        ${quote.selectedFeatures.map((feat) => `<li>✓ ${feat}</li>`).join('')}
      </ul>

      <div class="bank">
        <strong>Instrucciones para Formalización:</strong><br>
        Anticipo del 50% para inicio de calibración y ruta crítica (Día 1 al 10):<br>
        <strong>Banco:</strong> BBVA México &bull; <strong>Beneficiario:</strong> Claudio Pulido / Valentina AI<br>
        <strong>CLABE Interbancaria:</strong> 012 680 0154892301 22 &bull; <strong>Concepto:</strong> ${quote.folio}
      </div>

      <p style="font-size: 12px; color: #5f6368; line-height: 1.5;">
        Esta cotización tiene una vigencia oficial hasta el <strong>${quote.expiresAt}</strong> bajo la política POL-COM-VAL-2026-B. Incluye 30 días de garantía de calibración continua y SLA 99.9%.
      </p>
    </div>

    <div class="footer">
      Valentina AI &bull; Innovación en Automatización e Inteligencia Artificial Empresarial<br>
      Querétaro, Qro., México &bull; <a href="https://valentina-ai.mx">valentina-ai.mx</a>
    </div>
  </div>
</body>
</html>
`;

    // Si contamos con credenciales de Google Workspace / SMTP reales
    if (workspacePassword) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 465),
        secure: Boolean(process.env.SMTP_SECURE ?? true),
        auth: {
          user: workspaceUser,
          pass: workspacePassword,
        },
      });

      const info = await transporter.sendMail({
        from: `"Claudio Pulido — Valentina AI" <${workspaceUser}>`,
        to: emailTo,
        subject: emailSubject,
        html: emailHtml,
      });

      return NextResponse.json({
        success: true,
        simulated: false,
        messageId: info.messageId,
        folio: quote.folio,
        sentTo: emailTo,
        sender: workspaceUser,
        timestamp: new Date().toISOString(),
        message: `Cotización ${quote.folio} despachada con éxito a ${emailTo} vía Google Workspace for Education.`,
      });
    }

    // Modo simulado / sandbox (cuando no se ha configurado la contraseña de aplicación de Google)
    return NextResponse.json({
      success: true,
      simulated: true,
      folio: quote.folio,
      sentTo: emailTo,
      sender: workspaceUser,
      timestamp: new Date().toISOString(),
      message: `Cotización ${quote.folio} procesada con éxito en modo de desarrollo. (Configura GOOGLE_WORKSPACE_APP_PASSWORD en .env para despacho SMTP real).`,
    });
  } catch (error: any) {
    console.error('[SendQuote API] Error al enviar cotización:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al procesar el envío de la cotización.' },
      { status: 500 }
    );
  }
}
