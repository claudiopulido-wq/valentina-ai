import React from 'react';
import { DollarSign, TrendingUp, CheckCircle, Users, Calculator, Zap } from 'lucide-react';
import { CommercialQuote } from '../../types/platform';

interface Props {
  quotes: CommercialQuote[];
  quoteStatusFilter: 'all' | 'draft' | 'sent' | 'negotiating' | 'accepted';
  setQuoteStatusFilter: (status: 'all' | 'draft' | 'sent' | 'negotiating' | 'accepted') => void;
  searchQuery: string;
  onNewQuote: () => void;
  onViewQuote: (quote: CommercialQuote) => void;
  onConvertQuote: (quote: CommercialQuote) => void;
}

export const SalesPipelineTab: React.FC<Props> = ({
  quotes,
  quoteStatusFilter,
  setQuoteStatusFilter,
  searchQuery,
  onNewQuote,
  onViewQuote,
  onConvertQuote,
}) => {
  return (
    <div className="space-y-6">
      {/* Métricas del Pipeline Comercial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#dadce0] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#5f6368] mb-1">
            <span className="text-xs font-medium">Total Cotizado</span>
            <DollarSign className="w-4 h-4 text-[#0b57d0]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#1f1f1f]">
            ${quotes.reduce((acc, q) => acc + q.setupFeeMxn, 0).toLocaleString('es-MX')}{' '}
            <span className="text-xs font-normal text-[#5f6368]">MXN</span>
          </p>
          <p className="text-[11px] text-[#5f6368] mt-1">{quotes.length} propuestas registradas</p>
        </div>

        <div className="bg-white border border-[#dadce0] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#5f6368] mb-1">
            <span className="text-xs font-medium">MRR Proyectado en Pipeline</span>
            <TrendingUp className="w-4 h-4 text-[#6D28D9]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#6D28D9]">
            ${quotes.reduce((acc, q) => acc + q.monthlyFeeMxn, 0).toLocaleString('es-MX')}{' '}
            <span className="text-xs font-normal text-[#5f6368]">MXN/mes</span>
          </p>
          <p className="text-[11px] text-[#6D28D9] font-medium mt-1">Suscripciones recurrentes</p>
        </div>

        <div className="bg-white border border-[#dadce0] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#5f6368] mb-1">
            <span className="text-xs font-medium">Ahorro Promedio a Clientes</span>
            <CheckCircle className="w-4 h-4 text-[#137333]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#137333]">
            +$
            {Math.round(
              quotes.reduce((acc, q) => acc + q.monthlySavingsMxn, 0) / (quotes.length || 1)
            ).toLocaleString('es-MX')}{' '}
            <span className="text-xs font-normal text-[#5f6368]">MXN/mes</span>
          </p>
          <p className="text-[11px] text-[#1e8e3e] font-medium mt-1">Amortización media: ~13 días</p>
        </div>

        <div className="bg-white border border-[#dadce0] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#5f6368] mb-1">
            <span className="text-xs font-medium">Estatus de Propuestas</span>
            <Users className="w-4 h-4 text-[#e37400]" />
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e8f0fe] text-[#0b57d0]">
              {quotes.filter((q) => q.status === 'sent').length} Enviadas
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fef7e0] text-[#b06000]">
              {quotes.filter((q) => q.status === 'negotiating').length} Negoc.
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e6f4ea] text-[#137333]">
              {quotes.filter((q) => q.status === 'accepted').length} Ganadas
            </span>
          </div>
        </div>
      </div>

      {/* Tabla de Pipeline de Cotizaciones */}
      <div className="bg-white border border-[#dadce0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#dadce0] flex flex-col sm:row items-start sm:items-center justify-between gap-3 bg-[#f8f9fa]">
          <div>
            <h3 className="text-sm font-semibold text-[#1f1f1f]">Pipeline Comercial B2B (Propuestas Emitidas)</h3>
            <p className="text-xs text-[#5f6368]">
              Genera y envía propuestas ejecutivas formales conectadas con la política POL-COM-VAL-2026-B
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white rounded-lg p-0.5 border border-[#dadce0] text-xs">
              {(['all', 'draft', 'sent', 'negotiating', 'accepted'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setQuoteStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    quoteStatusFilter === st
                      ? 'bg-[#0b57d0] text-white font-bold'
                      : 'text-[#5f6368] hover:text-[#1f1f1f]'
                  }`}
                >
                  {st === 'all'
                    ? 'Todas'
                    : st === 'draft'
                    ? 'Borradores'
                    : st === 'sent'
                    ? 'Enviadas'
                    : st === 'negotiating'
                    ? 'Negociación'
                    : 'Ganadas'}
                </button>
              ))}
            </div>

            <button
              onClick={onNewQuote}
              className="px-3.5 py-1.5 rounded-full bg-[#6D28D9] hover:bg-[#5b21b6] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>+ Nueva Cotización</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8f9fa] border-b border-[#dadce0] text-[#5f6368] font-semibold text-[11px]">
              <tr>
                <th className="p-4">Folio &amp; Fecha</th>
                <th className="p-4">Empresa / Prospecto</th>
                <th className="p-4">Tomador de Decisión</th>
                <th className="p-4">Plan &amp; Precios</th>
                <th className="p-4">Ahorro Mensual (ROI)</th>
                <th className="p-4">Estatus</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f4]">
              {quotes
                .filter((q) => {
                  if (quoteStatusFilter !== 'all' && q.status !== quoteStatusFilter) return false;
                  if (searchQuery) {
                    const term = searchQuery.toLowerCase();
                    return (
                      q.companyName.toLowerCase().includes(term) ||
                      q.contactName.toLowerCase().includes(term) ||
                      q.folio.toLowerCase().includes(term) ||
                      q.industry.toLowerCase().includes(term)
                    );
                  }
                  return true;
                })
                .map((q) => (
                  <tr key={q.id} className="hover:bg-[#f8f9fa] transition">
                    <td className="p-4 font-mono">
                      <span className="font-bold text-[#1f1f1f]">{q.folio}</span>
                      <p className="text-[10px] text-[#5f6368]">{q.createdAt}</p>
                    </td>

                    <td className="p-4">
                      <strong className="text-[#1f1f1f] text-xs block">{q.companyName}</strong>
                      <span className="text-[10px] text-[#5f6368]">{q.industry}</span>
                    </td>

                    <td className="p-4">
                      <span className="text-[#1f1f1f] font-medium block">{q.contactName}</span>
                      <span className="text-[10px] text-[#5f6368] font-mono">{q.contactEmail}</span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.plan === 'Scale'
                            ? 'bg-[#EDE9FE] text-[#6D28D9]'
                            : q.plan === 'Enterprise'
                            ? 'bg-[#fef7e0] text-[#b06000]'
                            : 'bg-[#e8f0fe] text-[#0b57d0]'
                        }`}
                      >
                        Plan {q.plan} ({q.billingPeriod === 'annual' ? 'Anual' : 'Mensual'})
                      </span>
                      <div className="font-mono text-[11px] mt-0.5">
                        <span className="text-[#1f1f1f]">Setup: ${q.setupFeeMxn.toLocaleString('es-MX')}</span>
                        <span className="text-[#5f6368]"> &bull; ${q.monthlyFeeMxn.toLocaleString('es-MX')}/m</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <strong className="text-[#137333] font-mono text-xs block">
                        +${q.monthlySavingsMxn.toLocaleString('es-MX')} MXN/m
                      </strong>
                      <span className="text-[10px] text-[#5f6368]">
                        Amortizado en ~{q.amortizationDays} días
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          q.status === 'accepted'
                            ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
                            : q.status === 'negotiating'
                            ? 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]'
                            : q.status === 'sent'
                            ? 'bg-[#e8f0fe] text-[#0b57d0] border-[#d3e3fd]'
                            : 'bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]'
                        }`}
                      >
                        {q.status === 'accepted'
                          ? '✓ ACEPTADA'
                          : q.status === 'negotiating'
                          ? '💬 EN NEGOCIACIÓN'
                          : q.status === 'sent'
                          ? '✉️ ENVIADA'
                          : '📝 BORRADOR'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewQuote(q)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-[#f1f3f4] text-[#0b57d0] border border-[#dadce0] transition cursor-pointer shadow-xs"
                          title="Ver o editar propuesta oficial membretada"
                        >
                          <span>Ver PDF</span>
                        </button>

                        <button
                          onClick={() => onConvertQuote(q)}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-[#6D28D9] hover:bg-[#5b21b6] text-white transition cursor-pointer shadow-xs flex items-center gap-1"
                          title="Aprobar y transferir al Wizard de Onboarding"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Convertir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
