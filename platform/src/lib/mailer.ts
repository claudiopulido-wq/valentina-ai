import nodemailer from 'nodemailer';
import { logger } from './logger';

/**
 * Envío de correo transaccional vía Google Workspace / SMTP. Extrae el mismo
 * patrón que ya usa `src/app/api/sales/send-quote/route.ts` para cotizaciones
 * (mismas variables de entorno, mismo modo sandbox cuando no hay contraseña
 * de aplicación configurada), para que nuevas rutas (como las invitaciones de
 * usuario) no dupliquen la configuración del transporte SMTP.
 */

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  senderName?: string;
  cc?: string;
}

export interface SendMailResult {
  success: boolean;
  simulated: boolean;
  messageId?: string;
  error?: string;
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const workspaceUser =
    process.env.GOOGLE_WORKSPACE_USER || process.env.SMTP_USER || 'claudio.pulido@uges.edu.mx';
  const workspacePassword = process.env.GOOGLE_WORKSPACE_APP_PASSWORD || process.env.SMTP_PASSWORD;

  // Modo simulado / sandbox: sin contraseña de aplicación configurada no se
  // intenta ninguna conexión SMTP real, pero tampoco se bloquea al llamador
  // (mismo comportamiento que `send-quote`).
  if (!workspacePassword) {
    return { success: true, simulated: true };
  }

  try {
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
      from: `"${input.senderName || 'Valentina AI'}" <${workspaceUser}>`,
      to: input.to,
      cc: input.cc,
      subject: input.subject,
      html: input.html,
    });

    return { success: true, simulated: false, messageId: info.messageId };
  } catch (error: any) {
    logger.error('Error al enviar correo transaccional', { to: input.to, error: error?.message });
    return { success: false, simulated: false, error: error?.message || 'Error desconocido al enviar el correo.' };
  }
}
