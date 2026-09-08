'use client';

import React from 'react';
import { Tenant } from '../types/platform';
import { ShieldCheck, Sparkles, Building2, UserCheck, Activity, Cpu } from 'lucide-react';

interface Props {
  tenants: Tenant[];
  currentTenant: Tenant;
  onSelectTenant: (tenant: Tenant) => void;
  activeView: 'client' | 'admin';
  onChangeView: (view: 'client' | 'admin') => void;
}

export const AppleFloatingDock: React.FC<Props> = ({
  tenants,
  currentTenant,
  onSelectTenant,
  activeView,
  onChangeView,
}) => {
  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="apple-glass-dock rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Valentina Brand & Dynamic Island Badge */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white font-bold shadow-lg shadow-violet-500/25">
            <Sparkles className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#07080c] rounded-full animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-white">VALENTINA</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                OS 2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Omnichannel Intelligence</p>
          </div>
        </div>

        {/* Center: Tenant Switcher (Apple Pill Style) */}
        <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 gap-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 font-medium">
            <Building2 className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline text-slate-400">Cliente:</span>
          </div>

          <select
            value={currentTenant.id}
            onChange={(e) => {
              const selected = tenants.find((t) => t.id === e.target.value);
              if (selected) onSelectTenant(selected);
            }}
            className="bg-transparent text-white text-xs font-semibold py-1 px-2 focus:outline-none cursor-pointer rounded-lg hover:bg-white/[0.06] transition"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#0f121d] text-white">
                {t.logo} {t.name} ({t.plan})
              </option>
            ))}
          </select>
        </div>

        {/* Right: View Switcher (Client Portal vs SuperAdmin HQ) & Status */}
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Webhook: 118ms</span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-black/40 border border-white/[0.08] rounded-xl p-0.5">
            <button
              onClick={() => onChangeView('client')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'client'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Portal Cliente</span>
            </button>

            <button
              onClick={() => onChangeView('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'admin'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SuperAdmin HQ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
