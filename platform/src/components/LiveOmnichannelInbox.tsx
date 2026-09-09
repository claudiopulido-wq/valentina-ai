'use client';

import React, { useState } from 'react';
import { Conversation, ChatMessage, ChannelType } from '../types/platform';
import {
  MessageSquare,
  Send,
  UserCheck,
  Bot,
  User,
  Search,
  AlertTriangle,
  Sparkles,
  Zap,
} from 'lucide-react';

interface Props {
  conversations: Conversation[];
  tenantName: string;
}

export const LiveOmnichannelInbox: React.FC<Props> = ({ conversations: initialConversations, tenantName }) => {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConvId, setSelectedConvId] = useState<string>(
    initialConversations[0]?.id || ''
  );
  const [channelFilter, setChannelFilter] = useState<'all' | ChannelType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ai_handling' | 'human_escalated'>('all');
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected conversation
  const selectedConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

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

  // Toggle Human Takeover
  const handleToggleTakeover = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          const newStatus = c.status === 'human_escalated' ? 'ai_handling' : 'human_escalated';
          return { ...c, status: newStatus };
        }
        return c;
      })
    );
  };

  // Send Operator Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConv.id,
      sender: 'human_operator',
      senderName: 'Operador Humano',
      content: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      costMxn: 0,
      status: 'sent',
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === selectedConv.id) {
          return {
            ...c,
            lastMessage: replyText,
            lastMessageTime: newMsg.timestamp,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setReplyText('');
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

      {/* 3-Column Google Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[700px]">
        {/* COLUMN 1: Conversation List (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#dadce0] rounded-2xl flex flex-col overflow-hidden shadow-sm">
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

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
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
                            WA
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-[#e8f0fe] text-[#0b57d0] text-[10px] font-semibold border border-[#d3e3fd]">
                            WEB
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono text-[#747775]">{conv.lastMessageTime}</span>
                    </div>

                    {/* Last message snippet */}
                    <p className="text-xs text-[#444746] line-clamp-1 leading-snug">
                      {conv.lastMessage}
                    </p>

                    {/* Bottom row: Status & Cost badge */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      {conv.status === 'ai_handling' ? (
                        <span className="flex items-center gap-1 text-[#0b57d0] font-medium">
                          <Bot className="w-3.5 h-3.5 text-[#0b57d0]" />
                          <span>Valentina Activa</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#b06000] font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#b06000]" />
                          <span>Escalado a Humano</span>
                        </span>
                      )}

                      <span className="font-mono text-[10px] text-[#747775]">
                        ${conv.totalCostMxn.toFixed(3)} MXN
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: Active Chat Transcript (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#dadce0] rounded-2xl flex flex-col overflow-hidden shadow-sm">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-[#dadce0] flex items-center justify-between bg-[#f8f9fa]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0b57d0] text-white flex items-center justify-center text-sm font-bold shadow-sm">
                    {selectedConv.contact.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#1f1f1f]">{selectedConv.contact.name}</h3>
                      <span className="text-xs font-mono text-[#5f6368]">{selectedConv.contact.phoneOrEmail}</span>
                    </div>
                    <p className="text-xs text-[#747775]">
                      Canal: <span className="uppercase text-[#1f1f1f] font-semibold">{selectedConv.channel}</span> • Origen: {selectedConv.contact.city || 'México'}
                    </p>
                  </div>
                </div>

                {/* Takeover Action Button */}
                <button
                  onClick={() => handleToggleTakeover(selectedConv.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition shadow-sm cursor-pointer ${
                    selectedConv.status === 'human_escalated'
                      ? 'bg-[#fef7e0] text-[#b06000] border border-[#feefc3] hover:bg-[#feefc3]'
                      : 'bg-[#0b57d0] text-white hover:bg-[#0842a0]'
                  }`}
                >
                  {selectedConv.status === 'human_escalated' ? (
                    <>
                      <Bot className="w-3.5 h-3.5" />
                      <span>Reactivar IA</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Tomar Control</span>
                    </>
                  )}
                </button>
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

                        {/* Token and Cost metadata for AI messages */}
                        {isAi && msg.tokensUsed.total > 0 && (
                          <div className="mt-2 pt-1.5 border-t border-[#d3e3fd] flex items-center justify-between text-[10px] font-mono text-[#0b57d0]">
                            <span>Tokens: {msg.tokensUsed.total}</span>
                            <span className="text-[#137333] font-semibold">${msg.costMxn.toFixed(4)} MXN</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

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
                  disabled={!replyText.trim()}
                  className="p-2.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white disabled:opacity-40 transition cursor-pointer shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="p-10 text-center text-[#747775] text-xs">Selecciona una conversación</div>
          )}
        </div>

        {/* COLUMN 3: Lead Dossier & Telemetry Breakdown (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-[#dadce0] rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4 shadow-sm">
          {selectedConv ? (
            <>
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

                {/* Telemetry Breakdown for this conversation */}
                <div className="space-y-2 pt-2 border-t border-[#dadce0]">
                  <span className="text-[11px] font-semibold uppercase text-[#5f6368]">Telemetría de la Sesión</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                      <span className="text-[10px] text-[#5f6368]">Tokens Totales</span>
                      <p className="font-mono font-bold text-[#1f1f1f]">{selectedConv.totalTokens}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                      <span className="text-[10px] text-[#5f6368]">Costo de la Charla</span>
                      <p className="font-mono font-bold text-[#137333]">${selectedConv.totalCostMxn.toFixed(4)} MXN</p>
                    </div>
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
