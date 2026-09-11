'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MOCK_TENANTS, MOCK_CONVERSATIONS, MOCK_TELEMETRY, MOCK_USERS } from '../data/mockData';
import { Tenant, AuthUser, Conversation, DailyTelemetry } from '../types/platform';
import {
  fetchUgesLiveConversations,
  fetchUgesLiveKnowledgeBase,
  fetchUgesLiveTelemetry,
  fetchUgesStatsSummary,
  UgesKnowledgeDoc,
} from '../lib/ugesDataService';
import {
  ClientTab,
  getAllowedTabsForUser,
  getDefaultTabForUser,
  getUserLevelConfig,
} from '../lib/permissions';
import { GoogleSidebar } from '../components/GoogleSidebar';
import { AppleMetricsWidgets } from '../components/AppleMetricsWidgets';
import { LiveOmnichannelInbox } from '../components/LiveOmnichannelInbox';
import { ChannelHardwareCard } from '../components/ChannelHardwareCard';
import { SuperAdminView } from '../components/SuperAdminView';
import { AuthModal } from '../components/AuthModal';
import { KnowledgeBaseManager } from '../components/KnowledgeBaseManager';
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
  Bell,
  Search,
  ChevronRight,
  Building2,
  ArrowLeft,
  X,
  ExternalLink,
  RefreshCw,
  Database,
  Sparkles,
  Filter,
  Menu,
} from 'lucide-react';

export default function PlatformHome() {
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [users, setUsers] = useState<AuthUser[]>(MOCK_USERS);
  
  // Estado de Autenticación
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(MOCK_USERS[0]); // Inicia con SuperAdmin para desarrollo
  const [currentTenant, setCurrentTenant] = useState<Tenant>(MOCK_TENANTS[0]); // UGES
  const [activeView, setActiveView] = useState<'client' | 'admin'>('admin');
  const [clientTab, setClientTab] = useState<ClientTab>('inbox');
  const [topSearch, setTopSearch] = useState('');
  const [showTenantSwitcherModal, setShowTenantSwitcherModal] = useState(false);
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estados de datos reales en vivo desde Supabase (Universidad UGES - Modo Read-Only)
  const [ugesConversations, setUgesConversations] = useState<Conversation[] | null>(null);
  const [ugesKnowledgeDocs, setUgesKnowledgeDocs] = useState<UgesKnowledgeDoc[] | null>(null);
  const [ugesTelemetry, setUgesTelemetry] = useState<DailyTelemetry[] | null>(null);
  const [isSyncingUges, setIsSyncingUges] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [kbCategoryFilter, setKbCategoryFilter] = useState<string>('all');
  const [kbSearch, setKbSearch] = useState<string>('');

  // Carga asíncrona de datos de la base de datos real de UGES (Solo Lectura)
  const loadUgesRealData = useCallback(async () => {
    setIsSyncingUges(true);
    try {
      const [liveConvs, liveKb, liveTelem, liveSummary] = await Promise.all([
        fetchUgesLiveConversations(),
        fetchUgesLiveKnowledgeBase(),
        fetchUgesLiveTelemetry(),
        fetchUgesStatsSummary(),
      ]);

      if (liveConvs.length > 0) {
        setUgesConversations(liveConvs);
      }
      if (liveKb.length > 0) {
        setUgesKnowledgeDocs(liveKb);
      }
      if (liveTelem.length > 0) {
        setUgesTelemetry(liveTelem);
      }

      // Actualizar inquilino UGES con los datos computados de la base de datos
      setTenants((prev) =>
        prev.map((t) => {
          if (t.id === 'tenant-uges') {
            return {
              ...t,
              totalSpentMxn: liveSummary.totalSpentMxn,
              totalTokensUsed: liveSummary.totalTokensUsed,
              metaFreeConversationsUsed: liveSummary.metaFreeConversationsUsed,
              metaExcessCostMxn: liveSummary.metaExcessCostMxn,
              channels: t.channels.map((ch) =>
                ch.type === 'whatsapp'
                  ? {
                      ...ch,
                      lastPing: `En vivo · ${liveSummary.lastActivityTime}`,
                      dailyMessagesCount: liveSummary.totalMessages,
                    }
                  : ch
              ),
            };
          }
          return t;
        })
      );

      setCurrentTenant((prev) => {
        if (prev.id === 'tenant-uges') {
          return {
            ...prev,
            totalSpentMxn: liveSummary.totalSpentMxn,
            totalTokensUsed: liveSummary.totalTokensUsed,
            metaFreeConversationsUsed: liveSummary.metaFreeConversationsUsed,
            metaExcessCostMxn: liveSummary.metaExcessCostMxn,
            channels: prev.channels.map((ch) =>
              ch.type === 'whatsapp'
                ? {
                    ...ch,
                    lastPing: `En vivo · ${liveSummary.lastActivityTime}`,
                    dailyMessagesCount: liveSummary.totalMessages,
                  }
                : ch
            ),
          };
        }
        return prev;
      });

      setLastSyncTime(
        new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      );
    } catch (err) {
      console.error('[UGES Real Data Sync] Error:', err);
    } finally {
      setIsSyncingUges(false);
    }
  }, []);

  useEffect(() => {
    loadUgesRealData();
  }, [loadUgesRealData]);

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
      setClientTab(getDefaultTabForUser(user));
    }
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

  const handleUpdateUserPassword = (userId: string, newPassword: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            password: newPassword,
            mustChangePassword: false,
          };
        }
        return u;
      })
    );
  };

  const handleResetUserPassword = (userId: string, newPassword: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            password: newPassword,
            mustChangePassword: true,
          };
        }
        return u;
      })
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMobileMenuOpen(false);
  };

  // Permisos estrictos por nivel organizacional (calculados siempre para mantener orden de hooks)
  const allowedTabs = currentUser ? getAllowedTabsForUser(currentUser) : [];
  const userLevelConfig = getUserLevelConfig(currentUser);

  // Redirigir de inmediato si la pestaña activa no está autorizada para este usuario
  useEffect(() => {
    if (currentUser && !allowedTabs.includes(clientTab)) {
      setClientTab(getDefaultTabForUser(currentUser));
    }
  }, [currentUser, allowedTabs, clientTab]);

  // Si no hay sesión iniciada, mostrar el portal de login estilo Google (después de todos los hooks)
  if (!currentUser) {
    return (
      <main className="min-h-screen relative flex items-center justify-center bg-[#f0f4f9] p-4">
        <AuthModal
          users={users}
          tenants={tenants}
          onLoginSuccess={handleLoginSuccess}
          onUpdateUserPassword={handleUpdateUserPassword}
        />
      </main>
    );
  }

  // Filtrar tenants disponibles según rol
  const isSuperAdmin = currentUser.role === 'superadmin';
  const visibleTenants = isSuperAdmin
    ? tenants
    : tenants.filter((t) => t.id === currentUser.tenantId);

  const currentConversations =
    currentTenant.id === 'tenant-uges' && ugesConversations && ugesConversations.length > 0
      ? ugesConversations
      : MOCK_CONVERSATIONS[currentTenant.id] || [];

  const currentTelemetry =
    currentTenant.id === 'tenant-uges' && ugesTelemetry && ugesTelemetry.length > 0
      ? ugesTelemetry
      : MOCK_TELEMETRY;

  // Filtrar documentos de base de conocimiento para UGES
  const filteredKnowledgeDocs = (ugesKnowledgeDocs || []).filter((doc) => {
    const matchesCategory =
      kbCategoryFilter === 'all' ||
      doc.categoria.toLowerCase() === kbCategoryFilter.toLowerCase();
    const matchesSearch =
      !kbSearch ||
      doc.titulo.toLowerCase().includes(kbSearch.toLowerCase()) ||
      doc.contenido.toLowerCase().includes(kbSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const uniqueKbCategories = Array.from(
    new Set((ugesKnowledgeDocs || []).map((d) => d.categoria).filter(Boolean))
  );

  // Filtrar empresas para el modal de cambio interno (para soportar 100+ empresas)
  const modalFilteredTenants = visibleTenants.filter((t) => {
    if (!tenantSearchQuery) return true;
    const q = tenantSearchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.industry.toLowerCase().includes(q) || t.slug.includes(q);
  });

  return (
    <div className="min-h-screen flex bg-[#f8f9fa] text-[#1f1f1f]">
      {/* Menú Lateral Izquierdo Estilo Google (Soporta drawer móvil y static desktop) */}
      <GoogleSidebar
        tenants={visibleTenants}
        currentTenant={currentTenant}
        onSelectTenant={setCurrentTenant}
        activeView={activeView}
        onChangeView={setActiveView}
        clientTab={clientTab}
        onChangeClientTab={setClientTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        unreadCount={currentConversations.length}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Área de Contenido Principal al Frente */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar Estilo Google Play Console / Google Cloud */}
        <header className="h-16 px-4 sm:px-6 bg-white border-b border-[#dadce0] flex items-center justify-between sticky top-0 z-20">
          {/* Lado Izquierdo: Botón Hamburger Móvil + Breadcrumb */}
          <div className="flex items-center gap-2 text-xs overflow-hidden">
            {/* Botón Hamburger visible solo en móviles (< lg:) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1f1f1f] transition cursor-pointer shrink-0"
              title="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="hidden sm:inline font-semibold text-[#5f6368]">Consola</span>
            <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-[#747775]" />
            {activeView === 'admin' ? (
              <span className="font-semibold text-[#1f1f1f] truncate">SuperAdmin HQ</span>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="font-semibold text-[#1f1f1f] flex items-center gap-1.5 truncate">
                  <span>{currentTenant.logo}</span>
                  <span className="truncate max-w-[110px] sm:max-w-none">{currentTenant.name}</span>
                </span>

                {/* Si es SuperAdmin, botón interno para cambiar de empresa (soporta 100+) */}
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setTenantSearchQuery('');
                      setShowTenantSwitcherModal(true);
                    }}
                    className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[#f1f3f4] hover:bg-[#e0e2ec] text-[#0b57d0] border border-[#dadce0] transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <span>Cambiar</span>
                    <span className="text-[8px]">▼</span>
                  </button>
                )}
              </div>
            )}

            <span
              className={`ml-1 sm:ml-2 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${userLevelConfig.badgeStyle} truncate max-w-[110px] sm:max-w-none shrink-0`}
            >
              {activeView === 'admin' ? '⚡ Control Maestro' : userLevelConfig.badgeLabel}
            </span>
          </div>

          {/* Quick Search Bar (Oculta en móviles para evitar colapso) */}
          <div className="hidden md:flex items-center w-64 lg:w-96 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#747775]" />
            <input
              type="text"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              placeholder="Buscar en la consola de Valentina..."
              className="w-full bg-[#f1f3f4] hover:bg-[#e0e2ec] focus:bg-white border border-transparent focus:border-[#dadce0] rounded-full pl-9 pr-4 py-1.5 text-xs text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] transition"
            />
          </div>

          {/* Right Actions, User & Prominent Logout Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* View switcher buttons for SuperAdmin */}
            {isSuperAdmin && (
              <div className="hidden sm:flex items-center bg-[#f1f3f4] rounded-full p-0.5 text-xs font-semibold">
                <button
                  onClick={() => setActiveView('client')}
                  className={`px-3 py-1 rounded-full transition cursor-pointer ${
                    activeView === 'client'
                      ? 'bg-white text-[#0b57d0] shadow-sm'
                      : 'text-[#5f6368] hover:text-[#1f1f1f]'
                  }`}
                >
                  Cliente
                </button>
                <button
                  onClick={() => setActiveView('admin')}
                  className={`px-3 py-1 rounded-full transition cursor-pointer ${
                    activeView === 'admin'
                      ? 'bg-[#0b57d0] text-white shadow-sm'
                      : 'text-[#5f6368] hover:text-[#1f1f1f]'
                  }`}
                >
                  Admin
                </button>
              </div>
            )}

            {/* Notifications Button */}
            <button
              title="Notificaciones"
              className="p-2 rounded-full hover:bg-[#f1f3f4] text-[#5f6368] hover:text-[#1f1f1f] transition cursor-pointer relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0b57d0] rounded-full"></span>
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-[#dadce0]">
              <div className="w-8 h-8 rounded-full bg-[#0b57d0] text-white font-bold text-xs flex items-center justify-center">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-[#1f1f1f] leading-tight">{currentUser.fullName}</p>
                <p className="text-[10px] text-[#5f6368] font-mono">{currentUser.role}</p>
              </div>
            </div>

            {/* BOTÓN DE CERRAR SESIÓN VISIBLE Y PROMINENTE (Icono en móvil, texto en desktop) */}
            <button
              onClick={handleLogout}
              title="Cerrar sesión del sistema"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-[#c5221f] bg-[#fce8e6] hover:bg-[#fad2cf] border border-[#f5c2c7] transition cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </header>

        {/* Contenedor Principal de la Página - Padding Responsive */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6">
          {activeView === 'admin' && isSuperAdmin ? (
            /* ================= SUPERADMIN HQ VIEW ================= */
            <SuperAdminView
              tenants={tenants}
              users={users}
              onSelectTenant={(t) => {
                setCurrentTenant(t);
              }}
              onEnterAsClient={(t) => {
                setCurrentTenant(t);
                setActiveView('client');
              }}
              onCreateTenantAndUser={handleCreateTenantAndUser}
              onToggleUserStatus={handleToggleUserStatus}
              onResetUserPassword={handleResetUserPassword}
            />
          ) : (
            /* ================= CLIENT PORTAL VIEW ================= */
            <div className="space-y-6">
              {/* Barra de Retorno y Gestión Interna para SuperAdmin */}
              {isSuperAdmin && (
                <div className="p-3.5 rounded-2xl bg-[#e8f0fe] border border-[#d3e3fd] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#041e49]">
                    <Shield className="w-4 h-4 text-[#0b57d0]" />
                    <span>
                      Estás inspeccionando el espacio de trabajo de <strong className="font-semibold">{currentTenant.name}</strong> en modo SuperAdmin.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setTenantSearchQuery('');
                        setShowTenantSwitcherModal(true);
                      }}
                      className="px-3 py-1.5 rounded-full bg-white hover:bg-[#f1f3f4] text-[#0b57d0] border border-[#dadce0] font-semibold transition cursor-pointer"
                    >
                      Cambiar de cliente (100+)
                    </button>
                    <button
                      onClick={() => setActiveView('admin')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-semibold transition cursor-pointer shadow-sm"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver al Directorio Global</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Secondary Navigation Pills (Google Style) - Solo muestra pestañas autorizadas */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#dadce0] pb-3">
                {allowedTabs.length <= 1 ? (
                  /* Vista Limpia y Directa para Vendedor / Evaluador (Solo 1 módulo autorizado) */
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] text-[#0b57d0] flex items-center justify-center shadow-xs">
                      {clientTab === 'inbox' && <MessageSquare className="w-4 h-4" />}
                      {clientTab === 'knowledge' && <BookOpen className="w-4 h-4" />}
                      {clientTab === 'analytics' && <BarChart3 className="w-4 h-4" />}
                      {clientTab === 'channels' && <Cpu className="w-4 h-4" />}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#1f1f1f] flex items-center gap-2">
                        <span>
                          {clientTab === 'inbox' && 'Bandeja Omnicanal en Vivo'}
                          {clientTab === 'knowledge' && 'Base de Conocimiento & Documentos'}
                          {clientTab === 'analytics' && 'Tablero Ejecutivo de Métricas'}
                          {clientTab === 'channels' && 'Canales & Hardware'}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#0b57d0] border border-[#d3e3fd]">
                          Módulo Único Asignado
                        </span>
                      </h2>
                      <p className="text-[11px] text-[#5f6368]">
                        {userLevelConfig.description}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Selector de Pestañas Multi-Rol (Solo muestra pestañas autorizadas) */
                  <div className="flex flex-wrap items-center gap-1 bg-white border border-[#dadce0] rounded-full p-1 shadow-sm">
                    {allowedTabs.includes('inbox') && (
                      <button
                        onClick={() => setClientTab('inbox')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                          clientTab === 'inbox'
                            ? 'bg-[#e8f0fe] text-[#0b57d0]'
                            : 'text-[#5f6368] hover:text-[#1f1f1f]'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Bandeja en Vivo ({currentConversations.length})</span>
                      </button>
                    )}

                    {allowedTabs.includes('channels') && (
                      <button
                        onClick={() => setClientTab('channels')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                          clientTab === 'channels'
                            ? 'bg-[#e8f0fe] text-[#0b57d0]'
                            : 'text-[#5f6368] hover:text-[#1f1f1f]'
                        }`}
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Canales & Hardware ({currentTenant.channels.length})</span>
                      </button>
                    )}

                    {allowedTabs.includes('knowledge') && (
                      <button
                        onClick={() => setClientTab('knowledge')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                          clientTab === 'knowledge'
                            ? 'bg-[#e8f0fe] text-[#0b57d0]'
                            : 'text-[#5f6368] hover:text-[#1f1f1f]'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>
                          Base de Conocimiento{' '}
                          {currentTenant.id === 'tenant-uges' && ugesKnowledgeDocs
                            ? `(${ugesKnowledgeDocs.length})`
                            : ''}
                        </span>
                      </button>
                    )}

                    {allowedTabs.includes('analytics') && (
                      <button
                        onClick={() => setClientTab('analytics')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                          clientTab === 'analytics'
                            ? 'bg-[#e8f0fe] text-[#0b57d0]'
                            : 'text-[#5f6368] hover:text-[#1f1f1f]'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Telemetría & Métricas</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Quick Status e Indicador de Base de Datos en Vivo */}
                <div className="flex items-center gap-2.5 text-xs text-[#5f6368]">
                  {currentTenant.id === 'tenant-uges' ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#e6f4ea] text-[#137333] border border-[#ceead6] font-medium shadow-xs">
                        <Database className="w-3.5 h-3.5 text-[#137333]" />
                        <span>Supabase Read-Only (302 msgs · 47 leads)</span>
                        {lastSyncTime && (
                          <span className="text-[#34a853] font-mono text-[10px]">
                            [{lastSyncTime}]
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => loadUgesRealData()}
                        disabled={isSyncingUges}
                        title="Actualizar datos desde la base de datos de la Universidad (Solo Lectura)"
                        className="p-1.5 rounded-full hover:bg-white text-[#0b57d0] border border-[#dadce0] transition cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${isSyncingUges ? 'animate-spin text-[#0b57d0]' : ''}`}
                        />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#137333]"></span>
                      <span>
                        Organización: <strong className="text-[#1f1f1f]">{currentTenant.name}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* TAB CONTENT - Protegido estrictamente por allowedTabs */}
              {clientTab === 'inbox' && allowedTabs.includes('inbox') && (
                <div className="space-y-6">
                  <LiveOmnichannelInbox
                    key={`inbox-${currentTenant.id}-${currentConversations.length}`}
                    conversations={currentConversations}
                    tenantName={currentTenant.name}
                    currentUser={currentUser}
                  />
                </div>
              )}

              {clientTab === 'channels' && allowedTabs.includes('channels') && (
                <div className="space-y-6">
                  <ChannelHardwareCard
                    channels={currentTenant.channels}
                    tenantName={currentTenant.name}
                  />
                </div>
              )}

              {clientTab === 'knowledge' && allowedTabs.includes('knowledge') && (
                <KnowledgeBaseManager
                  tenant={currentTenant}
                  currentUser={currentUser}
                />
              )}

              {clientTab === 'analytics' && allowedTabs.includes('analytics') && (
                <div className="space-y-6">
                  <AppleMetricsWidgets tenant={currentTenant} telemetry={currentTelemetry} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL: SELECTOR INTERNO DE EMPRESAS (ESCÁLABLE PARA 100+ CLIENTES) */}
      {showTenantSwitcherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 border border-[#dadce0] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#dadce0] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] text-[#0b57d0] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1f1f1f]">Directorio Interno de Empresas</h3>
                  <p className="text-xs text-[#5f6368]">Selecciona una empresa cliente para gestionar su portal</p>
                </div>
              </div>
              <button
                onClick={() => setShowTenantSwitcherModal(false)}
                className="p-1.5 rounded-lg text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f1f3f4] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input for 100+ Tenants */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#747775]" />
              <input
                type="text"
                value={tenantSearchQuery}
                onChange={(e) => setTenantSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, industria o dominio (ej. UGES, salud, conocer)..."
                className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] focus:bg-white"
                autoFocus
              />
            </div>

            {/* List of Tenants */}
            <div className="max-h-72 overflow-y-auto divide-y divide-[#f1f3f4] border border-[#dadce0] rounded-xl">
              {modalFilteredTenants.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#5f6368]">
                  No se encontraron empresas con esa búsqueda.
                </div>
              ) : (
                modalFilteredTenants.map((t) => {
                  const isCurrent = t.id === currentTenant.id;
                  const waChannel = t.channels.find((c) => c.type === 'whatsapp');

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setCurrentTenant(t);
                        setShowTenantSwitcherModal(false);
                      }}
                      className={`w-full p-3 flex items-center justify-between text-left hover:bg-[#f8f9fa] transition cursor-pointer ${
                        isCurrent ? 'bg-[#e8f0fe]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-1.5 rounded-lg bg-white border border-[#dadce0] shadow-sm">
                          {t.logo}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-[#1f1f1f] flex items-center gap-1.5">
                            <span>{t.name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-[#0b57d0] text-white text-[9px] font-bold">
                                ACTUAL
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#5f6368]">
                            {t.industry} • Plan {t.plan}
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-[#5f6368]">
                        <span className="font-mono text-[#1f1f1f] font-semibold">
                          ${t.monthlyBudgetMxn.toLocaleString()} MXN
                        </span>
                        <p className="text-[10px] text-[#137333]">
                          {waChannel ? '● WhatsApp Activo' : 'Sin WhatsApp'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-[#5f6368]">
              <span>Mostrando {modalFilteredTenants.length} de {visibleTenants.length} empresas registradas</span>
              <button
                onClick={() => setShowTenantSwitcherModal(false)}
                className="px-4 py-1.5 rounded-full bg-[#f1f3f4] hover:bg-[#e0e2ec] text-[#1f1f1f] font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
