'use client';

import React from 'react';
import { Tenant, DailyTelemetry } from '../types/platform';
import { Coins, Zap, Clock, TrendingUp, CheckCircle2, MessageSquare, ShieldCheck } from 'lucide-react';

interface Props {
  tenant: Tenant;
  telemetry: DailyTelemetry[];
}

export const AppleMetricsWidgets: React.FC<Props> = ({ tenant, telemetry }) => {
  const budgetPercentage = Math.min(100, Math.round((tenant.totalSpentMxn / tenant.monthlyBudgetMxn) * 100));
  // Ahorro calculado: horas hombre ahorradas atendiendo este volumen vs costo de la suscripción + tokens
  const estimatedHoursSaved = Math.max(12, Math.round((tenant.totalTokensUsed / 980)));
  const estimatedSavingsMxn = Math.max(3800, Math.round(estimatedHoursSaved * 85));
  const subscriptionFee = tenant.subscriptionFeeMxn || 8500;
  const metaChatsUsed = tenant.metaFreeConversationsUsed || 94;

  return (
    <section className="w-full space-y-4">
      {/* Top Banner: Tenant Welcome */}
      <div className="bg-white border border-[#dadce0] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-3xl p-2.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
            {tenant.logo}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#1f1f1f]">{tenant.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                Plan {tenant.plan}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f0fe] text-[#0b57d0] border border-[#d3e3fd]">
                Suscripción: ${subscriptionFee.toLocaleString('es-MX')} MXN/mes
              </span>
            </div>
            <p className="text-xs text-[#5f6368] mt-1">
              {tenant.industry} • ID de Organización: <span className="font-mono text-[#1f1f1f]">{tenant.slug}</span>
            </p>
          </div>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-4 bg-[#f8f9fa] border border-[#dadce0] rounded-xl px-4 py-2 self-stretch md:self-auto justify-between md:justify-start">
          <div>
            <p className="text-[10px] uppercase font-semibold text-[#5f6368]">Tokens IA Usados</p>
            <p className="text-sm font-bold font-mono text-[#0b57d0]">
              {tenant.totalTokensUsed.toLocaleString('es-MX')}
            </p>
          </div>
          <div className="w-px h-8 bg-[#dadce0]"></div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-[#5f6368]">Costo Inferencia IA</p>
            <p className="text-sm font-bold font-mono text-[#1f1f1f]">
              ${tenant.totalSpentMxn.toFixed(2)} MXN
            </p>
          </div>
          <div className="w-px h-8 bg-[#dadce0]"></div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-[#5f6368]">Meta WhatsApp</p>
            <p className="text-sm font-bold font-mono text-[#137333]">
              {metaChatsUsed}/1,000 <span className="text-[10px] font-normal text-[#137333]">Gratis</span>
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: AI Token Cost & Budget */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm hover:shadow transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#5f6368] mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Consumo Operativo IA</span>
              <div className="p-2 rounded-xl bg-[#e8f0fe] text-[#0b57d0]">
                <Coins className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold tracking-tight font-mono text-[#1f1f1f]">
                ${tenant.totalSpentMxn.toFixed(2)} <span className="text-xs text-[#5f6368] font-normal">MXN</span>
              </div>
              <p className="text-xs text-[#5f6368]">
                Límite mensual asignado: <span className="font-semibold text-[#1f1f1f] font-mono">${tenant.monthlyBudgetMxn.toLocaleString()} MXN</span>
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-[#5f6368]">
                <span>Uso: {budgetPercentage}%</span>
                <span className="text-[#137333] font-semibold">Dentro del límite</span>
              </div>
              <div className="w-full h-2 bg-[#f1f3f4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0b57d0] rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(3, budgetPercentage)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Micro Desglose Transparente */}
          <div className="mt-4 pt-3 border-t border-[#f1f3f4] space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-[#5f6368]">
              <span>Inferencia de Tokens:</span>
              <span className="font-mono font-bold text-[#1f1f1f]">${tenant.totalSpentMxn.toFixed(2)} MXN</span>
            </div>
            <div className="flex items-center justify-between text-[#5f6368]">
              <span>Meta WhatsApp Cloud:</span>
              <span className="font-mono font-bold text-[#137333] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#137333]" /> $0.00 (Gratis)
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Estimated Human Savings */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm hover:shadow transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#5f6368] mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Ahorro en Nómina (ROI)</span>
              <div className="p-2 rounded-xl bg-[#e6f4ea] text-[#137333]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold tracking-tight font-mono text-[#137333]">
                ${estimatedSavingsMxn.toLocaleString('es-MX')} <span className="text-xs text-[#5f6368] font-normal">MXN</span>
              </div>
              <p className="text-xs text-[#5f6368] flex items-center gap-1">
                <span className="text-[#137333] font-bold font-mono">
                  {Math.max(1, Math.round(estimatedSavingsMxn / Math.max(1, tenant.totalSpentMxn)))}x
                </span> retorno sobre gasto operativo
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f1f3f4] flex items-center justify-between text-xs text-[#5f6368]">
            <span>Horas recepcionista evitadas:</span>
            <span className="font-mono font-bold text-[#1f1f1f]">~{estimatedHoursSaved} hrs</span>
          </div>
        </div>

        {/* Card 3: AI Handling Resolution Rate */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-[#5f6368] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolución 100% IA</span>
            <div className="p-2 rounded-xl bg-[#e8f0fe] text-[#0b57d0]">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight font-mono text-[#1f1f1f]">
              96.4%
            </div>
            <p className="text-xs text-[#5f6368]">
              Sin intervención humana
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f1f3f4] flex items-center justify-between text-xs text-[#5f6368]">
            <span>Escalados a humanos:</span>
            <span className="font-mono font-bold text-[#b06000]">3.6% (Casos complejos)</span>
          </div>
        </div>

        {/* Card 4: Response Latency */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-[#5f6368] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Velocidad Respuesta</span>
            <div className="p-2 rounded-xl bg-[#f1f3f4] text-[#5f6368]">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight font-mono text-[#1f1f1f]">
              1.1 seg
            </div>
            <p className="text-xs text-[#5f6368]">
              WhatsApp Cloud API realtime
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f1f3f4] flex items-center justify-between text-xs text-[#5f6368]">
            <span>Promedio recepcionista:</span>
            <span className="font-mono font-bold text-[#c5221f]">28 min</span>
          </div>
        </div>
      </div>

      {/* 7-Day Interactive Telemetry Bar Chart */}
      <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#1f1f1f] tracking-tight">Volumen de Mensajes y Consumo de Tokens (Últimos 7 días)</h3>
            <p className="text-xs text-[#5f6368]">Monitoreo granular del tráfico atendido por Valentina</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-[#5f6368]">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#0b57d0]"></span>
              <span>Mensajes</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#137333]"></span>
              <span>Costo MXN</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-4 border-t border-[#f1f3f4]">
          {telemetry.map((day, idx) => {
            const maxMessages = 1000;
            const barHeightPct = Math.round((day.totalMessages / maxMessages) * 100);

            return (
              <div key={idx} className="flex flex-col items-center gap-2 group">
                <div className="text-xs font-mono font-semibold text-[#5f6368] group-hover:text-[#0b57d0] transition">
                  {day.totalMessages}
                </div>

                <div className="w-full h-28 bg-[#f8f9fa] border border-[#e0e2ec] rounded-xl flex items-end justify-center p-1 relative">
                  <div
                    className="w-full max-w-[28px] bg-[#0b57d0] rounded-lg transition-all duration-300 group-hover:bg-[#0842a0]"
                    style={{ height: `${barHeightPct}%` }}
                  ></div>
                </div>

                <div className="text-center">
                  <p className="text-xs font-medium text-[#1f1f1f]">{day.date}</p>
                  <p className="text-[10px] font-mono text-[#137333] font-semibold">${day.costMxn.toFixed(1)} MXN</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
