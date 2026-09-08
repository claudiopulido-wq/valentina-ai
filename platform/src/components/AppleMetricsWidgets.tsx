'use client';

import React from 'react';
import { Tenant, DailyTelemetry } from '../types/platform';
import { Coins, Zap, Clock, TrendingUp, MessageSquare, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface Props {
  tenant: Tenant;
  telemetry: DailyTelemetry[];
}

export const AppleMetricsWidgets: React.FC<Props> = ({ tenant, telemetry }) => {
  const budgetPercentage = Math.min(100, Math.round((tenant.totalSpentMxn / tenant.monthlyBudgetMxn) * 100));
  const estimatedSavingsMxn = Math.round(tenant.totalSpentMxn * 71.5);

  return (
    <section className="w-full space-y-4">
      {/* Top Banner: Tenant Welcome & VisionOS Glass Bar */}
      <div className="apple-glass-card rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-3xl p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] shadow-inner">
            {tenant.logo}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">{tenant.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {tenant.plan} Plan
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{tenant.industry} • Multi-Tenant ID: <span className="font-mono text-slate-300">{tenant.slug}</span></p>
          </div>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-3 bg-black/40 border border-white/[0.08] rounded-xl px-4 py-2">
          <div>
            <p className="text-[10px] uppercase font-mono text-slate-400">Tokens Totales</p>
            <p className="text-sm font-extrabold font-mono text-violet-300">
              {tenant.totalTokensUsed.toLocaleString('es-MX')}
            </p>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div>
            <p className="text-[10px] uppercase font-mono text-slate-400">Inversión IA</p>
            <p className="text-sm font-extrabold font-mono text-white">
              ${tenant.totalSpentMxn.toFixed(2)} MXN
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Apple-style Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Token Cost & Budget */}
        <div className="apple-glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Inversión en Tokens</span>
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-extrabold tracking-tight font-mono text-white">
              ${tenant.totalSpentMxn.toFixed(2)} <span className="text-xs text-slate-400 font-normal">MXN</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Presupuesto mensual: <span className="text-slate-200 font-mono">${tenant.monthlyBudgetMxn.toLocaleString()} MXN</span>
            </p>
          </div>

          {/* Apple Progress Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Uso: {budgetPercentage}%</span>
              <span>Límite seguro</span>
            </div>
            <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-1000"
                style={{ width: `${budgetPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 2: Estimated Human Savings */}
        <div className="apple-glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Ahorro en Nómina</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-extrabold tracking-tight font-mono text-emerald-400">
              ${estimatedSavingsMxn.toLocaleString('es-MX')} <span className="text-xs text-slate-400 font-normal">MXN</span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="text-emerald-400 font-bold font-mono">71.5x</span> multiplicador de eficiencia ROI
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-300">
            <span>Horas hombre ahorradas:</span>
            <span className="font-mono font-bold text-white">~148 hrs</span>
          </div>
        </div>

        {/* Card 3: AI Handling Resolution Rate */}
        <div className="apple-glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolución 100% IA</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-extrabold tracking-tight font-mono text-white">
              96.4%
            </div>
            <p className="text-[11px] text-slate-400">
              Sin intervención de recepcionistas
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-300">
            <span>Escalados a humano:</span>
            <span className="font-mono font-bold text-amber-400">3.6% (Casos críticos)</span>
          </div>
        </div>

        {/* Card 4: Response Latency */}
        <div className="apple-glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Velocidad Respuesta</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-extrabold tracking-tight font-mono text-white">
              1.1 seg
            </div>
            <p className="text-[11px] text-slate-400">
              WhatsApp &amp; Webhook realtime
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-300">
            <span>Promedio humano anterior:</span>
            <span className="font-mono font-bold text-red-400">28 min</span>
          </div>
        </div>
      </div>

      {/* 7-Day Interactive Telemetry Bar Chart */}
      <div className="apple-glass-card rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Volumen de Mensajes y Consumo de Tokens (Últimos 7 días)</h3>
            <p className="text-xs text-slate-400">Monitoreo granular del tráfico atendido por Valentina</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-500"></span>
            <span>Mensajes Atendidos</span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 ml-2"></span>
            <span>Costo MXN</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-4 border-t border-white/[0.06]">
          {telemetry.map((day, idx) => {
            const maxMessages = 1000;
            const barHeightPct = Math.round((day.totalMessages / maxMessages) * 100);

            return (
              <div key={idx} className="flex flex-col items-center gap-2 group">
                <div className="text-[10px] font-mono text-slate-400 group-hover:text-white transition">
                  {day.totalMessages}
                </div>

                <div className="w-full h-28 bg-white/[0.02] rounded-xl flex items-end justify-center p-1 relative">
                  <div
                    className="w-full max-w-[28px] bg-gradient-to-t from-violet-600/60 to-cyan-400/80 rounded-lg transition-all duration-500 group-hover:from-violet-500 group-hover:to-cyan-300 group-hover:scale-105"
                    style={{ height: `${barHeightPct}%` }}
                  ></div>
                </div>

                <div className="text-center">
                  <p className="text-[11px] font-medium text-slate-300">{day.date}</p>
                  <p className="text-[9px] font-mono text-cyan-400">${day.costMxn.toFixed(1)} MXN</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
