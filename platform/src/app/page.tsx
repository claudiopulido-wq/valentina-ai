'use client';

import React, { useState } from 'react';
import { MOCK_TENANTS, MOCK_CONVERSATIONS, MOCK_TELEMETRY, MOCK_USERS } from '../data/mockData';
import { Tenant, AuthUser } from '../types/platform';
import { AppleFloatingDock } from '../components/AppleFloatingDock';
import { AppleMetricsWidgets } from '../components/AppleMetricsWidgets';
import { LiveOmnichannelInbox } from '../components/LiveOmnichannelInbox';
import { ChannelHardwareCard } from '../components/ChannelHardwareCard';
import { SuperAdminView } from '../components/SuperAdminView';
import { AuthModal } from '../components/AuthModal';
import {
  MessageSquare,
  BarChart3,
  Cpu,
  BookOpen,
  FileText,
  UploadCloud,
  CheckCircle2,
  Shield,
  LogOut,
  User,
  Key,
  Building2,
  ExternalLink,
} from 'lucide-react';

export default function PlatformHome() {
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [users, setUsers] = useState<AuthUser[]>(MOCK_USERS);
  
  // Estado de Autenticación
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(MOCK_USERS[0]); // Inicia con SuperAdmin para desarrollo
  const [currentTenant, setCurrentTenant] = useState<Tenant>(MOCK_TENANTS[0]); // UGES
  const [activeView, setActiveView] = useState<'client' | 'admin'>('admin');
  const [clientTab, setClientTab] = useState<'inbox' | 'analytics' | 'channels' | 'knowledge'>('inbox');

  const handleLoginSuccess = (user: AuthUser, tenant: Tenant | null) => {
    setCurrentUser(user);
    if (user.role === 'superadmin') {
      setActiveView('admin');
      if (tenants.length > 0) {
        setCurrentTenant(tenants[0]);
      }
    } else if (tenant) {
      setCurrentTenant(tenant);
      setActiveView('client');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleCreateTenantAndUser = (newTenant: Tenant, newUser: AuthUser) => {
    setTenants((prev) => [newTenant, ...prev]);
    setUsers((prev) => [newUser, ...prev]);
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            status: u.status === 'active' ? 'suspended' : 'active',
          };
        }
        return u;
      })
    );
  };

  // Si no hay sesión iniciada, mostrar el portal de autenticación estricto
  if (!currentUser) {
    return (
      <main className="min-h-screen relative flex items-center justify-center bg-[#07090e] p-4">
        <AuthModal
          users={users}
          tenants={tenants}
          onLoginSuccess={handleLoginSuccess}
        />
      </main>
    );
  }

  // Filtrar tenants disponibles según rol (Aislamiento Multi-Tenant)
  const isSuperAdmin = currentUser.role === 'superadmin';
  const visibleTenants = isSuperAdmin
    ? tenants
    : tenants.filter((t) => t.id === currentUser.tenantId);

  const currentConversations = MOCK_CONVERSATIONS[currentTenant.id] || [];

  return (
    <main className="min-h-screen relative flex flex-col items-center pb-24 overflow-hidden selection:bg-violet-500/30">
      {/* Apple Ambient Backlight Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-violet-600/15 via-indigo-500/10 to-transparent blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute top-[300px] left-10 w-[400px] h-[400px] bg-cyan-500/5 blur-[140px] pointer-events-none -z-10"></div>

      {/* Top Enterprise Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 pt-5 pb-3 flex items-center justify-between border-b border-white/[0.08] relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 p-0.5 shadow-lg shadow-violet-600/20">
            <div className="w-full h-full bg-[#080a10] rounded-[10px] flex items-center justify-center text-white font-bold text-xs">
              V
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-tight">VALENTINA AI</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                {isSuperAdmin ? 'SUPERADMIN HQ' : currentTenant.name.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {isSuperAdmin ? 'Control Maestro Global' : `Portal Autorizado • ${currentTenant.industry}`}
            </p>
          </div>
        </div>

        {/* User Session Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <div className="w-6 h-6 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-xs">
              {isSuperAdmin ? '👑' : currentTenant.logo}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{currentUser.fullName}</span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                  {currentUser.role}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">{currentUser.email}</div>
            </div>
          </div>

          {/* Botón Volver a Landing */}
          <a
            href="https://valentina-ai.mx"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-300 transition"
          >
            <span>Landing Page</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Botón Logout */}
          <button
            onClick={handleLogout}
            title="Cerrar Sesión Segura"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-medium text-rose-300 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Floating Apple Dock (Solo SuperAdmin ve todas las empresas; clientes solo ven la suya) */}
      <AppleFloatingDock
        tenants={visibleTenants}
        currentTenant={currentTenant}
        onSelectTenant={setCurrentTenant}
        activeView={activeView}
        onChangeView={setActiveView}
      />

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
        {activeView === 'admin' && isSuperAdmin ? (
          /* ================= SUPERADMIN HQ VIEW ================= */
          <SuperAdminView
            tenants={tenants}
            users={users}
            onSelectTenant={setCurrentTenant}
            onEnterAsClient={(t) => {
              setCurrentTenant(t);
              setActiveView('client');
            }}
            onCreateTenantAndUser={handleCreateTenantAndUser}
            onToggleUserStatus={handleToggleUserStatus}
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
                  <span>Telemetría &amp; Métricas</span>
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
                  <span>Canales Conectados ({currentTenant.channels.length})</span>
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
                <span>Empresa: {currentTenant.name}</span>
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
                      Manuales, listas de precios, folletos y catálogos en PDF para que Valentina responda con RAG sin alucinar.
                    </p>
                  </div>

                  {/* Upload Dropzone */}
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-violet-500/40 transition cursor-pointer bg-white/[0.01]">
                    <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400 mb-3">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Arrastra tus archivos PDF o haz clic para subir</h4>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                      Soporta planes de estudio, manuales operativos, precios o fichas de inscripción.
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
                            <p className="text-xs font-bold text-white">Catalogo-Precios-2026.pdf</p>
                            <p className="text-[10px] text-slate-400">148 fragmentos vectoriales</p>
                          </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-cyan-400" />
                          <div>
                            <p className="text-xs font-bold text-white">Politicas-Admision-Citas.pdf</p>
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
