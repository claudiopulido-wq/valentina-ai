'use client';

import React from 'react';
import { Channel } from '../types/platform';
import { Smartphone, Globe, Shield } from 'lucide-react';

interface Props {
  channels: Channel[];
  tenantName: string;
}

const STATUS_STYLES: Record<Channel['status'], { label: string; className: string; dot: string; pulse: boolean }> = {
  connected: {
    label: 'ONLINE',
    className: 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]',
    dot: 'bg-[#137333]',
    pulse: true,
  },
  degraded: {
    label: 'DEGRADADO',
    className: 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]',
    dot: 'bg-[#b06000]',
    pulse: true,
  },
  disconnected: {
    label: 'DESCONECTADO',
    className: 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]',
    dot: 'bg-[#c5221f]',
    pulse: false,
  },
};

export const ChannelHardwareCard: React.FC<Props> = ({ channels, tenantName }) => {
  return (
    <section className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-[#1f1f1f] tracking-tight">Canales & Hardware Conectados</h3>
          <p className="text-xs text-[#5f6368]">Infraestructura omnicanal dedicada para {tenantName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((ch) => {
          const isWhatsApp = ch.type === 'whatsapp';

          return (
            <div
              key={ch.id}
              className="bg-white border border-[#dadce0] rounded-2xl p-5 relative flex flex-col justify-between space-y-4 shadow-sm hover:shadow transition"
            >
              {/* Top Row: Icon & Status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-xl border ${
                      isWhatsApp
                        ? 'bg-[#e6f4ea] border-[#ceead6] text-[#137333]'
                        : 'bg-[#e8f0fe] border-[#d3e3fd] text-[#0b57d0]'
                    }`}
                  >
                    {isWhatsApp ? <Smartphone className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1f1f1f]">{ch.name}</h4>
                    <p className="text-xs font-mono text-[#5f6368]">{ch.identifier}</p>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_STYLES[ch.status].className}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[ch.status].dot} ${STATUS_STYLES[ch.status].pulse ? 'animate-pulse' : ''}`}
                  ></span>
                  <span>{STATUS_STYLES[ch.status].label}</span>
                </div>
              </div>

              {/* Meta Cloud IDs if configured */}
              {(ch.phoneNumberId || ch.wabaId) && (
                <div className="p-2 rounded-xl bg-[#f8f9fa] border border-[#e0e2ec] text-[11px] font-mono space-y-1">
                  {ch.phoneNumberId && (
                    <div className="flex items-center justify-between text-[#5f6368]">
                      <span>Phone Number ID:</span>
                      <span className="font-semibold text-[#1f1f1f] select-all">{ch.phoneNumberId}</span>
                    </div>
                  )}
                  {ch.wabaId && (
                    <div className="flex items-center justify-between text-[#5f6368]">
                      <span>WABA ID:</span>
                      <span className="font-semibold text-[#1f1f1f] select-all">{ch.wabaId}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Hardware Specs Grid */}
              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-[#f1f3f4] text-xs">
                <div className="p-2.5 rounded-xl bg-[#f8f9fa] border border-[#e0e2ec]">
                  <span className="text-[11px] text-[#5f6368]">Mensajes Hoy</span>
                  <p className="font-mono font-bold text-[#0b57d0] text-sm">{ch.dailyMessagesCount}</p>
                </div>
              </div>

              {/* Security & Health pill */}
              <div className="flex items-center justify-between text-xs text-[#5f6368] pt-2 border-t border-[#f1f3f4]">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#137333]" />
                  <span>Cifrado SHA-256 Meta</span>
                </span>
                <span className="font-mono text-[11px]">{ch.lastPing}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
