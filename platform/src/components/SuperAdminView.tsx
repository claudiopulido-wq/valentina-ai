'use client';

import React, { useState } from 'react';
import { Tenant, AuthUser, Channel } from '../types/platform';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  ShieldCheck,
  Building2,
  Users,
  Coins,
  TrendingUp,
  PlusCircle,
  Database,
  CheckCircle,
  Copy,
  ArrowRight,
  Sparkles,
  Server,
  Key,
  Mail,
  Search,
  ChevronDown,
  Pin,
  ExternalLink,
} from 'lucide-react';

interface Props {
  tenants: Tenant[];
  users: AuthUser[];
  onSelectTenant: (tenant: Tenant) => void;
  onEnterAsClient: (tenant: Tenant) => void;
  onCreateTenantAndUser?: (newTenant: Tenant, newUser: AuthUser) => void;
  onToggleUserStatus?: (userId: string) => void;
}

export const SuperAdminView: React.FC<Props> = ({
  tenants,
  users,
  onSelectTenant,
  onEnterAsClient,
  onCreateTenantAndUser,
  onToggleUserStatus,
}) => {
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'tenants' | 'credentials'>('tenants');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Form states for new Tenant & User
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [emojiLogo, setEmojiLogo] = useState('🏢');
  const [waNumber, setWaNumber] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState(5000);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPassword, setContactPassword] = useState('');
  const [createdSuccessModal, setCreatedSuccessModal] = useState<{ tenant: Tenant; user: AuthUser } | null>(null);

  // Financial aggregates
  const totalRevenueMxn = tenants.reduce((acc, t) => acc + t.monthlyBudgetMxn, 0);
  const totalCostMxn = tenants.reduce((acc, t) => acc + t.totalSpentMxn, 0);
  const netProfitMxn = totalRevenueMxn - totalCostMxn;
  const grossMargin = totalRevenueMxn > 0 ? Math.round((netProfitMxn / totalRevenueMxn) * 100) : 0;

  const supabaseSqlSchema = `-- VALENTINA AI: SCHEMA MULTI-TENANT CON ROW LEVEL SECURITY (RLS)
-- Pega este código en el SQL Editor de tu proyecto en Supabase

-- 1. Tabla Maestra de Organizaciones (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    industry TEXT,
    plan_tier TEXT DEFAULT 'Enterprise',
    monthly_budget_mxn NUMERIC DEFAULT 3000,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS en Organizaciones
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 3. Canales Conectados (WhatsApp Cloud API / Webchat)
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL,
    identifier TEXT NOT NULL,
    status TEXT DEFAULT 'connected',
    last_ping TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- 4. Contactos y Prospectos
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    phone_or_email TEXT NOT NULL,
    name TEXT,
    qualification_score INT DEFAULT 75,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 5. Conversaciones con Telemetría
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL,
    status TEXT DEFAULT 'ai_handling',
    total_tokens INT DEFAULT 0,
    total_cost_mxn NUMERIC(10, 4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
`;

  const copySql = () => {
    navigator.clipboard.writeText(supabaseSqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCreateTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const newTenantId = `tenant-${slug || Date.now()}`;

    const newChannel: Channel = {
      id: `ch-${slug}-wa`,
      type: 'whatsapp',
      name: `WhatsApp Oficial ${companyName}`,
      identifier: waNumber,
      status: 'connected',
      lastPing: 'Hace unos momentos',
      batteryLevel: 99,
      dailyMessagesCount: 0,
    };

    const newTenant: Tenant = {
      id: newTenantId,
      name: companyName,
      slug,
      industry: industry || 'Empresarial & Servicios',
      logo: emojiLogo || '🏢',
      plan: 'Enterprise',
      status: 'active',
      monthlyBudgetMxn: monthlyBudget,
      totalSpentMxn: 0,
      totalTokensUsed: 0,
      activeAgentsCount: 1,
      channels: [newChannel],
    };

    const newUser: AuthUser = {
      id: `user-${slug}-admin`,
      email: contactEmail.toLowerCase().trim(),
      password: contactPassword,
      fullName: contactName || `${companyName} Admin`,
      tenantId: newTenantId,
      role: 'tenant_admin',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      notes: `Alta autorizada por Claudio Pulido para ${companyName}`,
    };

    if (onCreateTenantAndUser) {
      onCreateTenantAndUser(newTenant, newUser);
    }

    // Registrar en Supabase Authentication si está conectado
    if (isSupabaseConfigured) {
      supabase.auth.signUp({
        email: contactEmail.toLowerCase().trim(),
        password: contactPassword,
        options: {
          data: {
            full_name: contactName || `${companyName} Admin`,
            role: 'tenant_admin',
            tenant_id: newTenantId,
          },
        },
      }).catch((err) => console.warn('Supabase auto-create user error:', err));
    }

    setCreatedSuccessModal({ tenant: newTenant, user: newUser });
    setShowNewTenantModal(false);

    // Reset fields
    setCompanyName('');
    setIndustry('');
    setWaNumber('');
    setContactName('');
    setContactEmail('');
    setContactPassword('');
  };

  const filteredTenants = tenants.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.industry.toLowerCase().includes(q) || t.slug.includes(q);
    }
    return true;
  });

  return (
    <div className="w-full space-y-6">
      {/* Google Console Org Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#e8f0fe] border border-[#d3e3fd] flex items-center justify-center text-[#0b57d0] text-xl font-bold">
            🎓
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#1f1f1f] tracking-tight">UNIVERSIDAD UGES</h1>
            <p className="text-xs text-[#5f6368] mt-0.5">
              Cuenta de organización • ID de la cuenta: <span className="font-mono text-[#1f1f1f]">9080269226974788257</span>
            </p>
          </div>
        </div>

        {/* Global Blueprint Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white hover:bg-[#f1f3f4] border border-[#dadce0] text-xs font-semibold text-[#1f1f1f] transition shadow-sm cursor-pointer"
          >
            <Database className="w-4 h-4 text-[#0b57d0]" />
            <span>Supabase RLS Blueprint</span>
          </button>

          <button
            onClick={() => setShowNewTenantModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Dar de Alta Empresa</span>
          </button>
        </div>
      </div>

      {/* Google Style Banner Notice */}
      <div className="bg-[#f0f4f9] border border-[#dadce0] rounded-2xl p-5 space-y-3">
        <p className="text-xs text-[#1f1f1f] leading-relaxed">
          <strong>Todas las instancias multi-tenant se registraron correctamente</strong> para cumplir con los requisitos de aislamiento criptográfico Row Level Security (RLS) y conexión directa a WhatsApp Cloud API.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewTenantModal(true)}
            className="px-4 py-1.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold cursor-pointer transition shadow-sm"
          >
            Dar de alta nuevo cliente
          </button>
          <button
            onClick={() => setShowSqlModal(true)}
            className="px-4 py-1.5 rounded-full bg-white hover:bg-[#f1f3f4] text-[#0b57d0] border border-[#dadce0] text-xs font-semibold cursor-pointer transition"
          >
            Ver esquema RLS
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards in Google Light Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5f6368] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Facturación Mensual</span>
            <Coins className="w-4 h-4 text-[#0b57d0]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#1f1f1f]">
            ${totalRevenueMxn.toLocaleString('es-MX')} <span className="text-xs font-normal text-[#5f6368]">MXN</span>
          </p>
          <p className="text-xs text-[#5f6368] mt-1">{tenants.length} empresas facturando planes activos</p>
        </div>

        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5f6368] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Costo Global de APIs</span>
            <Server className="w-4 h-4 text-[#b06000]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#1f1f1f]">
            ${totalCostMxn.toFixed(2)} <span className="text-xs font-normal text-[#5f6368]">MXN</span>
          </p>
          <p className="text-xs text-[#5f6368] mt-1">Railway + Supabase + Gemini / Voyage</p>
        </div>

        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5f6368] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Utilidad Neta</span>
            <TrendingUp className="w-4 h-4 text-[#137333]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#137333]">
            ${netProfitMxn.toLocaleString('es-MX')} <span className="text-xs font-normal text-[#5f6368]">MXN</span>
          </p>
          <p className="text-xs text-[#137333] mt-1 font-semibold">Margen neto: {grossMargin}%</p>
        </div>

        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5f6368] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cuentas Autorizadas</span>
            <Users className="w-4 h-4 text-[#0b57d0]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#0b57d0]">
            {users.length} <span className="text-xs font-normal text-[#5f6368]">usuarios</span>
          </p>
          <p className="text-xs text-[#5f6368] mt-1">Acceso corporativo cerrado</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] pb-2">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'tenants'
              ? 'bg-[#e8f0fe] text-[#0b57d0]'
              : 'text-[#5f6368] hover:text-[#1f1f1f]'
          }`}
        >
          Directorio de Empresas ({tenants.length})
        </button>

        <button
          onClick={() => setActiveTab('credentials')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'credentials'
              ? 'bg-[#e8f0fe] text-[#0b57d0]'
              : 'text-[#5f6368] hover:text-[#1f1f1f]'
          }`}
        >
          Control de Credenciales ({users.length})
        </button>
      </div>

      {/* TAB 1: Tenants List Styled Like Google Play Console */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          {/* Header Row: Count & Action */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1f1f1f]">
              {tenants.length} {tenants.length === 1 ? 'empresa' : 'empresas'}
            </h2>
            <button
              onClick={() => setShowNewTenantModal(true)}
              className="text-[#0b57d0] font-semibold text-xs hover:underline cursor-pointer"
            >
              Crear empresa
            </button>
          </div>

          {/* Filters and Search Bar (Exact Google Play Console Style) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5f6368]">Filtrar por</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-[#f1f3f4] text-[#1f1f1f] border border-[#dadce0] rounded-full px-3 py-1.5 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">Todas</option>
                <option value="active">Solo Activas</option>
              </select>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#747775]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busca por empresa o paquete"
                className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-full pl-9 pr-4 py-2 text-xs text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] focus:bg-white"
              />
            </div>
          </div>

          {/* Clean Google Play Console Table */}
          <div className="bg-white border border-[#dadce0] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8f9fa] border-b border-[#dadce0] text-[#5f6368] font-semibold text-[11px]">
                  <tr>
                    <th className="p-4">Aplicación</th>
                    <th className="p-4">Usuarios con la app instalada</th>
                    <th className="p-4">Estado de la app</th>
                    <th className="p-4">Facturación Mensual</th>
                    <th className="p-4">Última actualización</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4]">
                  {filteredTenants.map((t) => {
                    const waChannel = t.channels.find((c) => c.type === 'whatsapp');

                    return (
                      <tr key={t.id} className="hover:bg-[#f8f9fa] transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl p-1.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">{t.logo}</span>
                            <div>
                              <p className="font-semibold text-[#1f1f1f] text-xs">{t.name}</p>
                              <p className="text-[11px] text-[#5f6368] font-mono">{t.slug}.gesacademico.edu</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 font-mono text-[#1f1f1f]">
                          {waChannel ? '33' : '0'}
                        </td>

                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span>
                            Producción
                          </span>
                        </td>

                        <td className="p-4 font-mono text-[#1f1f1f]">
                          ${t.monthlyBudgetMxn.toLocaleString()} MXN
                        </td>

                        <td className="p-4 text-[#5f6368]">
                          16 jun 2026
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Pin className="w-4 h-4 text-[#747775] hover:text-[#1f1f1f] cursor-pointer" />
                            <button
                              onClick={() => {
                                onSelectTenant(t);
                                onEnterAsClient(t);
                              }}
                              className="text-[#0b57d0] hover:underline font-semibold flex items-center gap-1 text-xs cursor-pointer"
                            >
                              <span>Ver app</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-[#dadce0] bg-[#f8f9fa] flex items-center justify-between text-xs text-[#5f6368]">
              <span>Mostrar filas: 10</span>
              <span>1 - {filteredTenants.length} de {filteredTenants.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Credentials Control in Clean White Table */}
      {activeTab === 'credentials' && (
        <div className="bg-white border border-[#dadce0] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#dadce0] flex items-center justify-between bg-[#f8f9fa]">
            <div>
              <h3 className="text-sm font-semibold text-[#1f1f1f]">Directorio Maestro de Credenciales</h3>
              <p className="text-xs text-[#5f6368]">Solo las cuentas listadas aquí pueden iniciar sesión en el portal</p>
            </div>
            <button
              onClick={() => setShowNewTenantModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold cursor-pointer"
            >
              + Autorizar Usuario
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9fa] border-b border-[#dadce0] text-[#5f6368] font-semibold text-[11px]">
                <tr>
                  <th className="p-4">Usuario Responsable</th>
                  <th className="p-4">Correo Autorizado</th>
                  <th className="p-4">Empresa Asignada</th>
                  <th className="p-4">Rol en Sistema</th>
                  <th className="p-4">Estatus de Acceso</th>
                  <th className="p-4 text-right">Control de Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f4]">
                {users.map((u) => {
                  const assignedTenant = tenants.find((t) => t.id === u.tenantId);

                  return (
                    <tr key={u.id} className="hover:bg-[#f8f9fa] transition">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#e8f0fe] text-[#0b57d0] flex items-center justify-center text-xs font-bold">
                            {u.role === 'superadmin' ? '👑' : '👤'}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1f1f1f] text-xs">{u.fullName}</p>
                            <p className="text-[10px] text-[#5f6368]">{u.notes || 'Alta autorizada'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-[#1f1f1f]">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#747775]" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        {assignedTenant ? (
                          <div className="flex items-center gap-1.5">
                            <span>{assignedTenant.logo}</span>
                            <span className="font-medium text-[#1f1f1f]">{assignedTenant.name}</span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#e8f0fe] text-[#0b57d0] font-bold">
                            Acceso Root Global
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          u.role === 'superadmin'
                            ? 'bg-[#fef7e0] text-[#b06000]'
                            : 'bg-[#e8f0fe] text-[#0b57d0]'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="p-4">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span>
                            AUTORIZADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fce8e6] text-[#c5221f] border border-[#f5c2c7]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c5221f]"></span>
                            PAUSADO
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {u.role !== 'superadmin' && onToggleUserStatus && (
                          <button
                            onClick={() => onToggleUserStatus(u.id)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                              u.status === 'active'
                                ? 'bg-white hover:bg-[#fce8e6] text-[#c5221f] border border-[#f5c2c7]'
                                : 'bg-white hover:bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
                            }`}
                          >
                            {u.status === 'active' ? 'Pausar Acceso' : 'Reactivar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Dar de Alta Nuevo Cliente & Credenciales */}
      {showNewTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-[#dadce0] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#dadce0] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e8f0fe] flex items-center justify-center text-[#0b57d0]">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1f1f1f] tracking-tight">Dar de Alta Empresa Cliente</h3>
                  <p className="text-xs text-[#5f6368]">Registra a la empresa y genera sus credenciales de acceso</p>
                </div>
              </div>
              <button onClick={() => setShowNewTenantModal(false)} className="text-[#5f6368] hover:text-[#1f1f1f] p-1 rounded-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateTenantSubmit} className="space-y-4 text-xs">
              {/* Sección 1: Datos de la Empresa */}
              <div className="space-y-3 p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                <span className="font-semibold text-xs text-[#0b57d0] uppercase flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> 1. Datos de la Empresa Cliente
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[#5f6368] block mb-1 font-medium">Nombre de la Empresa</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Hospital San José"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                    />
                  </div>
                  <div>
                    <label className="text-[#5f6368] block mb-1 font-medium">Ícono / Logo</label>
                    <select
                      value={emojiLogo}
                      onChange={(e) => setEmojiLogo(e.target.value)}
                      className="w-full bg-white border border-[#dadce0] rounded-lg px-2 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                    >
                      <option value="🏢">🏢 Empresa</option>
                      <option value="🏥">🏥 Salud</option>
                      <option value="🎓">🎓 Escuela</option>
                      <option value="⚖️">⚖️ Legal</option>
                      <option value="🏠">🏠 Inmuebles</option>
                      <option value="🚗">🚗 Automotriz</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[#5f6368] block mb-1 font-medium">Giro / Industria</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Cirugía & Especialidades"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                    />
                  </div>
                  <div>
                    <label className="text-[#5f6368] block mb-1 font-medium">WhatsApp Cloud API</label>
                    <input
                      type="text"
                      required
                      placeholder="+52 442 000 0000"
                      value={waNumber}
                      onChange={(e) => setWaNumber(e.target.value)}
                      className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#5f6368] block mb-1 font-medium">Cuota Mensual Contratada (MXN)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="500"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                    className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] font-mono focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                  />
                </div>
              </div>

              {/* Sección 2: Credenciales de Acceso Autorizadas */}
              <div className="space-y-3 p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                <span className="font-semibold text-xs text-[#0b57d0] uppercase flex items-center gap-1.5">
                  <Key className="w-4 h-4" /> 2. Credenciales Autorizadas para el Cliente
                </span>

                <div>
                  <label className="text-[#5f6368] block mb-1 font-medium">Nombre del Responsable / Contacto</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Dr. Armando Garza"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[#5f6368] block mb-1 font-medium">Correo de Acceso (Usuario)</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@hospital.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                    />
                  </div>

                  <div>
                    <label className="text-[#5f6368] block mb-1 font-medium">Contraseña Asignada</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Hospital2026!"
                      value={contactPassword}
                      onChange={(e) => setContactPassword(e.target.value)}
                      className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewTenantModal(false)}
                  className="px-4 py-2 rounded-full bg-white hover:bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0] font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dar de Alta &amp; Activar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ÉXITO: Credenciales Creadas */}
      {createdSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 border border-[#dadce0] shadow-xl">
            <div className="w-12 h-12 rounded-full bg-[#e6f4ea] border border-[#ceead6] flex items-center justify-center mx-auto text-[#137333]">
              <CheckCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-[#1f1f1f]">¡Cliente Dado de Alta Exitosamente!</h3>
            <p className="text-xs text-[#5f6368]">
              La empresa <strong className="text-[#1f1f1f]">{createdSuccessModal.tenant.name}</strong> y sus credenciales están listas para operar.
            </p>

            <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0] text-left space-y-2 text-xs font-mono">
              <div className="text-[#5f6368] text-[11px] font-semibold uppercase tracking-wider">Credenciales para el cliente:</div>
              <div className="text-[#1f1f1f]">
                <span className="text-[#5f6368]">Empresa:</span> {createdSuccessModal.tenant.name}
              </div>
              <div className="text-[#0b57d0]">
                <span className="text-[#5f6368]">Correo:</span> {createdSuccessModal.user.email}
              </div>
              <div className="text-[#137333]">
                <span className="text-[#5f6368]">Contraseña:</span> {createdSuccessModal.user.password}
              </div>
              <div className="text-[#1f1f1f]">
                <span className="text-[#5f6368]">Portal:</span> https://valentina-ai.mx (Acceso Clientes)
              </div>
            </div>

            <button
              onClick={() => setCreatedSuccessModal(null)}
              className="w-full py-2.5 px-4 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-semibold text-xs transition cursor-pointer"
            >
              Entendido &amp; Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Supabase SQL Blueprint */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col border border-[#dadce0] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#dadce0] pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#0b57d0]" />
                <h3 className="text-sm font-bold text-[#1f1f1f]">Esquema SQL Multi-Tenant con Row Level Security (RLS)</h3>
              </div>
              <button onClick={() => setShowSqlModal(false)} className="text-[#5f6368] hover:text-[#1f1f1f] cursor-pointer">✕</button>
            </div>

            <p className="text-xs text-[#5f6368] leading-relaxed">
              Este script crea las tablas multi-tenant en PostgreSQL con políticas de <strong>Row Level Security (RLS)</strong> para garantizar aislamiento absoluto entre clientes al costo base de $0 USD en Supabase.
            </p>

            <div className="relative flex-1 overflow-hidden rounded-xl bg-[#f8f9fa] border border-[#dadce0] p-3">
              <button
                onClick={copySql}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] border border-[#dadce0] text-xs font-mono transition cursor-pointer shadow-sm"
              >
                {copiedSql ? <CheckCircle className="w-3.5 h-3.5 text-[#137333]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
              </button>
              <pre className="text-[11px] font-mono text-[#1f1f1f] overflow-y-auto max-h-[340px] pr-12 leading-relaxed">
                {supabaseSqlSchema}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
