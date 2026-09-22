'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AuthUser, PipelineStage, ChannelType } from '../../types/platform';
import { getUserLevelConfig } from '../../lib/permissions';
import {
  fetchCrmContacts,
  fetchCrmTeam,
  changePipelineStage,
  subscribeToTenantCrm,
  downloadPipelineCsv,
  CrmContactListItem,
  CrmTeamMember,
} from '../../lib/crmClientService';
import { Search, RefreshCw, Users, LayoutGrid, Download } from 'lucide-react';

interface Props {
  tenantId: string;
  currentUser?: AuthUser | null;
}

const STAGE_ORDER: PipelineStage[] = ['nuevo', 'contactado', 'calificado', 'propuesta', 'ganado', 'perdido'];

const STAGE_LABELS: Record<PipelineStage, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  calificado: 'Calificado',
  propuesta: 'Propuesta Enviada',
  ganado: 'Inscrito / Ganado',
  perdido: 'Perdido',
};

const STAGE_HEADER_STYLES: Record<PipelineStage, string> = {
  nuevo: 'bg-[#f1f3f4] text-[#3c4043] border-[#dadce0]',
  contactado: 'bg-[#e8f0fe] text-[#0b57d0] border-[#d3e3fd]',
  calificado: 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]',
  propuesta: 'bg-[#f3e8fd] text-[#7a22ce] border-[#d8b4fe]',
  ganado: 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]',
  perdido: 'bg-[#fce8e6] text-[#c5221f] border-[#f5c2c7]',
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  web: 'Webchat',
  messenger: 'Messenger',
  instagram: 'Instagram',
};

export const CrmPipelineBoard: React.FC<Props> = ({ tenantId, currentUser }) => {
  const levelConfig = getUserLevelConfig(currentUser || null);
  const canManageCRM = levelConfig.canManageCRM;

  const [contacts, setContacts] = useState<CrmContactListItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<CrmTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingContactId, setUpdatingContactId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [channelFilter, setChannelFilter] = useState<'all' | ChannelType>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'unassigned' | string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadContacts = useCallback(async () => {
    if (!tenantId) return;
    const data = await fetchCrmContacts(tenantId);
    setContacts(data);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    setLoading(true);
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (canManageCRM) {
      fetchCrmTeam(tenantId).then(setTeamMembers);
    }
  }, [tenantId, canManageCRM]);

  // Cualquier asignación/etapa/nota que cambie otro miembro del equipo se
  // refleja aquí sin recargar la página — Supabase Realtime real, no polling.
  useEffect(() => {
    const unsubscribe = subscribeToTenantCrm(tenantId, loadContacts);
    return unsubscribe;
  }, [tenantId, loadContacts]);

  const handleStageChange = async (contact: CrmContactListItem, stage: PipelineStage) => {
    if (updatingContactId) return;
    setUpdatingContactId(contact.contactId);
    setError(null);
    const result = await changePipelineStage(tenantId, contact.contactId, stage);
    setUpdatingContactId(null);
    if (!result.success || !result.crm) {
      setError(result.error || 'No se pudo cambiar la etapa.');
      return;
    }
    setContacts((prev) =>
      prev.map((c) =>
        c.contactId === contact.contactId
          ? { ...c, pipelineStage: result.crm!.pipelineStage, stageUpdatedAt: result.crm!.stageUpdatedAt }
          : c
      )
    );
  };

  const handleExportPipeline = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setError(null);
    const result = await downloadPipelineCsv(tenantId);
    setIsExporting(false);
    if (!result.success) {
      setError(result.error || 'No se pudo exportar el pipeline.');
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (channelFilter !== 'all' && c.channelOrigin !== channelFilter) return false;
    if (assigneeFilter === 'unassigned' && c.assignedTo !== null) return false;
    if (assigneeFilter !== 'all' && assigneeFilter !== 'unassigned' && c.assignedTo !== assigneeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = (c.name || '').toLowerCase().includes(q);
      const matchesPhone = c.phoneOrEmail.toLowerCase().includes(q);
      const matchesTag = c.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchesName && !matchesPhone && !matchesTag) return false;
    }
    return true;
  });

  const contactsByStage = STAGE_ORDER.reduce<Record<PipelineStage, CrmContactListItem[]>>((acc, stage) => {
    acc[stage] = filteredContacts.filter((c) => c.pipelineStage === stage);
    return acc;
  }, {} as Record<PipelineStage, CrmContactListItem[]>);

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#1f1f1f] tracking-tight">Pipeline CRM</h2>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
              <span className="w-2 h-2 rounded-full bg-[#137333] animate-pulse"></span>
              En Vivo
            </span>
          </div>
          <p className="text-xs text-[#5f6368]">
            {canManageCRM
              ? 'Vista completa del embudo de ventas de todo el equipo.'
              : 'Tus leads asignados y los que aún no tienen dueño.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPipeline}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#0b57d0] hover:bg-[#0842a0] text-white transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Exportando...' : 'Exportar Pipeline (CSV)'}
          </button>
          <button
            onClick={loadContacts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#dadce0] text-[#0b57d0] hover:bg-[#f8f9fa] transition cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white border border-[#dadce0] rounded-2xl p-2.5 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#747775]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, teléfono o etiqueta..."
            className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
          />
        </div>

        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value as 'all' | ChannelType)}
          className="text-xs border border-[#dadce0] rounded-xl px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0b57d0] cursor-pointer"
        >
          <option value="all">Todos los canales</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="web">Webchat</option>
        </select>

        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="text-xs border border-[#dadce0] rounded-xl px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0b57d0] cursor-pointer"
        >
          <option value="all">Todos</option>
          <option value="unassigned">Sin asignar</option>
          {canManageCRM &&
            teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
        </select>
      </div>

      {error && (
        <div className="px-3.5 py-2 rounded-xl bg-[#fce8e6] border border-[#f5c2c7] text-[#c5221f] text-xs font-medium">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div className="p-10 text-center text-[#747775] text-xs bg-white border border-[#dadce0] rounded-2xl">
          Cargando pipeline...
        </div>
      ) : contacts.length === 0 ? (
        <div className="p-10 text-center text-[#747775] text-xs bg-white border border-[#dadce0] rounded-2xl flex flex-col items-center gap-2">
          <LayoutGrid className="w-6 h-6 text-[#dadce0]" />
          <span>Todavía no hay contactos en el CRM de este tenant.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {STAGE_ORDER.map((stage) => (
            <div key={stage} className="bg-[#f8f9fa] border border-[#dadce0] rounded-2xl flex flex-col min-h-[200px]">
              <div
                className={`px-3 py-2 rounded-t-2xl border-b flex items-center justify-between ${STAGE_HEADER_STYLES[stage]}`}
              >
                <span className="text-xs font-bold">{STAGE_LABELS[stage]}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/70">
                  {contactsByStage[stage].length}
                </span>
              </div>

              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[560px]">
                {contactsByStage[stage].length === 0 ? (
                  <p className="text-[10px] text-[#9aa0a6] text-center py-4">Sin leads en esta etapa.</p>
                ) : (
                  contactsByStage[stage].map((contact) => (
                    <div
                      key={contact.contactId}
                      className="bg-white border border-[#dadce0] rounded-xl p-2.5 space-y-1.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-[#1f1f1f] truncate">
                          {contact.name || contact.phoneOrEmail}
                        </span>
                        {contact.qualificationScore != null && (
                          <span className="text-[10px] font-mono font-bold text-[#137333] shrink-0">
                            {contact.qualificationScore}/100
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#5f6368] font-mono truncate">{contact.phoneOrEmail}</p>

                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-[#f1f3f4] text-[9px] font-semibold text-[#3c4043]">
                          {CHANNEL_LABELS[contact.channelOrigin] || contact.channelOrigin}
                        </span>
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#e8f0fe] text-[9px] font-semibold text-[#0b57d0]">
                          <Users className="w-2.5 h-2.5" />
                          {contact.assignedToName || (contact.assignedTo === currentUser?.id ? 'Tú' : 'Sin asignar')}
                        </span>
                      </div>

                      {contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded-full bg-[#f1f3f4] text-[9px] font-medium text-[#5f6368]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <select
                        value={contact.pipelineStage}
                        onChange={(e) => handleStageChange(contact, e.target.value as PipelineStage)}
                        disabled={updatingContactId === contact.contactId}
                        className="w-full text-[10px] border border-[#dadce0] rounded-lg px-1.5 py-1 bg-[#f8f9fa] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] disabled:opacity-50 cursor-pointer"
                      >
                        {STAGE_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {STAGE_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
