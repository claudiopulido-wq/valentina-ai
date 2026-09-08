'use client';

import React from 'react';
import { Channel } from '../types/platform';
import { Smartphone, Globe, Shield, RefreshCw, CheckCircle2, Wifi, Key } from 'lucide-react';

interface Props {
  channels: Channel[];
  tenantName: string;
}

export const ChannelHardwareCard: React.FC<Props> = ({ channels, tenantName }) => {
  return (
    <section className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Puertos y Canales Conectados (Hardware Style)</h3>
          <p className="text-xs text-slate-400">Infraestructura omnicanal dedicada para {tenantName}</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 transition">
          <RefreshCw className="w-3 h-3 text-cyan-400" />
          <span>Sincronizar Meta APIs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((ch) => {
          const isWhatsApp = ch.type === 'whatsapp';

          return (
            <div
              key={ch.id}
              className="apple-glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between space-y-4"
            >
              {/* Top Row: Icon & Status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-2xl border ${
                      isWhatsApp
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                    }`}
                  >
                    {isWhatsApp ? <Smartphone className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{ch.name}</h4>
                    <p className="text-[11px] font-mono text-slate-400">{ch.identifier}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>ONLINE</span>
                </div>
              </div>

              {/* Hardware Specs Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] text-[11px]">
                <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04]">
                  <span className="text-[10px] text-slate-400">Latencia Webhook</span>
                  <p className="font-mono font-bold text-white">118 ms</p>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04]">
                  <span className="text-[10px] text-slate-400">Mensajes Hoy</span>
                  <p className="font-mono font-bold text-violet-300">{ch.dailyMessagesCount}</p>
                </div>
              </div>

              {/* Security & Health pill */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/[0.04]">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>Cifrado SHA-256 Meta</span>
                </span>
                <span className="font-mono">{ch.lastPing}</span>
              </div>
            </div>
          );
        })}

        {/* Google Workspace & Storage Connector */}
        <div className="apple-glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Google Workspace Vault</h4>
                <p className="text-[11px] text-slate-400 font-mono">service-account@valentina</p>
              </div>
            </div>

            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
              <CheckCircle2 className="w-3 h-3" />
              <span>LINKED</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] text-[11px]">
            <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04]">
              <span className="text-[10px] text-slate-400">Expedientes Drive</span>
              <p className="font-mono font-bold text-white">1,522 PDFs</p>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04]">
              <span className="text-[10px] text-slate-400">Sync Google Sheets</span>
              <p className="font-mono font-bold text-emerald-400">Automático</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/[0.04]">
            <span>Costo de integración:</span>
            <span className="font-mono font-bold text-emerald-400">$0.00 / mes</span>
          </div>
        </div>
      </div>
    </section>
  );
};
