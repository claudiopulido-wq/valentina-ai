'use client';

import React, { useState } from 'react';
import { Conversation, ChatMessage, ChannelType } from '../types/platform';
import {
  MessageSquare,
  Send,
  UserCheck,
  Bot,
  User,
  Phone,
  Clock,
  Sparkles,
  ShieldAlert,
  Coins,
  Search,
  Filter,
  CheckCheck,
  FileText,
  AlertTriangle,
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
    <div className="w-full space-y-3">
      {/* Header with Title & Action Indicators */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Live Omnichannel Inbox</h2>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              En Vivo
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Monitoreo en tiempo real de conversaciones activas en WhatsApp Cloud API y Webchat
          </p>
        </div>

        {/* Channel Filter Pills */}
        <div className="flex items-center bg-black/40 border border-white/[0.08] rounded-xl p-1 gap-1">
          <button
            onClick={() => setChannelFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              channelFilter === 'all' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({conversations.length})
          </button>
          <button
            onClick={() => setChannelFilter('whatsapp')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              channelFilter === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            WhatsApp
          </button>
          <button
            onClick={() => setChannelFilter('web')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              channelFilter === 'web' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            Webchat
          </button>
        </div>
      </div>

      {/* 3-Column Glass Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[680px]">
        {/* COLUMN 1: Conversation List (4 cols) */}
        <div className="lg:col-span-4 apple-glass-card rounded-2xl flex flex-col overflow-hidden">
          {/* Search bar inside list */}
          <div className="p-3 border-b border-white/[0.06] space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, teléfono o mensaje..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
              />
            </div>

            {/* Quick Status Pill Filters */}
            <div className="flex items-center gap-1 text-[10px]">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 rounded-md transition ${
                  statusFilter === 'all' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Cualquiera
              </button>
              <button
                onClick={() => setStatusFilter('ai_handling')}
                className={`px-2 py-0.5 rounded-md transition ${
                  statusFilter === 'ai_handling' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Solo IA
              </button>
              <button
                onClick={() => setStatusFilter('human_escalated')}
                className={`px-2 py-0.5 rounded-md transition ${
                  statusFilter === 'human_escalated' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Requiere Humano
              </button>
            </div>
          </div>

          {/* Conversation Scrollable Feed */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] p-2 space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No hay conversaciones con estos filtros.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedConv?.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-violet-500/15 border border-violet-500/30 shadow-md'
                        : 'hover:bg-white/[0.03] border border-transparent'
                    }`}
                  >
                    {/* Top row: Name, Channel Badge, Time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white truncate max-w-[130px]">
                          {conv.contact.name}
                        </span>

                        {/* Channel Badge */}
                        {conv.channel === 'whatsapp' ? (
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 text-[9px] font-mono border border-emerald-500/20">
                            WA
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded-md bg-cyan-500/10 text-cyan-400 text-[9px] font-mono border border-cyan-500/20">
                            WEB
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">{conv.lastMessageTime}</span>
                    </div>

                    {/* Last message snippet */}
                    <p className="text-xs text-slate-300 line-clamp-1 leading-snug">
                      {conv.lastMessage}
                    </p>

                    {/* Bottom row: Status & Cost badge */}
                    <div className="flex items-center justify-between text-[10px] pt-1">
                      {conv.status === 'ai_handling' ? (
                        <span className="flex items-center gap-1 text-violet-300 font-mono">
                          <Bot className="w-3 h-3 text-violet-400" />
                          <span>Valentina Activa</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400 font-mono font-semibold">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>Escalado a Humano</span>
                        </span>
                      )}

                      <span className="font-mono text-slate-400">
                        ${conv.totalCostMxn.toFixed(3)} MXN ({conv.totalTokens} tok)
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: Active Chat Transcript (5 cols) */}
        <div className="lg:col-span-5 apple-glass-card rounded-2xl flex flex-col overflow-hidden">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-sm font-bold text-white">
                    {selectedConv.contact.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white">{selectedConv.contact.name}</h3>
                      <span className="text-[10px] font-mono text-slate-400">{selectedConv.contact.phoneOrEmail}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Red: <span className="uppercase text-slate-300 font-mono">{selectedConv.channel}</span> • Origen: {selectedConv.contact.city || 'México'}
                    </p>
                  </div>
                </div>

                {/* Takeover Action Button */}
                <button
                  onClick={() => handleToggleTakeover(selectedConv.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-md ${
                    selectedConv.status === 'human_escalated'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                      : 'bg-violet-600 text-white hover:bg-violet-500 shadow-violet-600/30'
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
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedConv.messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isAi = msg.sender === 'ai_agent';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                    >
                      {/* Sender label */}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                        {isUser ? (
                          <>
                            <User className="w-3 h-3" />
                            <span>{selectedConv.contact.name}</span>
                          </>
                        ) : isAi ? (
                          <>
                            <Sparkles className="w-3 h-3 text-violet-400" />
                            <span className="text-violet-300 font-semibold">{msg.senderName || 'Valentina IA'}</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3 text-cyan-400" />
                            <span className="text-cyan-300 font-semibold">Operador Humano</span>
                          </>
                        )}
                        <span>• {msg.timestamp}</span>
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-white/[0.06] border border-white/[0.08] text-slate-100 rounded-tl-sm'
                            : isAi
                            ? 'bg-violet-950/40 border border-violet-500/30 text-slate-100 rounded-tr-sm shadow-inner'
                            : 'bg-cyan-950/40 border border-cyan-500/30 text-slate-100 rounded-tr-sm'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>

                        {/* Token and Cost metadata for AI messages */}
                        {isAi && msg.tokensUsed.total > 0 && (
                          <div className="mt-2 pt-1.5 border-t border-violet-500/20 flex items-center justify-between text-[9px] font-mono text-violet-300">
                            <span>Tokens: {msg.tokensUsed.total} (P: {msg.tokensUsed.prompt} | C: {msg.tokensUsed.completion})</span>
                            <span className="text-emerald-400 font-semibold">${msg.costMxn.toFixed(4)} MXN</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input & Dispatch */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/[0.06] bg-black/30 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    selectedConv.status === 'human_escalated'
                      ? 'Escribe tu respuesta como operador humano...'
                      : 'Escribe para intervenir o forzar mensaje en vivo...'
                  }
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                />

                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:hover:bg-violet-600 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="p-10 text-center text-slate-500 text-xs">Selecciona una conversación</div>
          )}
        </div>

        {/* COLUMN 3: Lead Dossier & Telemetry Breakdown (3 cols) */}
        <div className="lg:col-span-3 apple-glass-card rounded-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          {selectedConv ? (
            <>
              <div className="space-y-4">
                {/* Contact Dossier Header */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Expediente del Prospecto
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">{selectedConv.contact.name}</h4>
                  <p className="text-xs text-slate-400">{selectedConv.contact.phoneOrEmail}</p>
                </div>

                {/* Lead Qualification Score */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-white">
                    <span>Lead Score (IA)</span>
                    <span className="text-emerald-400 font-mono">{selectedConv.contact.qualificationScore || 85}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${selectedConv.contact.qualificationScore || 85}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-400">Alta probabilidad de conversión detectada por Valentina.</p>
                </div>

                {/* AI Executive Summary of the Chat */}
                {selectedConv.summary && (
                  <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Resumen Automático</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {selectedConv.summary}
                    </p>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400">Etiquetas Asignadas</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedConv.contact.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[10px] text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Telemetry Breakdown for this conversation */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Telemetría de la Sesión</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/[0.06]">
                      <span className="text-[10px] text-slate-400">Tokens Totales</span>
                      <p className="font-mono font-bold text-white">{selectedConv.totalTokens}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-black/40 border border-white/[0.06]">
                      <span className="text-[10px] text-slate-400">Costo de la Charla</span>
                      <p className="font-mono font-bold text-emerald-400">${selectedConv.totalCostMxn.toFixed(4)} MXN</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tenant Guarantee Badge */}
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/[0.06] text-[10px] text-slate-400 text-center font-mono">
                Aislamiento RLS Tenant: <span className="text-violet-400 font-bold">{selectedConv.tenantId}</span>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500">Sin datos</div>
          )}
        </div>
      </div>
    </div>
  );
};
