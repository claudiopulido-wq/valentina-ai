'use client';

import React, { useState, useEffect } from 'react';
import { Conversation, ChatMessage, ChannelType, AuthUser, PipelineStage, CrmActivity } from '../types/platform';
import { getUserLevelConfig } from '../lib/permissions';
import { fetchRailwayContactHistory, pauseBot, resumeBot } from '../lib/railwayConversationsService';
import { getAuthHeaders } from '../lib/adminDataService';
import {
  claimLead,
  reassignLead,
  changePipelineStage,
  addCrmNote,
  fetchCrmActivities,
  fetchCrmTeam,
  CrmPatchResult,
  CrmTeamMember,
} from '../lib/crmClientService';
import {
  MessageSquare,
  Send,
  UserCheck,
  Bot,
  User,
  Search,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Zap,
  ShieldAlert,
  ArrowLeft,
  UserPlus,
  StickyNote,
} from 'lucide-react';

const STAGE_LABELS: Record<PipelineStage, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  calificado: 'Calificado',
  propuesta: 'Propuesta Enviada',
  ganado: 'Inscrito / Ganado',
  perdido: 'Perdido',
};

const STAGE_STYLES: Record<PipelineStage, string> = {
  nuevo: 'bg-[#f1f3f4] text-[#3c4043] border-[#dadce0]',
  contactado: 'bg-[#e8f0fe] text-[#0b57d0] border-[#d3e3fd]',
  calificado: 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]',
  propuesta: 'bg-[#f3e8fd] text-[#7a22ce] border-[#d8b4fe]',
  ganado: 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]',
  perdido: 'bg-[#fce8e6] text-[#c5221f] border-[#f5c2c7]',
};

const STAGE_ORDER: PipelineStage[] = ['nuevo', 'contactado', 'calificado', 'propuesta', 'ganado', 'perdido'];

interface Props {
  conversations: Conversation[];
  tenantName: string;
  currentUser?: AuthUser | null;
  railwayTenantId?: number;
  tenantId?: string;
}

export const LiveOmnichannelInbox: React.FC<Props> = ({
  conversations: initialConversations,
  tenantName,
  currentUser,
  railwayTenantId,
  tenantId,
}) => {
  const isDirector = currentUser?.level === 'director';
  const canViewFinances = currentUser?.role === 'superadmin' || isDirector;
  const operatorName = currentUser?.fullName || 'Operador Humano';
  const levelConfig = getUserLevelConfig(currentUser || null);
  const canManageCRM = levelConfig.canManageCRM;
  const canClaimLeads = levelConfig.canClaimLeads;
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConvId, setSelectedConvId] = useState<string>(
    initialConversations[0]?.id || ''
  );
  const [channelFilter, setChannelFilter] = useState<'all' | ChannelType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ai_handling' | 'human_escalated'>('all');
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTab, setMobileTab] = useState<'chats' | 'chat' | 'dossier'>('chats');

  // Actualizar conversaciones si la prop cambia (ej. al recibir datos reales de Supabase)
  useEffect(() => {
    setConversations(initialConversations);
    if (initialConversations.length > 0) {
      setSelectedConvId((prev) =>
        initialConversations.some((c) => c.id === prev) ? prev : initialConversations[0].id
      );
    }
  }, [initialConversations]);

  // Selected conversation
  const selectedConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  // Al abrir un hilo de Railway, la lista solo trae el último mensaje —
  // se pide el historial cronológico completo bajo demanda una sola vez.
  useEffect(() => {
    if (!railwayTenantId || !selectedConv) return;
    const isRailwayThread = selectedConv.id.startsWith('railway-');
    const onlyHasSyntheticLastMessage =
      selectedConv.messages.length === 1 && selectedConv.messages[0].id.startsWith('hilo-last-');
    if (!isRailwayThread || !onlyHasSyntheticLastMessage) return;

    let cancelled = false;
    fetchRailwayContactHistory(railwayTenantId, selectedConv.contact.phoneOrEmail, selectedConv.id).then(
      (fullHistory) => {
        if (cancelled || fullHistory.length === 0) return;
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConv.id ? { ...c, messages: fullHistory } : c))
        );
      }
    );
    return () => {
      cancelled = true;
    };
  }, [railwayTenantId, selectedConv?.id]);

  // --- CRM: asignación, etapa del pipeline y actividad ---------------------
  // Solo hay datos reales de CRM cuando el contacto viene decorado con su
  // UUID real de `contacts` (ver findOrCreateCrmContact) — un id sintético
  // `ct-...` significa que Supabase no está configurado o es un hilo de
  // demostración, y las acciones de CRM no tienen a qué contacto aplicarse.
  const hasRealCrmContact = Boolean(selectedConv) && !selectedConv.contact.id.startsWith('ct-');

  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isUpdatingCrm, setIsUpdatingCrm] = useState(false);
  const [crmError, setCrmError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<CrmTeamMember[]>([]);

  useEffect(() => {
    if (!tenantId || !selectedConv || !hasRealCrmContact) {
      setActivities([]);
      return;
    }
    let cancelled = false;
    setLoadingActivities(true);
    fetchCrmActivities(tenantId, selectedConv.contact.id).then((data) => {
      if (!cancelled) {
        setActivities(data);
        setLoadingActivities(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tenantId, selectedConv?.contact.id, hasRealCrmContact]);

  useEffect(() => {
    if (!tenantId || !canManageCRM) return;
    let cancelled = false;
    fetchCrmTeam(tenantId).then((members) => {
      if (!cancelled) setTeamMembers(members);
    });
    return () => {
      cancelled = true;
    };
  }, [tenantId, canManageCRM]);

  const applyCrmPatchToContact = (contactId: string, crm: NonNullable<CrmPatchResult['crm']>) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.contact.id === contactId
          ? {
              ...c,
              contact: {
                ...c.contact,
                assignedTo: crm.assignedTo,
                assignedToName: crm.assignedToName,
                pipelineStage: crm.pipelineStage,
                stageUpdatedAt: crm.stageUpdatedAt || undefined,
                lostReason: crm.lostReason || undefined,
              },
            }
          : c
      )
    );
  };

  const handleClaimLead = async () => {
    if (!tenantId || !selectedConv || !currentUser || isUpdatingCrm) return;
    setIsUpdatingCrm(true);
    setCrmError(null);
    const result = await claimLead(tenantId, selectedConv.contact.id, currentUser.id);
    setIsUpdatingCrm(false);
    if (!result.success || !result.crm) {
      setCrmError(result.error || 'No se pudo reclamar el lead.');
      return;
    }
    applyCrmPatchToContact(selectedConv.contact.id, result.crm);
  };

  const handleReassign = async (userId: string) => {
    if (!tenantId || !selectedConv || isUpdatingCrm) return;
    setIsUpdatingCrm(true);
    setCrmError(null);
    const result = await reassignLead(tenantId, selectedConv.contact.id, userId || null);
    setIsUpdatingCrm(false);
    if (!result.success || !result.crm) {
      setCrmError(result.error || 'No se pudo reasignar el lead.');
      return;
    }
    applyCrmPatchToContact(selectedConv.contact.id, result.crm);
  };

  const handleStageChange = async (stage: PipelineStage) => {
    if (!tenantId || !selectedConv || isUpdatingCrm) return;
    setIsUpdatingCrm(true);
    setCrmError(null);
    const result = await changePipelineStage(tenantId, selectedConv.contact.id, stage);
    setIsUpdatingCrm(false);
    if (!result.success || !result.crm) {
      setCrmError(result.error || 'No se pudo cambiar la etapa.');
      return;
    }
    applyCrmPatchToContact(selectedConv.contact.id, result.crm);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !selectedConv || !noteText.trim() || isSavingNote) return;
    setIsSavingNote(true);
    setCrmError(null);
    const content = noteText.trim();
    const result = await addCrmNote(tenantId, selectedConv.contact.id, content);
    setIsSavingNote(false);
    if (!result.success) {
      setCrmError(result.error || 'No se pudo agregar la nota.');
      return;
    }
    setNoteText('');
    const updated = await fetchCrmActivities(tenantId, selectedConv.contact.id);
    setActivities(updated);
  };

  const canEditThisLeadStage =
    Boolean(selectedConv) && (canManageCRM || (canClaimLeads && selectedConv?.contact.assignedTo === currentUser?.id));

  // Filtering
  const filteredConversations = conversations.filter((c) => {
    if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.contact.name.toLowerCase().includes(q) ||
        c.contact.phoneOrEmail.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const [isSending, setIsSending] = useState(false);
  const [sendBanner, setSendBanner] = useState<{ type: 'error' | 'warning'; text: string } | null>(null);
  const [isTogglingBot, setIsTogglingBot] = useState(false);

  // Un hilo solo soporta pausar/reanudar al bot de verdad si viene del
  // pipeline real de Railway (railwayTenantId configurado + id del formato
  // que genera mapHiloToConversation). Para datos de demostración o el
  // pipeline aparte de UGES, no hay garantía de que el `contacto` coincida
  // con el formato que Railway espera, así que el botón se deshabilita en
  // vez de fingir que pausó algo.
  const canToggleBotControl = Boolean(railwayTenantId) && selectedConv?.id.startsWith('railway-');

  // Tomar/Regresar control real del bot vía Railway (pausar-bot / reanudar-bot).
  // Antes esto solo cambiaba un estado local que el siguiente poll (cada 4s)
  // sobrescribía en cuestión de segundos, sin pausar nunca al bot de verdad —
  // el cliente podía recibir respuestas duplicadas del bot y de un humano a
  // la vez sin que el operador se enterara.
  const handleToggleTakeover = async (conv: Conversation) => {
    if (!railwayTenantId || isTogglingBot) return;

    setIsTogglingBot(true);
    setSendBanner(null);
    const contacto = conv.contact.phoneOrEmail;
    const result =
      conv.status === 'human_escalated'
        ? await resumeBot(railwayTenantId, conv.channel, contacto)
        : await pauseBot(railwayTenantId, conv.channel, contacto);
    setIsTogglingBot(false);

    if (!result.success) {
      setSendBanner({
        type: 'error',
        text: `No se pudo ${conv.status === 'human_escalated' ? 'reactivar la IA' : 'tomar el control'}: ${result.error}`,
      });
      return;
    }

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conv.id
          ? { ...c, status: conv.status === 'human_escalated' ? 'ai_handling' : 'human_escalated' }
          : c
      )
    );
  };

  // Send Operator Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv || isSending) return;

    const messageText = replyText.trim();
    const tempMsgId = `msg-${Date.now()}`;

    const newMsg: ChatMessage = {
      id: tempMsgId,
      conversationId: selectedConv.id,
      sender: 'human_operator',
      senderName: operatorName,
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      costMxn: 0,
      status: 'sending',
    };

    // Añadir de inmediato a la vista y pasar el control a operador humano
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === selectedConv.id) {
          return {
            ...c,
            status: 'human_escalated',
            lastMessage: messageText,
            lastMessageTime: newMsg.timestamp,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setReplyText('');
    setIsSending(true);
    setSendBanner(null);

    const applyMessageState = (patch: Partial<ChatMessage>) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === selectedConv.id) {
            return {
              ...c,
              messages: c.messages.map((m) => (m.id === tempMsgId ? { ...m, ...patch } : m)),
            };
          }
          return c;
        })
      );
    };

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/channels/whatsapp/send-message', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversationId: selectedConv.id,
          recipient: selectedConv.contact.phoneOrEmail,
          message: messageText,
          senderName: operatorName,
          channel: selectedConv.channel,
          railwayTenantId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success !== false) {
        applyMessageState({ status: 'sent', simulated: Boolean(data.simulated) });
        if (data.simulated) {
          setSendBanner({
            type: 'warning',
            text: 'Modo sandbox: el mensaje no salió realmente por WhatsApp (falta configurar PLATFORM_API_KEY en el servidor).',
          });
        }
      } else {
        applyMessageState({ status: 'failed' });
        setSendBanner({
          type: 'error',
          text: data.error || 'No se pudo entregar el mensaje por WhatsApp. El destinatario no lo recibió.',
        });
      }
    } catch (err) {
      console.error('[LiveOmnichannelInbox] Fallo en despacho:', err);
      applyMessageState({ status: 'failed' });
      setSendBanner({
        type: 'error',
        text: 'Error de red al intentar enviar el mensaje. El destinatario no lo recibió.',
      });
    } finally {
      setIsSending(false);
    }
  };


  return (
    <div className="w-full space-y-4">
      {/* Header with Title & Action Indicators */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#1f1f1f] tracking-tight">Bandeja Omnicanal en Vivo</h2>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
              <span className="w-2 h-2 rounded-full bg-[#137333] animate-pulse"></span>
              En Vivo
            </span>
          </div>
          <p className="text-xs text-[#5f6368]">
            Monitoreo en tiempo real de conversaciones activas en WhatsApp Cloud API y Webchat
          </p>
        </div>

        {/* Channel Filter Pills */}
        <div className="flex items-center bg-white border border-[#dadce0] rounded-full p-1 gap-1 shadow-sm">
          <button
            onClick={() => setChannelFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
              channelFilter === 'all' ? 'bg-[#e8f0fe] text-[#0b57d0]' : 'text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            Todos ({conversations.length})
          </button>
          <button
            onClick={() => setChannelFilter('whatsapp')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
              channelFilter === 'whatsapp' ? 'bg-[#e6f4ea] text-[#137333]' : 'text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#137333]"></span>
            WhatsApp
          </button>
          <button
            onClick={() => setChannelFilter('web')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
              channelFilter === 'web' ? 'bg-[#e8f0fe] text-[#0b57d0]' : 'text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#0b57d0]"></span>
            Webchat
          </button>
        </div>
      </div>

      {/* Selector de Vistas para Pantallas Móviles (< lg:) */}
      <div className="flex lg:hidden items-center bg-white border border-[#dadce0] p-1 rounded-2xl gap-1 text-xs font-semibold shadow-xs">
        <button
          onClick={() => setMobileTab('chats')}
          className={`flex-1 py-2 rounded-xl text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mobileTab === 'chats' ? 'bg-[#e8f0fe] text-[#0b57d0]' : 'text-[#5f6368] hover:bg-[#f8f9fa]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chats ({filteredConversations.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 rounded-xl text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mobileTab === 'chat' ? 'bg-[#e8f0fe] text-[#0b57d0]' : 'text-[#5f6368] hover:bg-[#f8f9fa]'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Chat Activo</span>
        </button>
        <button
          onClick={() => setMobileTab('dossier')}
          className={`flex-1 py-2 rounded-xl text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mobileTab === 'dossier' ? 'bg-[#e8f0fe] text-[#0b57d0]' : 'text-[#5f6368] hover:bg-[#f8f9fa]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Expediente</span>
        </button>
      </div>

      {/* 3-Column Google Workspace Layout (Responsive: Tabs en móvil, 3 columnas en desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[720px]">
        {/* COLUMN 1: Conversation List (4 cols) */}
        <div className={`lg:col-span-4 bg-white border border-[#dadce0] rounded-2xl flex-col overflow-hidden shadow-sm h-[600px] lg:h-full ${
          mobileTab === 'chats' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Search bar inside list */}
          <div className="p-3 border-b border-[#dadce0] space-y-2 bg-[#f8f9fa]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#747775]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, teléfono o texto..."
                className="w-full bg-white border border-[#dadce0] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
              />
            </div>

            {/* Quick Status Pill Filters */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-full transition font-medium cursor-pointer ${
                  statusFilter === 'all' ? 'bg-[#1f1f1f] text-white' : 'text-[#5f6368] hover:bg-[#e0e2ec]'
                }`}
              >
                Cualquiera
              </button>
              <button
                onClick={() => setStatusFilter('ai_handling')}
                className={`px-2.5 py-1 rounded-full transition font-medium cursor-pointer ${
                  statusFilter === 'ai_handling' ? 'bg-[#e8f0fe] text-[#0b57d0]' : 'text-[#5f6368] hover:bg-[#e0e2ec]'
                }`}
              >
                Solo IA
              </button>
              <button
                onClick={() => setStatusFilter('human_escalated')}
                className={`px-2.5 py-1 rounded-full transition font-medium cursor-pointer ${
                  statusFilter === 'human_escalated' ? 'bg-[#fef7e0] text-[#b06000]' : 'text-[#5f6368] hover:bg-[#e0e2ec]'
                }`}
              >
                Requiere Humano
              </button>
            </div>
          </div>

          {/* Conversation Scrollable Feed */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f1f3f4] p-2 space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-[#747775] text-xs">
                No hay conversaciones con estos filtros.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedConv?.id;

                return <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      setMobileTab('chat');
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-[#d3e3fd] border border-[#a8c7fa]'
                        : 'hover:bg-[#f8f9fa] border border-transparent'
                    }`}
                  >
                    {/* Top row: Name, Channel Badge, Time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#1f1f1f] truncate max-w-[130px]">
                          {conv.contact.name}
                        </span>

                        {/* Channel Badge */}
                        {conv.channel === 'whatsapp' ? (
                          <span className="px-1.5 py-0.2 rounded bg-[#e6f4ea] text-[#137333] text-[10px] font-semibold border border-[#ceead6]">
                            WhatsApp
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-[#e8f0fe] text-[#0b57d0] text-[10px] font-semibold border border-[#d3e3fd]">
                            Web
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-[#747775] font-mono">{conv.lastMessageTime}</span>
                    </div>

                    {/* Middle: snippet */}
                    <p className="text-xs text-[#5f6368] line-clamp-2 leading-relaxed">
                      {conv.lastMessage}
                    </p>

                    {/* Bottom row: sentiment/status tag + cost/messages */}
                    <div className="flex items-center justify-between pt-1">
                      {conv.status === 'human_escalated' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#fef7e0] text-[#b06000]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#b06000] animate-pulse"></span>
                          Requiere Humano
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span>
                          Atendido por IA
                        </span>
                      )}

                      <span className="font-mono text-[10px] text-[#747775]">
                        {conv.messages.length} msgs
                      </span>
                    </div>
                  </button>;
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: Active Chat Transcript (5 cols) */}
        <div className={`lg:col-span-5 bg-white border border-[#dadce0] rounded-2xl flex-col justify-between overflow-hidden shadow-sm h-[600px] lg:h-full ${
          mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
        }`}>
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:p-3.5 border-b border-[#dadce0] flex items-center justify-between bg-[#f8f9fa] gap-2">
                <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                  {/* Botón Volver a Chats en móvil */}
                  <button
                    onClick={() => setMobileTab('chats')}
                    className="lg:hidden p-1.5 -ml-1 text-[#0b57d0] hover:bg-[#e8f0fe] rounded-lg transition cursor-pointer shrink-0"
                    title="Volver a lista de chats"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0b57d0] text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0">
                    {selectedConv.contact.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#1f1f1f] truncate">{selectedConv.contact.name}</h3>
                      <span className="hidden sm:inline text-xs font-mono text-[#5f6368]">{selectedConv.contact.phoneOrEmail}</span>
                    </div>
                    <p className="text-[11px] text-[#747775] truncate">
                      Canal: <span className="uppercase text-[#1f1f1f] font-semibold">{selectedConv.channel}</span> • Origen: {selectedConv.contact.city || 'México'}
                    </p>
                  </div>
                </div>

                {/* Takeover Action Button & Expediente button on mobile */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setMobileTab('dossier')}
                    className="lg:hidden px-2.5 py-1 text-[11px] font-semibold text-[#0b57d0] bg-[#e8f0fe] rounded-full border border-[#d3e3fd] transition cursor-pointer"
                  >
                    Expediente
                  </button>

                  <button
                    onClick={() => handleToggleTakeover(selectedConv)}
                    disabled={!canToggleBotControl || isTogglingBot}
                    title={
                      canToggleBotControl
                        ? undefined
                        : 'No disponible para conversaciones de demostración o de este pipeline'
                    }
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedConv.status === 'human_escalated'
                        ? 'bg-[#fef7e0] text-[#b06000] border border-[#feefc3] hover:bg-[#feefc3]'
                        : 'bg-[#0b57d0] text-white hover:bg-[#0842a0]'
                    }`}
                  >
                    {selectedConv.status === 'human_escalated' ? (
                      <>
                        <Bot className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reactivar IA</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tomar Control</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Chat Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#ffffff]">
                {selectedConv.messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isAi = msg.sender === 'ai_agent';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                    >
                      {/* Sender label */}
                      <div className="flex items-center gap-1.5 text-[11px] text-[#747775] mb-1 px-1">
                        {isUser ? (
                          <>
                            <User className="w-3 h-3 text-[#5f6368]" />
                            <span>{selectedConv.contact.name}</span>
                          </>
                        ) : isAi ? (
                          <>
                            <Sparkles className="w-3 h-3 text-[#0b57d0]" />
                            <span className="text-[#0b57d0] font-semibold">{msg.senderName || 'Valentina IA'}</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3 text-[#137333]" />
                            <span className="text-[#137333] font-semibold">Operador Humano</span>
                          </>
                        )}
                        <span>• {msg.timestamp}</span>
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-[#f1f3f4] text-[#1f1f1f] rounded-tl-sm'
                            : isAi
                            ? 'bg-[#e8f0fe] border border-[#d3e3fd] text-[#041e49] rounded-tr-sm shadow-sm'
                            : 'bg-[#e6f4ea] border border-[#ceead6] text-[#0d652d] rounded-tr-sm'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>

                        {/* Token and Cost metadata for AI messages - Solo visible para roles con permiso financiero */}
                        {isAi && msg.tokensUsed.total > 0 && canViewFinances && (
                          <div className="mt-2 pt-1.5 border-t border-[#d3e3fd] flex items-center justify-between text-[10px] font-mono text-[#0b57d0]">
                            <span>Tokens: {msg.tokensUsed.total}</span>
                            <span className="text-[#137333] font-semibold">${msg.costMxn.toFixed(4)} MXN</span>
                          </div>
                        )}

                        {/* Estado real de entrega para mensajes del operador humano */}
                        {msg.sender === 'human_operator' && msg.status === 'failed' && (
                          <div className="mt-1.5 pt-1.5 border-t border-[#fad2cf] text-[10px] font-semibold text-[#c5221f] flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>No entregado</span>
                          </div>
                        )}
                        {msg.sender === 'human_operator' && msg.status !== 'failed' && msg.simulated && (
                          <div className="mt-1.5 pt-1.5 border-t border-[#feefc3] text-[10px] font-semibold text-[#b06000] flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Simulado (no real)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Banner de resultado del último envío (error real / modo sandbox) */}
              {sendBanner && (
                <div
                  className={`px-3.5 py-2 border-t text-xs flex items-center justify-between ${
                    sendBanner.type === 'error'
                      ? 'bg-[#fce8e6] border-[#f5c2c7] text-[#c5221f]'
                      : 'bg-[#fef7e0] border-[#feefc3] text-[#b06000]'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{sendBanner.text}</span>
                  </span>
                  <button
                    onClick={() => setSendBanner(null)}
                    className="text-current opacity-70 hover:opacity-100 cursor-pointer shrink-0 ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Banner informativo de modo supervisión para directores */}
              {isDirector && (
                <div className="px-3.5 py-2 bg-[#f3e8fd] border-t border-[#d8b4fe] text-xs text-[#7a22ce] flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span>👑 Modo Supervisión Ejecutiva</span>
                    <span className="font-normal text-[11px] text-[#9333ea]">(Supervisión de calidad de servicio)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white text-[#7a22ce] border border-[#d8b4fe] font-mono">
                    Lectura & Auditoría
                  </span>
                </div>
              )}

              {/* Message Input & Dispatch */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-[#dadce0] bg-[#f8f9fa] flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    selectedConv.status === 'human_escalated'
                      ? 'Escribe tu respuesta como operador...'
                      : 'Escribe para intervenir en la conversación...'
                  }
                  className="flex-1 bg-white border border-[#dadce0] rounded-xl px-3 py-2 text-xs text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                />

                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="p-2.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white disabled:opacity-40 transition cursor-pointer shadow-sm flex items-center justify-center"
                  title="Enviar mensaje vía WhatsApp Cloud API"
                >
                  <Send className={`w-4 h-4 ${isSending ? 'animate-pulse' : ''}`} />
                </button>

              </form>
            </>
          ) : (
            <div className="p-10 text-center text-[#747775] text-xs">Selecciona una conversación</div>
          )}
        </div>

        {/* COLUMN 3: Lead Dossier & Telemetry Breakdown (3 cols) */}
        <div className={`lg:col-span-3 bg-white border border-[#dadce0] rounded-2xl p-4 flex-col justify-between overflow-y-auto space-y-4 shadow-sm h-[600px] lg:h-full ${
          mobileTab === 'dossier' ? 'flex' : 'hidden lg:flex'
        }`}>
          {selectedConv ? (
            <>
              {/* Botón Volver al Chat en móvil */}
              <div className="flex items-center justify-between pb-3 border-b border-[#dadce0] lg:hidden">
                <button
                  onClick={() => setMobileTab('chat')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#0b57d0] hover:bg-[#e8f0fe] px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver al chat</span>
                </button>
                <span className="text-[10px] font-mono text-[#5f6368]">ID #{selectedConv.id}</span>
              </div>

              <div className="space-y-4">
                {/* Contact Dossier Header */}
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368]">
                    Expediente del Prospecto
                  </span>
                  <h4 className="text-base font-bold text-[#1f1f1f] mt-1">{selectedConv.contact.name}</h4>
                  <p className="text-xs text-[#5f6368] font-mono">{selectedConv.contact.phoneOrEmail}</p>
                </div>

                {/* Lead Qualification Score */}
                <div className="p-3 rounded-xl bg-[#f8f9fa] border border-[#dadce0] space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-[#1f1f1f]">
                    <span>Score de Interés (IA)</span>
                    <span className="text-[#137333] font-mono font-bold">{selectedConv.contact.qualificationScore || 85}/100</span>
                  </div>
                  <div className="w-full h-2 bg-[#dadce0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#137333] rounded-full"
                      style={{ width: `${selectedConv.contact.qualificationScore || 85}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-[#5f6368]">Alta probabilidad de cierre detectada por Valentina.</p>
                </div>

                {/* AI Executive Summary of the Chat */}
                {selectedConv.summary && (
                  <div className="p-3 rounded-xl bg-[#e8f0fe] border border-[#d3e3fd] space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0b57d0]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Resumen Automático</span>
                    </div>
                    <p className="text-xs text-[#041e49] leading-snug">
                      {selectedConv.summary}
                    </p>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <span className="text-[11px] font-semibold uppercase text-[#5f6368]">Etiquetas Asignadas</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedConv.contact.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full bg-[#f1f3f4] text-[11px] font-medium text-[#1f1f1f]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CRM: Asignación del lead */}
                <div className="p-3 rounded-xl bg-[#f8f9fa] border border-[#dadce0] space-y-2">
                  <span className="text-[11px] font-semibold uppercase text-[#5f6368] flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    Asignado a
                  </span>

                  {!hasRealCrmContact ? (
                    <p className="text-[11px] text-[#747775]">Este hilo aún no tiene un contacto de CRM vinculado.</p>
                  ) : canManageCRM ? (
                    <select
                      value={selectedConv.contact.assignedTo || ''}
                      onChange={(e) => handleReassign(e.target.value)}
                      disabled={isUpdatingCrm}
                      className="w-full text-xs border border-[#dadce0] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0b57d0] disabled:opacity-50 cursor-pointer"
                    >
                      <option value="">Sin asignar</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName}
                        </option>
                      ))}
                    </select>
                  ) : selectedConv.contact.assignedTo ? (
                    <span className="text-xs font-semibold text-[#1f1f1f]">
                      {selectedConv.contact.assignedTo === currentUser?.id
                        ? 'Tú'
                        : selectedConv.contact.assignedToName || 'Otro miembro del equipo'}
                    </span>
                  ) : canClaimLeads ? (
                    <button
                      onClick={handleClaimLead}
                      disabled={isUpdatingCrm}
                      className="w-full text-xs font-semibold text-white bg-[#0b57d0] hover:bg-[#0842a0] rounded-lg py-1.5 transition disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdatingCrm ? 'Reclamando...' : 'Reclamar este lead'}
                    </button>
                  ) : (
                    <p className="text-[11px] text-[#747775]">Sin asignar</p>
                  )}
                </div>

                {/* CRM: Etapa del Pipeline */}
                <div className="p-3 rounded-xl bg-[#f8f9fa] border border-[#dadce0] space-y-2">
                  <span className="text-[11px] font-semibold uppercase text-[#5f6368]">Etapa del Pipeline</span>
                  <div>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        STAGE_STYLES[selectedConv.contact.pipelineStage || 'nuevo']
                      }`}
                    >
                      {STAGE_LABELS[selectedConv.contact.pipelineStage || 'nuevo']}
                    </span>
                  </div>
                  {hasRealCrmContact && canEditThisLeadStage && (
                    <select
                      value={selectedConv.contact.pipelineStage || 'nuevo'}
                      onChange={(e) => handleStageChange(e.target.value as PipelineStage)}
                      disabled={isUpdatingCrm}
                      className="w-full text-xs border border-[#dadce0] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0b57d0] disabled:opacity-50 cursor-pointer"
                    >
                      {STAGE_ORDER.map((stage) => (
                        <option key={stage} value={stage}>
                          {STAGE_LABELS[stage]}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {crmError && <p className="text-[11px] text-[#c5221f] font-medium px-1">{crmError}</p>}

                {/* CRM: Notas y Actividad */}
                {hasRealCrmContact && (
                  <div className="space-y-2 pt-2 border-t border-[#dadce0]">
                    <span className="text-[11px] font-semibold uppercase text-[#5f6368] flex items-center gap-1.5">
                      <StickyNote className="w-3.5 h-3.5" />
                      Notas y Actividad
                    </span>

                    <form onSubmit={handleAddNote} className="flex flex-col gap-1.5">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Agregar una nota sobre este prospecto..."
                        rows={2}
                        className="w-full text-xs border border-[#dadce0] rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                      />
                      <button
                        type="submit"
                        disabled={!noteText.trim() || isSavingNote}
                        className="self-end px-3 py-1 text-[11px] font-semibold text-white bg-[#0b57d0] hover:bg-[#0842a0] rounded-lg transition disabled:opacity-40 cursor-pointer"
                      >
                        {isSavingNote ? 'Guardando...' : 'Agregar nota'}
                      </button>
                    </form>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {loadingActivities ? (
                        <p className="text-[11px] text-[#747775]">Cargando actividad...</p>
                      ) : activities.length === 0 ? (
                        <p className="text-[11px] text-[#747775]">Sin actividad todavía.</p>
                      ) : (
                        activities.map((a) => (
                          <div key={a.id} className="text-[11px] p-2 rounded-lg bg-[#f8f9fa] border border-[#dadce0]">
                            <div className="flex items-center justify-between text-[10px] text-[#747775] mb-0.5">
                              <span className="font-semibold text-[#1f1f1f]">{a.actorName || 'Sistema'}</span>
                              <span>
                                {new Date(a.createdAt).toLocaleString('es-MX', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-[#5f6368]">{a.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Telemetry Breakdown for this conversation */}
                <div className="space-y-2 pt-2 border-t border-[#dadce0]">
                  <span className="text-[11px] font-semibold uppercase text-[#5f6368]">Métricas del Chat</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                      <span className="text-[10px] text-[#5f6368]">Mensajes</span>
                      <p className="font-mono font-bold text-[#1f1f1f]">{selectedConv.messages.length} msgs</p>
                    </div>
                    {canViewFinances ? (
                      <div className="p-2.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                        <span className="text-[10px] text-[#5f6368]">Costo de la Charla</span>
                        <p className="font-mono font-bold text-[#137333]">${selectedConv.totalCostMxn.toFixed(4)} MXN</p>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                        <span className="text-[10px] text-[#5f6368]">Canal</span>
                        <p className="font-mono font-bold text-[#0b57d0] uppercase">{selectedConv.channel}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tenant Guarantee Badge */}
              <div className="p-2.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0] text-xs text-[#5f6368] text-center font-mono">
                Aislamiento RLS Tenant: <strong className="text-[#0b57d0]">{selectedConv.tenantId}</strong>
              </div>
            </>
          ) : (
            <div className="text-xs text-[#747775]">Sin datos seleccionados</div>
          )}
        </div>
      </div>
    </div>
  );
};
