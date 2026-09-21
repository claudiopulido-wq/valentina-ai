import { Conversation, ChatMessage, Contact, ConversationStatus } from '../types/platform';

/**
 * Cliente de conversaciones reales servidas por el gateway compartido de
 * WhatsApp en Railway (el mismo backend que ya opera el chatbot de cada
 * tenant). El navegador nunca llama a Railway directamente — pasa siempre
 * por nuestras propias rutas `/api/tenants/[tenantId]/conversaciones*`, que
 * son las que guardan `PLATFORM_API_KEY` en el servidor.
 *
 * Forma exacta de la API confirmada en vivo contra
 * whatsapp-empresarial-production.up.railway.app (tenant 3, 2026-09-19):
 *   GET  /api/tenants/:id/conversaciones               -> { hilos: HiloDTO[] }
 *   GET  /api/tenants/:id/conversaciones/whatsapp/:tel -> { mensajes: MensajeDTO[] }
 *   POST /api/tenants/:id/mensajes/enviar               -> { enviado, botPausadoHasta }
 */

export interface HiloDTO {
  canal: 'whatsapp' | 'messenger' | 'instagram';
  contacto: string;
  ultimoMensaje: string;
  ultimoRol: 'user' | 'assistant';
  ultimoEnviadoPor: 'bot' | 'humano' | null;
  actualizadoEn: string;
  pausadoHasta: string | null;
}

export interface MensajeDTO {
  id: number;
  rol: 'user' | 'assistant';
  mensaje: string;
  enviadoPor: 'bot' | 'humano' | null;
  createdAt: string;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const isToday = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  return isToday ? time : `${d.getDate()}/${d.getMonth() + 1} ${time}`;
}

/** El bot está pausado (un humano tomó el hilo) solo si la fecha es real y futura. */
function isBotPaused(pausadoHasta: string | null): boolean {
  if (!pausadoHasta) return false;
  const t = new Date(pausadoHasta).getTime();
  return !isNaN(t) && t > Date.now();
}

function senderFromRol(
  rol: 'user' | 'assistant',
  enviadoPor: 'bot' | 'humano' | null
): ChatMessage['sender'] {
  if (rol === 'user') return 'user';
  return enviadoPor === 'humano' ? 'human_operator' : 'ai_agent';
}

export function mapHiloToConversation(hilo: HiloDTO, tenantId: string): Conversation {
  const conversationId = `railway-${tenantId}-${hilo.canal}-${hilo.contacto}`;

  // El endpoint de lista no trae nombre de contacto, solo el identificador
  // real (teléfono/handle) — no se inventa un nombre que no existe.
  const contact: Contact = {
    id: `ct-${hilo.contacto}`,
    tenantId,
    name: hilo.contacto,
    phoneOrEmail: hilo.contacto,
    channelOrigin: hilo.canal,
    tags: [],
    firstSeenAt: 'Reciente',
  };

  const lastMessage: ChatMessage = {
    id: `hilo-last-${hilo.canal}-${hilo.contacto}`,
    conversationId,
    sender: senderFromRol(hilo.ultimoRol, hilo.ultimoEnviadoPor),
    senderName:
      hilo.ultimoRol === 'user' ? hilo.contacto : hilo.ultimoEnviadoPor === 'humano' ? 'Operador Humano' : 'Valentina AI',
    content: hilo.ultimoMensaje,
    timestamp: formatTimestamp(hilo.actualizadoEn),
    tokensUsed: { prompt: 0, completion: 0, total: 0 },
    costMxn: 0,
    status: 'delivered',
  };

  const status: ConversationStatus = isBotPaused(hilo.pausadoHasta) ? 'human_escalated' : 'ai_handling';

  return {
    id: conversationId,
    tenantId,
    contact,
    channel: hilo.canal,
    status,
    lastMessage: hilo.ultimoMensaje,
    lastMessageTime: formatTimestamp(hilo.actualizadoEn),
    unreadCount: 0,
    totalTokens: 0,
    totalCostMxn: 0,
    sentiment: 'neutral',
    // Solo el último mensaje: el historial completo se carga bajo demanda
    // con fetchContactHistory() cuando el usuario abre esa conversación.
    messages: [lastMessage],
  };
}

export function mapMensajeToChatMessage(msg: MensajeDTO, conversationId: string): ChatMessage {
  return {
    id: `msg-${msg.id}`,
    conversationId,
    sender: senderFromRol(msg.rol, msg.enviadoPor),
    senderName: msg.rol === 'user' ? undefined : msg.enviadoPor === 'humano' ? 'Operador Humano' : 'Valentina AI',
    content: msg.mensaje,
    timestamp: formatTimestamp(msg.createdAt),
    tokensUsed: { prompt: 0, completion: 0, total: 0 },
    costMxn: 0,
    status: 'delivered',
  };
}

/**
 * Lista de hilos recientes del tenant, ya mapeados a nuestro tipo
 * `Conversation`. Devuelve `[]` (nunca lanza) si el tenant no tiene
 * `railwayTenantId`, si el servidor responde con error, o si aún no hay
 * tráfico real — el llamador decide si mostrar el respaldo de demostración.
 */
export async function fetchRailwayTenantThreads(
  numericTenantId: number,
  tenantId: string
): Promise<Conversation[]> {
  try {
    const response = await fetch(`/api/tenants/${numericTenantId}/conversaciones`, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json().catch(() => ({}));
    const hilos: HiloDTO[] = Array.isArray(data?.hilos) ? data.hilos : [];
    return hilos.map((hilo) => mapHiloToConversation(hilo, tenantId));
  } catch (err) {
    console.warn('[railwayConversationsService] Error al listar hilos:', err);
    return [];
  }
}

/**
 * Historial cronológico completo de un contacto específico. Se usa al abrir
 * una conversación puntual en la bandeja para reemplazar el mensaje único
 * que trae la lista por el hilo completo real.
 */
export async function fetchRailwayContactHistory(
  numericTenantId: number,
  contacto: string,
  conversationId: string
): Promise<ChatMessage[]> {
  try {
    const response = await fetch(
      `/api/tenants/${numericTenantId}/conversaciones/whatsapp/${encodeURIComponent(contacto)}`,
      { cache: 'no-store' }
    );
    if (!response.ok) return [];
    const data = await response.json().catch(() => ({}));
    const mensajes: MensajeDTO[] = Array.isArray(data?.mensajes) ? data.mensajes : [];
    return mensajes.map((m) => mapMensajeToChatMessage(m, conversationId));
  } catch (err) {
    console.warn('[railwayConversationsService] Error al leer historial de contacto:', err);
    return [];
  }
}
