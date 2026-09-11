import React from 'react';
import { DollarSign, Zap, TrendingUp } from 'lucide-react';

interface Props {
  selectedPlan: 'Growth' | 'Scale' | 'Enterprise';
  setSelectedPlan: (plan: 'Growth' | 'Scale' | 'Enterprise') => void;
  billingPeriod: 'monthly' | 'annual';
  setBillingPeriod: (period: 'monthly' | 'annual') => void;
  metaExpectedVolume: number;
  setMetaExpectedVolume: (v: number) => void;
  estimatedMetaCostMxn: number;
  projectedSavingsMonthly: number;
  daysToRoi: number;
}

export const Step3PricingMeta: React.FC<Props> = ({
  selectedPlan,
  setSelectedPlan,
  billingPeriod,
  setBillingPeriod,
  metaExpectedVolume,
  setMetaExpectedVolume,
  estimatedMetaCostMxn,
  projectedSavingsMonthly,
  daysToRoi,
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="p-3.5 rounded-xl bg-[#e8f0fe] border border-[#d3e3fd] text-[#041e49] flex items-center justify-between">
        <div>
          <strong className="block text-xs font-semibold">Paso 3: Plan, Precios &amp; Proyección de ROI</strong>
          <span className="text-[11px] text-[#3c4043]">
            Defina el plan, la modalidad de facturación y proyecte el consumo transparente de Meta.
          </span>
        </div>
        <div className="flex bg-white rounded-lg p-0.5 border border-[#dadce0] text-[11px]">
          <button
            type="button"
            onClick={() => setBillingPeriod('monthly')}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              billingPeriod === 'monthly' ? 'bg-[#0b57d0] text-white' : 'text-[#5f6368]'
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod('annual')}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              billingPeriod === 'annual' ? 'bg-[#137333] text-white' : 'text-[#5f6368]'
            }`}
          >
            Anual (-2 Meses)
          </button>
        </div>
      </div>

      {/* Selector de Planes en Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            key: 'Growth',
            title: 'Plan Growth',
            sub: 'FAQ & Calificación',
            setup: billingPeriod === 'annual' ? '$4,250' : '$8,500',
            mrr: billingPeriod === 'annual' ? '$2,333' : '$2,800',
          },
          {
            key: 'Scale',
            title: 'Plan Scale',
            sub: 'Cotizador & Citas',
            badge: 'RECOMENDADO',
            setup: billingPeriod === 'annual' ? '$8,250' : '$16,500',
            mrr: billingPeriod === 'annual' ? '$4,666' : '$5,600',
          },
          {
            key: 'Enterprise',
            title: 'Plan Enterprise',
            sub: 'ERP & OCR Forense',
            setup: billingPeriod === 'annual' ? '$15,000' : '$25,000',
            mrr: billingPeriod === 'annual' ? '$7,900' : '$9,500',
          },
        ].map((p) => {
          const isSelected = selectedPlan === p.key;
          return (
            <div
              key={p.key}
              onClick={() => setSelectedPlan(p.key as any)}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                isSelected
                  ? 'border-[#6D28D9] bg-[#f8f5ff] shadow-sm'
                  : 'border-[#dadce0] bg-white hover:border-[#bdc1c6]'
              }`}
            >
              <div>
                {p.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#EDE9FE] text-[#6D28D9] mb-1 inline-block uppercase">
                    {p.badge}
                  </span>
                )}
                <h4 className="font-bold text-[#1f1f1f] text-sm">{p.title}</h4>
                <span className="text-[10px] text-[#5f6368] block">{p.sub}</span>
              </div>

              <div className="pt-3 border-t border-[#dadce0]/60 mt-3">
                <div className="font-mono text-xs">
                  <span className="text-[10px] text-[#5f6368] block">Setup Único:</span>
                  <strong className="text-[#1f1f1f]">{p.setup} MXN</strong>
                </div>
                <div className="font-mono text-xs mt-1">
                  <span className="text-[10px] text-[#5f6368] block">Mensualidad:</span>
                  <strong className="text-[#0b57d0]">{p.mrr} MXN/mes</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slider de Estimación de Meta */}
      <div className="p-4 rounded-xl bg-[#fef7e0] border border-[#feefc3] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-[#843800] uppercase tracking-wide flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#e37400]" /> Estimador Transparente de Meta (WhatsApp API)
          </span>
          <span className="text-xs font-mono font-bold text-[#b06000]">
            {metaExpectedVolume.toLocaleString()} mensajes / mes
          </span>
        </div>

        <input
          type="range"
          min="500"
          max="10000"
          step="250"
          value={metaExpectedVolume}
          onChange={(e) => setMetaExpectedVolume(Number(e.target.value))}
          className="w-full accent-[#e37400] cursor-pointer"
        />

        <div className="flex items-center justify-between text-[11px] text-[#5f6368]">
          <span>
            Primeros 1,000 mensuales: <strong>$0 MXN (100% Gratis por Meta)</strong>
          </span>
          <span className="font-mono font-semibold text-[#843800]">
            Consumo Meta proyectado: ~${estimatedMetaCostMxn} MXN / mes
          </span>
        </div>
      </div>

      {/* Resumen de ROI Proyectado */}
      <div className="p-3.5 rounded-xl bg-[#e6f4ea] border border-[#ceead6] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#137333]" />
          <div>
            <span className="text-xs font-bold text-[#137333] block">
              Retorno de Inversión Proyectado: Ahorro de +${projectedSavingsMonthly.toLocaleString()} MXN/mes
            </span>
            <span className="text-[11px] text-[#1e8e3e]">
              Setup amortizado en aproximadamente <strong>{daysToRoi} días hábiles</strong>.
            </span>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-white text-[#137333] font-mono font-bold text-xs border border-[#ceead6]">
          ROI Inmediato
        </div>
      </div>
    </div>
  );
};
