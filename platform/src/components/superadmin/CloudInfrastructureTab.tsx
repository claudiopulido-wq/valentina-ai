import React from 'react';
import { Tenant } from '../../types/platform';
import {
  Layers,
  Save,
  CheckCircle2,
  MessageCircle,
  Cpu,
  Database,
  Server,
  Globe,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  tenants: Tenant[];
  totalRevenueMxn: number;
  totalAiTokens: number;
  totalAiCostMxn: number;
  totalFixedCloudCostMxn: number;
  netProfitMxn: number;
  grossMargin: string;
  supabaseCostMxn: number;
  onSupabaseCostChange: (v: number) => void;
  railwayCostMxn: number;
  onRailwayCostChange: (v: number) => void;
  vercelCostMxn: number;
  onVercelCostChange: (v: number) => void;
  domainCostMxn: number;
  onDomainCostChange: (v: number) => void;
  infraSaveNote: boolean;
  onSaveInfra: () => void;
}

export const CloudInfrastructureTab: React.FC<Props> = ({
  tenants,
  totalRevenueMxn,
  totalAiTokens,
  totalAiCostMxn,
  totalFixedCloudCostMxn,
  netProfitMxn,
  grossMargin,
  supabaseCostMxn,
  onSupabaseCostChange,
  railwayCostMxn,
  onRailwayCostChange,
  vercelCostMxn,
  onVercelCostChange,
  domainCostMxn,
  onDomainCostChange,
  infraSaveNote,
  onSaveInfra,
}) => {
  return (
    <div className="space-y-6">
      {/* Header de Sección */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1f1f1f] tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0b57d0]" />
            <span>Infraestructura Cloud &amp; P&amp;L Operativo Real</span>
          </h2>
          <p className="text-xs text-[#5f6368]">
            Auditoría financiera y costos mensuales de servidores que sustentan Valentina AI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {infraSaveNote && (
            <span className="text-xs font-semibold text-[#137333] bg-[#e6f4ea] border border-[#ceead6] px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" /> Cambios guardados
            </span>
          )}
          <button
            onClick={onSaveInfra}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar Ajustes de Costos</span>
          </button>
        </div>
      </div>

      {/* Banner Oficial: Regla Comercial Meta WhatsApp ($0 costo para ti) */}
      <div className="bg-[#e6f4ea] border border-[#ceead6] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
        <div className="p-2 rounded-xl bg-white text-[#137333] shadow-xs shrink-0 mt-0.5">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-[#137333]">Regla Comercial Oficial: Meta WhatsApp Cloud API = $0.00 MXN para Valentina</h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#137333] text-white">Facturado al Cliente</span>
          </div>
          <p className="text-[#0d652d] leading-relaxed">
            Tú configuras la API oficial de WhatsApp Cloud en el <em>Meta Business Manager</em> de cada cliente. 
            Los cargos por conversaciones fuera de las 1,000 gratuitas <strong>los cobra Meta directamente a la tarjeta bancaria del cliente</strong>. 
            Tu suscripción cubre el 100% de la <strong>Inferencia de IA (OpenAI / Gemini / Anthropic)</strong> y la <strong>Infraestructura Cloud (Supabase / Railway / Vercel)</strong>.
          </p>
        </div>
      </div>

      {/* Grid de Componentes Cloud: Costos Variables y Fijos Editables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Componente 1: Inferencia IA (Variable en Tiempo Real) */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#e8f0fe] text-[#0b57d0]">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1f1f1f]">Inferencia de IA (Modelos)</h4>
                  <p className="text-[10px] text-[#5f6368]">OpenAI, Google Gemini, Voyage AI</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f0fe] text-[#0b57d0]">Variable</span>
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-2xl font-bold font-mono text-[#1f1f1f]">
                ${totalAiCostMxn.toFixed(2)} <span className="text-xs font-normal text-[#5f6368]">MXN / mes</span>
              </p>
              <p className="text-[11px] text-[#5f6368]">
                Calculado en vivo sobre <span className="font-mono font-semibold text-[#1f1f1f]">{totalAiTokens.toLocaleString('es-MX')} tokens</span> consumidos en las conversaciones de tus clientes.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#f1f3f4] text-[11px] text-[#5f6368] space-y-1">
            <div className="flex justify-between">
              <span>UGES (302 msgs en vivo):</span>
              <span className="font-mono font-semibold text-[#1f1f1f]">${(tenants.find(t => t.id === 'tenant-uges')?.totalSpentMxn || 4.64).toFixed(2)} MXN</span>
            </div>
            <div className="flex justify-between">
              <span>CONOCER:</span>
              <span className="font-mono font-semibold text-[#1f1f1f]">${(tenants.find(t => t.id === 'tenant-conocer')?.totalSpentMxn || 18.50).toFixed(2)} MXN</span>
            </div>
          </div>
        </div>

        {/* Componente 2: Supabase (Base de Datos & pgvector) */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#e6f4ea] text-[#137333]">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1f1f1f]">Supabase PostgreSQL</h4>
                  <p className="text-[10px] text-[#5f6368]">RLS, Base Conocimiento &amp; pgvector</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f3f4] text-[#5f6368]">Fijo</span>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-[11px] font-medium text-[#5f6368] block">Tu Costo Mensual en MXN:</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-mono text-[#5f6368]">$</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={supabaseCostMxn}
                  onChange={(e) => onSupabaseCostChange(Number(e.target.value))}
                  className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-lg pl-7 pr-12 py-1.5 text-xs font-mono font-bold text-[#1f1f1f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                />
                <span className="absolute right-3 top-2 text-[10px] text-[#5f6368] font-mono">MXN</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#f1f3f4] flex items-center justify-between gap-1">
            <span className="text-[10px] text-[#5f6368]">Preajustes:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSupabaseCostChange(0)}
                className={`px-2 py-0.5 text-[10px] rounded border cursor-pointer ${supabaseCostMxn === 0 ? 'bg-[#0b57d0] text-white border-[#0b57d0]' : 'bg-white text-[#5f6368] border-[#dadce0]'}`}
              >
                Free ($0)
              </button>
              <button
                onClick={() => onSupabaseCostChange(500)}
                className={`px-2 py-0.5 text-[10px] rounded border cursor-pointer ${supabaseCostMxn === 500 ? 'bg-[#0b57d0] text-white border-[#0b57d0]' : 'bg-white text-[#5f6368] border-[#dadce0]'}`}
              >
                Pro ($500 / $25 USD)
              </button>
            </div>
          </div>
        </div>

        {/* Componente 3: Railway (Bot Workers 24/7) */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#fef7e0] text-[#b06000]">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1f1f1f]">Railway Webhooks</h4>
                  <p className="text-[10px] text-[#5f6368]">Servidores WhatsApp Workers 24/7</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f3f4] text-[#5f6368]">Fijo</span>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-[11px] font-medium text-[#5f6368] block">Tu Costo Mensual en MXN:</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-mono text-[#5f6368]">$</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={railwayCostMxn}
                  onChange={(e) => onRailwayCostChange(Number(e.target.value))}
                  className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-lg pl-7 pr-12 py-1.5 text-xs font-mono font-bold text-[#1f1f1f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                />
                <span className="absolute right-3 top-2 text-[10px] text-[#5f6368] font-mono">MXN</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#f1f3f4] flex items-center justify-between gap-1">
            <span className="text-[10px] text-[#5f6368]">Preajustes:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onRailwayCostChange(100)}
                className={`px-2 py-0.5 text-[10px] rounded border cursor-pointer ${railwayCostMxn === 100 ? 'bg-[#0b57d0] text-white border-[#0b57d0]' : 'bg-white text-[#5f6368] border-[#dadce0]'}`}
              >
                Hobby ($100 / $5 USD)
              </button>
              <button
                onClick={() => onRailwayCostChange(400)}
                className={`px-2 py-0.5 text-[10px] rounded border cursor-pointer ${railwayCostMxn === 400 ? 'bg-[#0b57d0] text-white border-[#0b57d0]' : 'bg-white text-[#5f6368] border-[#dadce0]'}`}
              >
                Pro ($400 / $20 USD)
              </button>
            </div>
          </div>
        </div>

        {/* Componente 4: Vercel (Frontend Dashboard) */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#f1f3f4] text-[#1f1f1f]">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1f1f1f]">Vercel Platform</h4>
                  <p className="text-[10px] text-[#5f6368]">Hosting Next.js Dashboard</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f3f4] text-[#5f6368]">Fijo</span>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-[11px] font-medium text-[#5f6368] block">Tu Costo Mensual en MXN:</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-mono text-[#5f6368]">$</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={vercelCostMxn}
                  onChange={(e) => onVercelCostChange(Number(e.target.value))}
                  className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-lg pl-7 pr-12 py-1.5 text-xs font-mono font-bold text-[#1f1f1f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                />
                <span className="absolute right-3 top-2 text-[10px] text-[#5f6368] font-mono">MXN</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#f1f3f4] flex items-center justify-between gap-1">
            <span className="text-[10px] text-[#5f6368]">Preajustes:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onVercelCostChange(0)}
                className={`px-2 py-0.5 text-[10px] rounded border cursor-pointer ${vercelCostMxn === 0 ? 'bg-[#0b57d0] text-white border-[#0b57d0]' : 'bg-white text-[#5f6368] border-[#dadce0]'}`}
              >
                Hobby ($0)
              </button>
              <button
                onClick={() => onVercelCostChange(400)}
                className={`px-2 py-0.5 text-[10px] rounded border cursor-pointer ${vercelCostMxn === 400 ? 'bg-[#0b57d0] text-white border-[#0b57d0]' : 'bg-white text-[#5f6368] border-[#dadce0]'}`}
              >
                Pro ($400)
              </button>
            </div>
          </div>
        </div>

        {/* Componente 5: Dominio & DNS (Cloudflare) */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#fce8e6] text-[#c5221f]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1f1f1f]">Dominio &amp; Cloudflare SSL</h4>
                  <p className="text-[10px] text-[#5f6368]">valentina-ai.mx &amp; DNS Seguro</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f3f4] text-[#5f6368]">Fijo</span>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-[11px] font-medium text-[#5f6368] block">Tu Costo Mensual en MXN:</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-mono text-[#5f6368]">$</span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={domainCostMxn}
                  onChange={(e) => onDomainCostChange(Number(e.target.value))}
                  className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-lg pl-7 pr-12 py-1.5 text-xs font-mono font-bold text-[#1f1f1f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                />
                <span className="absolute right-3 top-2 text-[10px] text-[#5f6368] font-mono">MXN</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#f1f3f4] text-[10px] text-[#5f6368]">
            Prorrateo de ~$12 USD anuales de registro de dominio.
          </div>
        </div>

        {/* Resumen Total Infraestructura Fija */}
        <div className="bg-[#f0f4f9] border border-[#dadce0] rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368]">Total Costos Fijos Servidores</span>
            <p className="text-2xl font-bold font-mono text-[#1f1f1f] mt-1">
              ${totalFixedCloudCostMxn.toFixed(2)} <span className="text-xs font-normal text-[#5f6368]">MXN / mes</span>
            </p>
            <p className="text-xs text-[#5f6368] mt-1">
              Supabase (${supabaseCostMxn}) + Railway (${railwayCostMxn}) + Vercel (${vercelCostMxn}) + DNS (${domainCostMxn})
            </p>
          </div>

          <div className="pt-3 border-t border-[#dadce0] text-[11px] text-[#0b57d0] font-semibold">
            ✓ Capacidad holgada para atender más de 50 empresas simultáneas
          </div>
        </div>
      </div>

      {/* TABLA FORMAL DE ESTADO DE RESULTADOS (P&L REAL VALENTINA AI) */}
      <div className="bg-white border border-[#dadce0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-[#dadce0] bg-[#f8f9fa] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1f1f1f]">Estado de Resultados Operativo (P&amp;L Mensual)</h3>
            <p className="text-xs text-[#5f6368]">Ingresos netos por suscripciones menos costos operativos directos</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
            Margen Neto: {grossMargin}%
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-3 text-xs">
          {/* Renglón Ingresos */}
          <div className="flex items-center justify-between py-2 border-b border-[#f1f3f4]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0b57d0]"></span>
              <span className="font-semibold text-[#1f1f1f] text-sm">Facturación Bruta por Suscripciones</span>
              <span className="text-[11px] text-[#5f6368]">({tenants.length} clientes activos)</span>
            </div>
            <span className="font-mono font-bold text-sm text-[#0b57d0]">
              +${totalRevenueMxn.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
            </span>
          </div>

          {/* Renglón Meta WhatsApp */}
          <div className="flex items-center justify-between py-1.5 text-[#5f6368]">
            <div className="flex items-center gap-2 pl-4">
              <span>↳ Meta WhatsApp Cloud API (Mensajes de usuarios)</span>
              <span className="text-[10px] bg-[#e6f4ea] text-[#137333] px-2 py-0.5 rounded-full font-semibold">Absorbido por el cliente</span>
            </div>
            <span className="font-mono font-semibold text-[#137333]">
              $0.00 MXN
            </span>
          </div>

          {/* Renglón Inferencia IA */}
          <div className="flex items-center justify-between py-1.5 text-[#5f6368]">
            <div className="flex items-center gap-2 pl-4">
              <span>↳ Inferencia de Modelos de IA (Tokens OpenAI/Gemini)</span>
              <span className="text-[10px] text-[#5f6368] font-mono">({totalAiTokens.toLocaleString('es-MX')} tokens)</span>
            </div>
            <span className="font-mono font-semibold text-[#c5221f]">
              -${totalAiCostMxn.toFixed(2)} MXN
            </span>
          </div>

          {/* Renglón Supabase */}
          <div className="flex items-center justify-between py-1.5 text-[#5f6368]">
            <div className="flex items-center gap-2 pl-4">
              <span>↳ Base de Datos Supabase (PostgreSQL, RLS &amp; pgvector)</span>
            </div>
            <span className="font-mono font-semibold text-[#c5221f]">
              -${supabaseCostMxn.toFixed(2)} MXN
            </span>
          </div>

          {/* Renglón Railway */}
          <div className="flex items-center justify-between py-1.5 text-[#5f6368]">
            <div className="flex items-center gap-2 pl-4">
              <span>↳ Servidores Railway (Workers de WhatsApp 24/7)</span>
            </div>
            <span className="font-mono font-semibold text-[#c5221f]">
              -${railwayCostMxn.toFixed(2)} MXN
            </span>
          </div>

          {/* Renglón Vercel */}
          <div className="flex items-center justify-between py-1.5 text-[#5f6368]">
            <div className="flex items-center gap-2 pl-4">
              <span>↳ Hosting Vercel (Consola y Dashboard Web)</span>
            </div>
            <span className="font-mono font-semibold text-[#c5221f]">
              -${vercelCostMxn.toFixed(2)} MXN
            </span>
          </div>

          {/* Renglón Dominio */}
          <div className="flex items-center justify-between py-1.5 text-[#5f6368]">
            <div className="flex items-center gap-2 pl-4">
              <span>↳ Registro de Dominio &amp; DNS Cloudflare</span>
            </div>
            <span className="font-mono font-semibold text-[#c5221f]">
              -${domainCostMxn.toFixed(2)} MXN
            </span>
          </div>

          {/* Renglón Total Costos Operativos */}
          <div className="flex items-center justify-between py-2 border-t border-[#dadce0] text-[#c5221f] font-semibold">
            <span>(-) Total Gastos de Operación Valentina AI</span>
            <span className="font-mono">-${(totalAiCostMxn + totalFixedCloudCostMxn).toFixed(2)} MXN</span>
          </div>

          {/* Utilidad Operativa Neta */}
          <div className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-[#e6f4ea] border border-[#ceead6] mt-3">
            <div>
              <h4 className="font-bold text-base text-[#137333] tracking-tight">(=) UTILIDAD OPERATIVA NETA REAL</h4>
              <p className="text-xs text-[#0d652d]">Ganancia limpia mensual para Valentina AI tras deducir IA y servidores</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-2xl text-[#137333]">
                ${netProfitMxn.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
              </p>
              <span className="text-xs font-semibold text-[#137333]">Margen Operativo: {grossMargin}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
