import React from 'react';
import { Cpu, Smartphone, Globe, MessageSquare } from 'lucide-react';

interface Props {
  waNumber: string;
  setWaNumber: (v: string) => void;
  enableWebchat: boolean;
  setEnableWebchat: (v: boolean) => void;
  enableInstagram: boolean;
  setEnableInstagram: (v: boolean) => void;
  selectedCrm: string;
  setSelectedCrm: (v: string) => void;
  selectedCalendar: string;
  setSelectedCalendar: (v: string) => void;
  knowledgeNotes: string;
  setKnowledgeNotes: (v: string) => void;
}

export const Step2ChannelsArchitecture: React.FC<Props> = ({
  waNumber,
  setWaNumber,
  enableWebchat,
  setEnableWebchat,
  enableInstagram,
  setEnableInstagram,
  selectedCrm,
  setSelectedCrm,
  selectedCalendar,
  setSelectedCalendar,
  knowledgeNotes,
  setKnowledgeNotes,
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="p-3.5 rounded-xl bg-[#e8f0fe] border border-[#d3e3fd] text-[#041e49] flex items-center gap-2.5">
        <Cpu className="w-5 h-5 text-[#0b57d0] shrink-0" />
        <div>
          <strong className="block text-xs font-semibold">Paso 2: Arquitectura del Bot &amp; Canales de Entrada</strong>
          <span className="text-[11px] text-[#3c4043]">
            Configure la línea de WhatsApp Cloud API y los sistemas que el agente interconectará.
          </span>
        </div>
      </div>

      <div>
        <label className="text-[#5f6368] block mb-1 font-medium">Línea Telefónica de WhatsApp Cloud API *</label>
        <div className="relative">
          <Smartphone className="w-4 h-4 text-[#747775] absolute left-3 top-2.5" />
          <input
            type="text"
            required
            placeholder="+52 442 000 0000 (Número exclusivo sin WhatsApp activo)"
            value={waNumber}
            onChange={(e) => setWaNumber(e.target.value)}
            className="w-full bg-white border border-[#dadce0] rounded-lg pl-9 pr-3 py-2 font-mono text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
          />
        </div>
        <span className="text-[10px] text-[#5f6368] mt-1 block">
          El número no debe tener WhatsApp activo en ningún teléfono al momento del enlace a la API de Meta.
        </span>
      </div>

      <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0] space-y-2.5">
        <span className="font-bold text-[11px] text-[#1f1f1f] uppercase tracking-wider block">
          Canales Secundarios Habilitados
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-[#dadce0] cursor-pointer hover:bg-[#f1f3f4]">
            <input
              type="checkbox"
              checked={enableWebchat}
              onChange={(e) => setEnableWebchat(e.target.checked)}
              className="rounded text-[#0b57d0] focus:ring-[#0b57d0]"
            />
            <Globe className="w-4 h-4 text-[#0b57d0]" />
            <span className="font-medium text-[#1f1f1f]">Webchat Flotante en Sitio Web</span>
          </label>

          <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-[#dadce0] cursor-pointer hover:bg-[#f1f3f4]">
            <input
              type="checkbox"
              checked={enableInstagram}
              onChange={(e) => setEnableInstagram(e.target.checked)}
              className="rounded text-[#0b57d0] focus:ring-[#0b57d0]"
            />
            <MessageSquare className="w-4 h-4 text-[#e37400]" />
            <span className="font-medium text-[#1f1f1f]">Instagram DM (Fase 2)</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[#5f6368] block mb-1 font-medium">CRM a Conectar</label>
          <select
            value={selectedCrm}
            onChange={(e) => setSelectedCrm(e.target.value)}
            className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
          >
            <option value="Google Sheets & Webhook">Google Sheets &amp; Webhook Automático</option>
            <option value="HubSpot CRM">HubSpot CRM (API Key)</option>
            <option value="Zoho CRM">Zoho CRM</option>
            <option value="Ninguno / Solo Portal Valentina">Solo Bandeja en Portal Valentina</option>
          </select>
        </div>

        <div>
          <label className="text-[#5f6368] block mb-1 font-medium">Calendario de Citas</label>
          <select
            value={selectedCalendar}
            onChange={(e) => setSelectedCalendar(e.target.value)}
            className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
          >
            <option value="Google Calendar">Google Calendar Institucional</option>
            <option value="Cal.com">Cal.com API</option>
            <option value="Sin agendamiento directo">Sin agendamiento automático</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-[#5f6368] block mb-1 font-medium">Documentación Base &amp; Catálogos (Notas o URLs)</label>
        <textarea
          rows={2}
          placeholder="ej. Catálogo de servicios 2026, lista de precios vigente y políticas de garantía adjuntas."
          value={knowledgeNotes}
          onChange={(e) => setKnowledgeNotes(e.target.value)}
          className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
        />
      </div>
    </div>
  );
};
