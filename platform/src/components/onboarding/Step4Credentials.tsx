import React from 'react';
import { UserLevel } from '../../types/platform';
import { Key, RefreshCw, CheckCircle2 } from 'lucide-react';

interface Props {
  contactName: string;
  setContactName: (v: string) => void;
  contactJobTitle: string;
  setContactJobTitle: (v: string) => void;
  contactLevel: UserLevel;
  setContactLevel: (v: UserLevel) => void;
  contactEmail: string;
  setContactEmail: (v: string) => void;
  contactPassword: string;
  copiedPassword: boolean;
  setCopiedPassword: (v: boolean) => void;
  onRegeneratePassword: () => void;
}

export const Step4Credentials: React.FC<Props> = ({
  contactName,
  setContactName,
  contactJobTitle,
  setContactJobTitle,
  contactLevel,
  setContactLevel,
  contactEmail,
  setContactEmail,
  contactPassword,
  copiedPassword,
  setCopiedPassword,
  onRegeneratePassword,
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="p-3.5 rounded-xl bg-[#e8f0fe] border border-[#d3e3fd] text-[#041e49] flex items-center gap-2.5">
        <Key className="w-5 h-5 text-[#0b57d0] shrink-0" />
        <div>
          <strong className="block text-xs font-semibold">
            Paso 4: Credenciales del Director &amp; Emisión del Expediente
          </strong>
          <span className="text-[11px] text-[#3c4043]">
            Se generará la Ficha Oficial de Credenciales con QR y contraseña provisional para el directivo.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[#5f6368] block mb-1 font-medium">
            Nombre Completo del Director / Titular *
          </label>
          <input
            type="text"
            required
            placeholder="ej. Dr. Roberto Valdés"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
          />
        </div>

        <div>
          <label className="text-[#5f6368] block mb-1 font-medium">Cargo o Puesto *</label>
          <input
            type="text"
            required
            placeholder="ej. Director General / Titular"
            value={contactJobTitle}
            onChange={(e) => setContactJobTitle(e.target.value)}
            className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[#5f6368] block mb-1 font-medium">
            Correo Electrónico Corporativo (Usuario) *
          </label>
          <input
            type="email"
            required
            placeholder="ej. direccion@empresa.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
          />
        </div>

        <div>
          <label className="text-[#5f6368] block mb-1 font-medium">Nivel Organizacional</label>
          <select
            value={contactLevel}
            onChange={(e) => setContactLevel(e.target.value as UserLevel)}
            className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
          >
            <option value="director">👑 Director / C-Level</option>
            <option value="coordinador">📋 Coordinador / Supervisor</option>
            <option value="asesor">💬 Asesor / Ventas</option>
          </select>
        </div>
      </div>

      {/* Contraseña Temporal Generada */}
      <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0] space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[#5f6368] font-medium block">Contraseña Provisional Generada</label>
          <button
            type="button"
            onClick={onRegeneratePassword}
            className="text-[11px] text-[#0b57d0] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Regenerar
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={contactPassword}
            className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 font-mono text-[#137333] font-bold"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(contactPassword);
              setCopiedPassword(true);
              setTimeout(() => setCopiedPassword(false), 2000);
            }}
            className="px-3 py-2 rounded-lg bg-white border border-[#dadce0] text-[#1f1f1f] hover:bg-[#f1f3f4] transition cursor-pointer shrink-0 font-medium"
          >
            {copiedPassword ? '¡Copiada!' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Banner de Salida Digital */}
      <div className="p-3.5 rounded-xl bg-[#e8f0fe] border border-[#d3e3fd] text-[11px] text-[#041e49] space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-[#0b57d0]">
          <CheckCircle2 className="w-4 h-4" /> Emisión Automática del Expediente Digital
        </div>
        <p className="text-[#3c4043]">
          Al confirmar el alta, el backend compilará de forma inmediata el expediente con los 4 documentos
          oficiales listos para descarga e impresión: <strong>Cotización Formal</strong>,{' '}
          <strong>Convenio Comercial Legal</strong>, <strong>Anexo RACI</strong> y{' '}
          <strong>Ficha de Credenciales</strong>.
        </p>
      </div>
    </div>
  );
};
