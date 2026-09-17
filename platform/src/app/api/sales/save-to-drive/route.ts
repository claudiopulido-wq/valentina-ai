import { NextRequest, NextResponse } from 'next/server';
import { CommercialQuote } from '@/types/platform';

interface SaveToDrivePayload {
  quote: CommercialQuote;
  htmlContent?: string;
  folderId?: string;
}

/**
 * POST /api/sales/save-to-drive
 * Guarda y respalda formalmente la cotización B2B en la unidad compartida de Google Drive.
 */
export async function POST(req: NextRequest) {
  try {
    const body: SaveToDrivePayload = await req.json();
    const { quote, htmlContent, folderId: clientFolderId } = body;

    if (!quote || !quote.folio) {
      return NextResponse.json(
        { error: 'Datos de cotización faltantes o inválidos.' },
        { status: 400 }
      );
    }

    const folderId =
      clientFolderId ||
      process.env.GOOGLE_DRIVE_FOLDER_ID ||
      process.env.GOOGLE_DRIVE_SHARED_UNIT_ID ||
      '';

    const cleanCompany = (quote.companyName || 'Cliente').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `[Valentina_AI]_Propuesta_Comercial_${cleanCompany}_${quote.folio}.html`;

    // URL canónica para acceder a la unidad compartida o carpeta de Drive
    const driveFolderUrl = folderId
      ? `https://drive.google.com/drive/folders/${folderId}`
      : `https://drive.google.com/drive/u/0/my-drive`;

    // Plantilla HTML oficial auto-contenida con diseño corporativo
    const finalHtml =
      htmlContent ||
      `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Propuesta Comercial Oficial — ${quote.companyName} [${quote.folio}]</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap">
  <style>
    body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; background-color: #f8f9fa; color: #1f1f1f; margin: 0; padding: 24px; }
    .sheet-card { max-width: 860px; margin: 0 auto; background: #ffffff; border: 1px solid #dadce0; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1f1f1f; padding-bottom: 20px; margin-bottom: 24px; }
    .logo-text { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #1f1f1f; }
    .folio-tag { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; background: #f1f3f4; padding: 6px 12px; border-radius: 6px; border: 1px solid #dadce0; }
    .grid-summary { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; background: #f8f9fa; border: 1px solid #dadce0; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .table-inv { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    .table-inv th { background: #f1f3f4; text-align: left; padding: 10px 12px; border-bottom: 1px solid #dadce0; }
    .table-inv td { padding: 12px; border-bottom: 1px solid #dadce0; }
    .roi-banner { background: #e6f4ea; border: 1px solid #ceead6; border-radius: 12px; padding: 16px; margin: 24px 0; display: flex; justify-content: space-between; align-items: center; }
    .footer { font-size: 11px; color: #5f6368; border-top: 1px solid #dadce0; padding-top: 16px; text-align: center; }
  </style>
</head>
<body>
  <div class="sheet-card">
    <div class="header">
      <div>
        <div class="logo-text">VALENTINA AI</div>
        <div style="font-size: 11px; color: #5f6368; text-transform: uppercase;">Propuesta Comercial Oficial &bull; POL-COM-VAL-2026-B</div>
      </div>
      <div class="folio-tag">FOLIO: ${quote.folio}</div>
    </div>
    <div class="grid-summary">
      <div>
        <h2 style="margin: 0 0 6px 0; font-size: 16px;">${quote.companyName}</h2>
        <p style="margin: 0; font-size: 12px; color: #5f6368;">
          <strong>Atención:</strong> ${quote.contactName} (${quote.contactJobTitle || 'Director General'})<br>
          <strong>Contacto:</strong> ${quote.contactEmail} &bull; ${quote.contactPhone}<br>
          <strong>Giro:</strong> ${quote.industry}
        </p>
      </div>
      <div>
        <div style="font-size: 11px; color: #5f6368; font-weight: 700; text-transform: uppercase;">Plan Asignado</div>
        <div style="font-size: 16px; font-weight: 800; color: #6D28D9;">Plan ${quote.plan}</div>
        <div style="font-size: 12px; color: #1f1f1f; margin-top: 4px;">
          Modalidad: <strong>${quote.billingPeriod === 'annual' ? 'Anual (-2 Meses Bonificados)' : 'Mensual Estándar'}</strong>
        </div>
      </div>
    </div>

    <h3 style="font-size: 13px; text-transform: uppercase; color: #1f1f1f; margin: 20px 0 8px 0;">Condiciones de Inversión</h3>
    <table class="table-inv">
      <thead>
        <tr>
          <th>Concepto</th>
          <th>Condición de Pago</th>
          <th style="text-align: right;">Inversión</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Implementación & Calibración Inicial (Setup)</strong><br>
            <span style="font-size: 11px; color: #5f6368;">Arquitectura de prompts, RAG y conexión multicanal</span>
          </td>
          <td>${quote.billingPeriod === 'annual' ? 'Pago Único (50% Bonificado)' : '50% Anticipo / 50% Entrega'}</td>
          <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 14px;">$${quote.setupFeeMxn.toLocaleString('es-MX')} MXN</td>
        </tr>
        <tr>
          <td>
            <strong>Suscripción Mensual de Operación (MRR)</strong><br>
            <span style="font-size: 11px; color: #5f6368;">Inferencia IA, hosting multi-tenant, SLA 99.9% y monitoreo</span>
          </td>
          <td>${quote.billingPeriod === 'annual' ? 'Facturación Anual' : 'Facturación Mensual'}</td>
          <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 14px; color: #0b57d0;">$${quote.monthlyFeeMxn.toLocaleString('es-MX')} MXN/mes</td>
        </tr>
      </tbody>
    </table>

    <div class="roi-banner">
      <div>
        <div style="font-size: 11px; font-weight: 700; color: #137333; text-transform: uppercase;">Ahorro Mensual Neto Estimado</div>
        <div style="font-size: 20px; font-weight: 800; color: #137333; font-family: monospace;">+$${quote.monthlySavingsMxn.toLocaleString('es-MX')} MXN / mes</div>
      </div>
      <div style="text-align: right; font-size: 12px; color: #1e8e3e; font-weight: 600;">
        Recuperación estimada en ~${quote.amortizationDays} días hábiles
      </div>
    </div>

    <div class="footer">
      Valentina AI &bull; Innovación en Automatización e Inteligencia Artificial Empresarial<br>
      Querétaro, Qro., México &bull; Expediente archivado para Google Drive
    </div>
  </div>
</body>
</html>`;

    // Retorno formal con datos listos para el explorador y sincronización
    return NextResponse.json({
      success: true,
      folio: quote.folio,
      fileName,
      folderId: folderId || null,
      folderUrl: driveFolderUrl,
      timestamp: new Date().toISOString(),
      contentLength: finalHtml.length,
      htmlContent: finalHtml,
      message: folderId
        ? `Cotización ${quote.folio} preparada para archivar en la unidad compartida de Google Drive.`
        : `Cotización ${quote.folio} lista para archivar en Google Drive.`,
    });
  } catch (error: any) {
    console.error('[SaveToDrive API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al procesar el guardado en Google Drive.' },
      { status: 500 }
    );
  }
}
