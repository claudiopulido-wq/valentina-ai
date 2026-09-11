import React from 'react';
import { Building2 } from 'lucide-react';

interface Props {
  companyName: string;
  setCompanyName: (v: string) => void;
  legalBusinessName: string;
  setLegalBusinessName: (v: string) => void;
  rfc: string;
  setRfc: (v: string) => void;
  taxAddress: string;
  setTaxAddress: (v: string) => void;
  industry: string;
  setIndustry: (v: string) => void;
  legalRepresentative: string;
  setLegalRepresentative: (v: string) => void;
  emojiLogo: string;
  setEmojiLogo: (v: string) => void;
  contactName: string;
  setContactName: (v: string) => void;
}

export const Step1CorporateIdentity: React.FC<Props> = ({
  companyName,
  setCompanyName,
  legalBusinessName,
  setLegalBusinessName,
  rfc,
  setRfc,
  taxAddress,
  setTaxAddress,
  industry,
  setIndustry,
  legalRepresentative,
  setLegalRepresentative,
  emojiLogo,
  setEmojiLogo,
  contactName,
  setContactName,
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="p-3.5 rounded-xl bg-[#e8f0fe] border border-[#d3e3fd] text-[#041e49] flex items-center gap-2.5">
        <Building2 className="w-5 h-5 text-[#0b57d0] shrink-0" />
        <div>
          <strong className="block text-xs font-semibold">Paso 1: Identidad Corporativa &amp; Fiscal</strong>
          <span className="text-[11px] text-[#3c4043]">
            Estos datos se imprimirán de forma automática en la Carátula del Convenio Legal B2B y la Cotización.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="text-[#5f6368] block mb-1 font-medium">Nombre Comercial de la Empresa *</label>
          <input
            type="text"
            required
            placeholder="ej. Clínica Dermatológica Polanco"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              if (!legalBusinessName) {
                setLegalBusinessName(`${e.target.value} S.A. de C.V.`);
              }
            }}
            className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
          />
        </div>
        <div>
          <label className="text-[#5f6368] block mb-1 font-medium">Ícono / Emoji</label>
          <input
            type="text"
            maxLength={2}
            value={emojiLogo}
            onChange={(e) => setEmojiLogo(e.target.value)}
            className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-center text-base focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[#5f6368] block mb-1 font-medium">Razón Social Completa *</label>
          <input
            type="text"
            required
            placeholder="ej. DermaHealth Care S.A. de C.V."
            value={legalBusinessName}
            onChange={(e) => setLegalBusinessName(e.target.value)}
            className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
          />
        </div>

        <div>
          <label className="text-[#5f6368] block mb-1 font-medium">RFC de la Empresa *</label>
          <input
            type="text"
            required
            maxLength={13}
            placeholder="ej. DHC240101XYZ"
            value={rfc}
            onChange={(e) => setRfc(e.target.value.toUpperCase())}
            className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 font-mono uppercase text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
          />
        </div>
      </div>

      <div>
        <label className="text-[#5f6368] block mb-1 font-medium">Domicilio Fiscal Completo *</label>
        <input
          type="text"
          required
          placeholder="ej. Av. Masaryk 101, Piso 4, Polanco, C.P. 11560, Miguel Hidalgo, CDMX"
          value={taxAddress}
          onChange={(e) => setTaxAddress(e.target.value)}
          className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[#5f6368] block mb-1 font-medium">Giro o Sector Comercial *</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
          >
            <option value="Salud & Especialidades">🏥 Salud, Clínicas & Especialidades</option>
            <option value="Inmobiliario & Desarrollos">🏢 Inmobiliario & Desarrollos</option>
            <option value="Servicios Legales & Notariales">⚖️ Servicios Legales & Notariales</option>
            <option value="Automotriz & Talleres">🚗 Automotriz & Talleres</option>
            <option value="Educación & Universidades">🎓 Educación & Universidades</option>
            <option value="Comercio & Retail">🛍️ Comercio & Retail</option>
            <option value="Servicios Corporativos B2B">💼 Servicios Corporativos B2B</option>
          </select>
        </div>

        <div>
          <label className="text-[#5f6368] block mb-1 font-medium">Representante Legal (Titular de Firma) *</label>
          <input
            type="text"
            required
            placeholder="ej. Dr. Roberto Valdés Méndez"
            value={legalRepresentative}
            onChange={(e) => {
              setLegalRepresentative(e.target.value);
              if (!contactName) setContactName(e.target.value);
            }}
            className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
          />
        </div>
      </div>
    </div>
  );
};
