'use client';

import React, { useState } from 'react';
import { MOCK_TENANTS, MOCK_CONVERSATIONS, MOCK_TELEMETRY } from '../data/mockData';
import { Tenant } from '../types/platform';
import { AppleFloatingDock } from '../components/AppleFloatingDock';
import { AppleMetricsWidgets } from '../components/AppleMetricsWidgets';
import { LiveOmnichannelInbox } from '../components/LiveOmnichannelInbox';
import { ChannelHardwareCard } from '../components/ChannelHardwareCard';
import { SuperAdminView } from '../components/SuperAdminView';
import {
  MessageSquare,
  BarChart3,
  Cpu,
  BookOpen,
  FileText,
  UploadCloud,
  CheckCircle2,
  Shield,
  Zap,
} from 'lucide-react';

export default function PlatformHome() {
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [currentTenant, setCurrentTenant] = useState<Tenant>(MOCK_TENANTS[0]);
  const [activeView, setActiveView] = useState<'client' | 'admin'>('client');
  const [clientTab, setClientTab] = useState<'inbox' | 'analytics' | 'channels' | 'knowledge'>('inbox');

  const currentConversations = MOCK_CONVERSATIONS[currentTenant.id] || [];

  return (
    <main className="min-h-screen relative flex flex-col items-center pb-24 overflow-hidden selection:bg-violet-500/30">
      {/* Apple Ambient Backlight Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-violet-600/15 via-indigo-500/10 to-transparent blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute top-[300px] left-10 w-[400px] h-[400px] bg-cyan-500/5 blur-[140px] pointer-events-none -z-10"></div>

      {/* Floating Apple Dock */}
      <AppleFloatingDock
        tenants={tenants}
        currentTenant={currentTenant}
        onSelectTenant={setCurrentTenant}
        activeView={activeView}
        onChangeView={setActiveView}
      />

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
        {activeView === 'admin' ? (
          /* ================= SUPERADMIN HQ VIEW ================= */
          <SuperAdminView
            tenants={tenants}
            onSelectTenant={setCurrentTenant}
            onEnterAsClient={(t) => {
              setCurrentTenant(t);
              setActiveView('client');
            }}
          />
        ) : (
          /* ================= CLIENT PORTAL VIEW ================= */
          <div className="space-y-6">
            {/* Apple VisionOS Tab Bar */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-1 bg-black/40 border border-white/[0.08] rounded-xl p-1">
                <button
                  onClick={() => setClientTab('inbox')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    clientTab === 'inbox'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Live Inbox ({currentConversations.length})</span>
                </button>

                <button
                  onClick={() => setClientTab('analytics')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    clientTab === 'analytics'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Telemetría &amp; Costos</span>
                </button>

                <button
                  onClick={() => setClientTab('channels')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    clientTab === 'channels'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Canales Conectados</span>
                </button>

                <button
                  onClick={() => setClientTab('knowledge')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    clientTab === 'knowledge'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Base de Conocimiento</span>
                </button>
              </div>

              {/* Quick Status */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tenant RLS: Aislado</span>
              </div>
            </div>

            {/* TAB CONTENT */}
            {clientTab === 'inbox' && (
              <div className="space-y-6">
                <LiveOmnichannelInbox
                  conversations={currentConversations}
                  tenantName={currentTenant.name}
                />
              </div>
            )}

            {clientTab === 'analytics' && (
              <div className="space-y-6">
                <AppleMetricsWidgets tenant={currentTenant} telemetry={MOCK_TELEMETRY} />
              </div>
            )}

            {clientTab === 'channels' && (
              <div className="space-y-6">
                <ChannelHardwareCard
                  channels={currentTenant.channels}
                  tenantName={currentTenant.name}
                />
              </div>
            )}

            {clientTab === 'knowledge' && (
              <div className="space-y-6">
                <div className="apple-glass-card rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Base de Conocimiento &amp; Guardrails de {currentTenant.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sube manuales, listas de precios y catálogos en PDF para que Valentina responda con RAG sin alucinar.
                    </p>
                  </div>

                  {/* Upload Dropzone */}
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-violet-500/40 transition cursor-pointer bg-white/[0.01]">
                    <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400 mb-3">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Arrastra tus archivos PDF o haz clic para subir</h4>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                      Soporta PDFs de procedimientos clínicos, listas de precios oficiales, planes de estudio o reglamentos internos.
                    </p>
                  </div>

                  {/* Indexed Documents List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                      Documentos Indexados en pgvector
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-violet-400" />
                          <div>
                            <p className="text-xs font-bold text-white">Catalogo-Precios-2025.pdf</p>
                            <p className="text-[10px] text-slate-400">148 fragmentos vectoriales</p>
                          </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-cyan-400" />
                          <div>
                            <p className="text-xs font-bold text-white">Politicas-Citas-Cancelacion.pdf</p>
                            <p className="text-[10px] text-slate-400">62 fragmentos vectoriales</p>
                          </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
