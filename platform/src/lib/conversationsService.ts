import { supabase, isSupabaseConfigured } from './supabaseClient';
import { supabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';
import { Conversation, ChatMessage, Contact, ConversationStatus } from '../types/platform';

/**
 * Persistencia real de conversaciones/mensajes multi-tenant en el proyecto
 * principal de Supabase (distinto del proyecto de solo lectura de UGES, que
 * tiene su propio esquema y servicio en `ugesDataService.ts`).
 *
 * Mientras el bot de WhatsApp de un tenant (Railway) o el webhook de Meta no
 * estén conectados a estas tablas, `fetchTenantConversations` simplemente
 * devuelve una lista vacía y el llamador debe mostrar el respaldo de
 * demostración — nunca se inventa una conversación aquí.
 */

interface ContactRow {
  id: string;
  tenant_id: string;
  name: string | null;
  phone_or_email: string;
  channel_origin: string;
  city: string | null;
  qualification_score: number | null;
  tags: string[] | null;
  created_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender: ChatMessage['sender'];
  sender_name: string | null;
  content: string;
  tokens_prompt: number | null;
  tokens_completion: number | null;
  cost_mxn: number | null;
  status: ChatMessage['status'] | null;
  simulated: boolean | null;
  media_url: string | null;
  media_type: ChatMessage['mediaType'] | null;
  created_at: string;
}

interface ConversationRow {
  id: string;
  tenant_id: string;
  channel: Conversation['channel'];
  status: ConversationStatus;
  sentiment: Conversation['sentiment'];
  summary: string | null;
  created_at: string;
  updated_at: string;
  contact: ContactRow | null;
  messages: MessageRow[] | null;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const isToday = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  return isToday ? time : `${d.getDate()}/${d.getMonth() + 1} ${time}`;
}

export function mapRowToConversation(row: ConversationRow): Conversation {
  const messages: ChatMessage[] = (row.messages || [])
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((m) => ({
      id: m.id,
      conversationId: row.id,
      sender: m.sender,
      senderName: m.sender_name || undefined,
      content: m.content,
      timestamp: formatTimestamp(m.created_at),
      tokensUsed: {
        prompt: m.tokens_prompt || 0,
        completion: m.tokens_completion || 0,
        total: (m.tokens_prompt || 0) + (m.tokens_completion || 0),
      },
      costMxn: Number(m.cost_mxn || 0),
      status: m.status || 'delivered',
      simulated: m.simulated || undefined,
      mediaUrl: m.media_url || undefined,
      mediaType: m.media_type || undefined,
    }));

  const lastMessage = messages[messages.length - 1];
  const totalTokens = messages.reduce((sum, m) => sum + m.tokensUsed.total, 0);
  const totalCostMxn = messages.reduce((sum, m) => sum + m.costMxn, 0);

  const contact: Contact = row.contact
    ? {
        id: row.contact.id,
        tenantId: row.tenant_id,
        name: row.contact.name || row.contact.phone_or_email,
        phoneOrEmail: row.contact.phone_or_email,
        channelOrigin: (row.contact.channel_origin as Contact['channelOrigin']) || 'whatsapp',
        tags: row.contact.tags || [],
        city: row.contact.city || undefined,
        firstSeenAt: row.contact.created_at
          ? new Date(row.contact.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
          : 'Reciente',
        qualificationScore: row.contact.qualification_score ?? undefined,
      }
    : {
        id: `ct-${row.id}`,
        tenantId: row.tenant_id,
        name: 'Contacto sin identificar',
        phoneOrEmail: '',
        channelOrigin: 'whatsapp',
        tags: [],
        firstSeenAt: 'Reciente',
      };

  return {
    id: row.id,
    tenantId: row.tenant_id,
    contact,
    channel: row.channel,
    status: row.status,
    lastMessage: lastMessage?.content || row.summary || 'Sin mensajes todavía',
    lastMessageTime: formatTimestamp(row.updated_at),
    unreadCount: 0,
    totalTokens,
    totalCostMxn: Number(totalCostMxn.toFixed(4)),
    sentiment: row.sentiment || 'neutral',
    summary: row.summary || undefined,
    messages,
  };
}

/**
 * Conversaciones reales del tenant desde Supabase. Devuelve `[]` (nunca
 * lanza) si la tabla no existe todavía, si Supabase no está configurado, o
 * si el tenant simplemente no tiene ninguna conversación real aún — el
 * llamador decide si mostrar el respaldo de demostración en ese caso.
 */
export async function fetchTenantConversations(tenantId: string): Promise<Conversation[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, contact:contacts(*), messages(*)')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false });

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('[conversationsService] Tabla conversations aún no existe en Supabase.');
      } else {
        console.warn('[conversationsService] Error al consultar conversations:', error.message);
      }
      return [];
    }

    return (data || []).map((row) => mapRowToConversation(row as unknown as ConversationRow));
  } catch (err) {
    console.warn('[conversationsService] Excepción al consultar conversations:', err);
    return [];
  }
}

/**
 * Se suscribe a cambios en vivo (INSERT/UPDATE) de mensajes y conversaciones
 * de un tenant, e invoca `onChange` para que el llamador vuelva a pedir el
 * estado completo. Esta es la pieza de infraestructura de tiempo real que
 * antes no existía en absoluto en la plataforma: antes de esto, un mensaje
 * nuevo solo aparecía si el usuario recargaba la página manualmente.
 *
 * Devuelve una función de limpieza para cancelar la suscripción.
 */
export function subscribeToTenantConversations(tenantId: string, onChange: () => void): () => void {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`conversations-${tenantId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages' },
      () => onChange()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'conversations', filter: `tenant_id=eq.${tenantId}` },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

interface InboundMessageInput {
  tenantId: string;
  contactPhone: string;
  contactName?: string;
  channel?: Conversation['channel'];
  content: string;
  mediaUrl?: string;
  mediaType?: ChatMessage['mediaType'];
}

/**
 * Registra un mensaje ENTRANTE real (de un cliente vía WhatsApp/Meta) para un
 * tenant, creando el contacto y la conversación si es la primera vez que se
 * ve ese número. Requiere `service_role` porque la escribe un webhook público
 * sin sesión de usuario autenticada.
 */
export async function insertInboundMessage(input: InboundMessageInput): Promise<void> {
  if (!isSupabaseAdminConfigured) {
    console.warn('[conversationsService] Supabase admin no configurado; mensaje entrante descartado.');
    return;
  }

  const cleanPhone = input.contactPhone.replace(/[^0-9+]/g, '');

  let { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('id')
    .eq('tenant_id', input.tenantId)
    .eq('phone_or_email', cleanPhone)
    .maybeSingle();

  if (!contact) {
    const { data: newContact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .insert({
        tenant_id: input.tenantId,
        name: input.contactName || null,
        phone_or_email: cleanPhone,
        channel_origin: input.channel || 'whatsapp',
      })
      .select('id')
      .single();
    if (contactError || !newContact) {
      console.warn('[conversationsService] No se pudo crear el contacto entrante:', contactError?.message);
      return;
    }
    contact = newContact;
  }

  let { data: conversation } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('tenant_id', input.tenantId)
    .eq('contact_id', contact.id)
    .maybeSingle();

  if (!conversation) {
    const { data: newConversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .insert({
        tenant_id: input.tenantId,
        contact_id: contact.id,
        channel: input.channel || 'whatsapp',
        status: 'ai_handling',
        sentiment: 'neutral',
      })
      .select('id')
      .single();
    if (convError || !newConversation) {
      console.warn('[conversationsService] No se pudo crear la conversación entrante:', convError?.message);
      return;
    }
    conversation = newConversation;
  } else {
    await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation.id);
  }

  const estimatedTokens = Math.max(8, Math.round(input.content.length / 3.8));

  await supabaseAdmin.from('messages').insert({
    conversation_id: conversation.id,
    tenant_id: input.tenantId,
    sender: 'user',
    sender_name: input.contactName || cleanPhone,
    content: input.content,
    tokens_prompt: estimatedTokens,
    tokens_completion: 0,
    cost_mxn: Number((estimatedTokens * 0.000032).toFixed(5)),
    status: 'delivered',
    media_url: input.mediaUrl || null,
    media_type: input.mediaType || null,
  });
}

interface OutboundMessageInput {
  conversationId: string;
  senderName?: string;
  content: string;
  simulated?: boolean;
}

/**
 * Registra un mensaje SALIENTE real (escrito por un operador humano desde la
 * consola y despachado por el gateway de WhatsApp) para que quede en el
 * historial persistente y se transmita por tiempo real al resto de la UI.
 *
 * El `conversationId` que llega desde la UI puede ser el id de una
 * conversación de demostración (`MOCK_CONVERSATIONS`) o de la tubería
 * separada de UGES, ninguno de los cuales existe en esta tabla — por eso se
 * resuelve el `tenant_id` real consultando la fila, y si no existe, la
 * función simplemente no hace nada (no es un error: ese caso significa que
 * la conversación aún no vive en el pipeline real).
 */
export async function insertOutboundMessage(input: OutboundMessageInput): Promise<void> {
  if (!isSupabaseAdminConfigured) return;

  try {
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id, tenant_id')
      .eq('id', input.conversationId)
      .maybeSingle();

    if (!conversation) return;

    await supabaseAdmin.from('messages').insert({
      conversation_id: conversation.id,
      tenant_id: conversation.tenant_id,
      sender: 'human_operator',
      sender_name: input.senderName || 'Operador Humano',
      content: input.content,
      tokens_prompt: 0,
      tokens_completion: 0,
      cost_mxn: 0,
      status: 'sent',
      simulated: input.simulated || false,
    });

    await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString(), status: 'human_escalated' })
      .eq('id', conversation.id);
  } catch (err) {
    console.warn('[conversationsService] No se pudo persistir el mensaje saliente:', err);
  }
}
