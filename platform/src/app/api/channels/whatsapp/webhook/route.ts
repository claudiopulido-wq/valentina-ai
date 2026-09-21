import { NextRequest, NextResponse } from 'next/server';
import { findTenantByPhoneNumberId } from '@/lib/tenantLookup';
import { insertInboundMessage } from '@/lib/conversationsService';
import { logger } from '@/lib/logger';

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || '';

/**
 * GET /api/channels/whatsapp/webhook
 * Verificación de webhook exigida por Meta al configurar la suscripción en
 * el Meta Business Manager (App > WhatsApp > Configuration > Webhook).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (!VERIFY_TOKEN) {
    return NextResponse.json(
      { error: 'META_WEBHOOK_VERIFY_TOKEN no está configurado en el servidor.' },
      { status: 500 }
    );
  }

  if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verificación de webhook fallida.' }, { status: 403 });
}

interface MetaTextMessage {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  image?: { caption?: string };
  audio?: {};
  document?: { caption?: string };
}

/**
 * POST /api/channels/whatsapp/webhook
 * Recibe mensajes ENTRANTES reales de clientes vía WhatsApp Cloud API y los
 * persiste en Supabase (tablas contacts/conversations/messages), disparando
 * la actualización en tiempo real de la consola vía Supabase Realtime.
 *
 * Este endpoint es la pieza que faltaba para que tenants más allá de UGES
 * puedan mostrar conversaciones reales: hasta que Meta (o el gateway de
 * Railway) esté configurado para llamar a esta URL, no llegará tráfico real
 * y el tenant seguirá mostrando su respaldo de demostración.
 */
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  try {
    const entries = Array.isArray(body?.entry) ? body.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];

      for (const change of changes) {
        const value = change?.value;
        const phoneNumberId: string | undefined = value?.metadata?.phone_number_id;
        const messages: MetaTextMessage[] = Array.isArray(value?.messages) ? value.messages : [];
        if (!phoneNumberId || messages.length === 0) continue;

        const tenant = await findTenantByPhoneNumberId(phoneNumberId);
        if (!tenant) {
          logger.warn('Mensaje de WhatsApp recibido para un phone_number_id sin tenant asociado', {
            route: '/api/channels/whatsapp/webhook',
            phoneNumberId,
          });
          continue;
        }

        const contactProfile = Array.isArray(value?.contacts) ? value.contacts[0] : undefined;

        for (const msg of messages) {
          const content =
            msg.text?.body || msg.image?.caption || msg.document?.caption || `[${msg.type || 'mensaje'} recibido]`;

          await insertInboundMessage({
            tenantId: tenant.id,
            contactPhone: msg.from || 'desconocido',
            contactName: contactProfile?.profile?.name,
            channel: 'whatsapp',
            content,
          });
        }
      }
    }

    // Meta exige responder 200 rápidamente; si no, reintenta el mismo payload.
    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error('Error al procesar webhook de WhatsApp', {
      route: '/api/channels/whatsapp/webhook',
      error: err?.message,
    });
    // Se responde 200 igualmente: un 5xx aquí hace que Meta reintente
    // indefinidamente el mismo webhook, lo cual no ayuda si el error es
    // determinístico (ej. tenant no encontrado, payload no soportado).
    return NextResponse.json({ success: false, error: err?.message }, { status: 200 });
  }
}
