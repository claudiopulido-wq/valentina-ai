'use client';

import React, { useState } from 'react';
import { Tenant, AuthUser, Channel } from '../types/platform';
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
  Lock,
  Mail,
  UserCheck,
  UserX,
  PhoneCall,
  Smartphone,
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

-- 6. POLÍTICA DE AISLAMIENTO ESTRICTO (Ningún cliente ve datos de otro)
CREATE POLICY tenant_isolation_policy ON conversations
    FOR ALL
    USING (organization_id = (SELECT (auth.jwt() ->> 'org_id')::UUID));

CREATE POLICY tenant_isolation_contacts ON contacts
    FOR ALL
    USING (organization_id = (SELECT (auth.jwt() ->> 'org_id')::UUID));
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

  return (
    <div className="w-full space-y-6">
      {/* SuperAdmin Header */}
      <div className="apple-glass-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Valentina SuperAdmin HQ</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                ROOT CONTROL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Consola maestra de Claudio Pulido • Gestión de flotas, utilidades y autorizaciones cerradas
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-slate-200 transition"
          >
            <Database className="w-4 h-4 text-violet-400" />
            <span>Supabase RLS Blueprint</span>
          </button>

          <button
            onClick={() => setShowNewTenantModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Dar de Alta Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Global Financial Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="apple-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Facturación Mensual</span>
            <Coins className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white">
            ${totalRevenueMxn.toLocaleString('es-MX')} <span className="text-xs font-normal text-slate-400">MXN</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{tenants.length} empresas facturando planes activos</p>
        </div>

        <div className="apple-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Costo Global de APIs</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white">
            ${totalCostMxn.toFixed(2)} <span className="text-xs font-normal text-slate-400">MXN</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Railway + Supabase + Gemini / Voyage</p>
        </div>

        <div className="apple-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Utilidad Neta</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-emerald-400">
            ${netProfitMxn.toLocaleString('es-MX')} <span className="text-xs font-normal text-slate-400">MXN</span>
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-1 font-mono font-bold">Margen neto: {grossMargin}%</p>
        </div>

        <div className="apple-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Usuarios con Acceso</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-cyan-400">
            {users.length} <span className="text-xs font-normal text-slate-400">cuentas</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Onboarding cerrado por SuperAdmin</p>
        </div>
      </div>

      {/* Tabs Selector: Inquilinos vs Credenciales */}
      <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'tenants'
              ? 'bg-white/10 text-white border border-white/20 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4 text-violet-400" />
          <span>Directorio de Empresas ({tenants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('credentials')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'credentials'
              ? 'bg-white/10 text-white border border-white/20 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4 text-cyan-400" />
          <span>Control de Credenciales &amp; Accesos ({users.length})</span>
        </button>
      </div>

      {/* TAB 1: Tenants Table */}
      {activeTab === 'tenants' && (
        <div className="apple-glass-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Directorio de Inquilinos (Tenants Activos)</h3>
              <p className="text-xs text-slate-400">Aislamiento por Row Level Security en Supabase</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{tenants.length} tenants activos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-4">Cliente / Tenant</th>
                  <th className="p-4">WhatsApp Conectado</th>
                  <th className="p-4">Plan / Cuota</th>
                  <th className="p-4">Gasto de Tokens</th>
                  <th className="p-4">Margen de Ganancia</th>
                  <th className="p-4 text-right">Acceso Directo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {tenants.map((t) => {
                  const profit = t.monthlyBudgetMxn - t.totalSpentMxn;
                  const margin = t.monthlyBudgetMxn > 0 ? Math.round((profit / t.monthlyBudgetMxn) * 100) : 0;
                  const waChannel = t.channels.find((c) => c.type === 'whatsapp');

                  return (
                    <tr key={t.id} className="hover:bg-white/[0.03] transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl p-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">{t.logo}</span>
                          <div>
                            <p className="font-bold text-white text-xs">{t.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{t.industry}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-slate-300">
                        {waChannel ? (
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            {waChannel.identifier}
                          </span>
                        ) : (
                          <span className="text-slate-500">Sin WhatsApp</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          {t.plan}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">${t.monthlyBudgetMxn.toLocaleString()} MXN / mes</p>
                      </td>

                      <td className="p-4">
                        <p className="font-mono font-bold text-white">${t.totalSpentMxn.toFixed(2)} MXN</p>
                        <p className="text-[10px] text-slate-400 font-mono">{t.totalTokensUsed.toLocaleString()} tokens</p>
                      </td>

                      <td className="p-4">
                        <span className="font-mono font-bold text-emerald-400">{margin}% margen</span>
                        <p className="text-[10px] text-slate-400 font-mono">+${profit.toFixed(0)} MXN netos</p>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            onSelectTenant(t);
                            onEnterAsClient(t);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-violet-600 text-white font-medium transition text-xs shadow"
                        >
                          <span>Abrir Tablero</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Credentials & Access Control Table */}
      {activeTab === 'credentials' && (
        <div className="apple-glass-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Directorio Maestro de Credenciales Autorizadas</h3>
              <p className="text-xs text-slate-400">Solo los usuarios listados aquí pueden iniciar sesión en el portal</p>
            </div>
            <button
              onClick={() => setShowNewTenantModal(true)}
              className="text-xs px-3 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600 border border-violet-500/30 text-white font-semibold transition"
            >
              + Autorizar Nuevo Acceso
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-4">Usuario Responsable</th>
                  <th className="p-4">Correo Autorizado</th>
                  <th className="p-4">Empresa / Tenant</th>
                  <th className="p-4">Rol en Sistema</th>
                  <th className="p-4">Estatus de Acceso</th>
                  <th className="p-4 text-right">Control de Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {users.map((u) => {
                  const assignedTenant = tenants.find((t) => t.id === u.tenantId);

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.03] transition">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-300">
                            {u.role === 'superadmin' ? '👑' : '👤'}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{u.fullName}</p>
                            <p className="text-[10px] text-slate-400">{u.notes || 'Alta autorizada'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        {assignedTenant ? (
                          <div className="flex items-center gap-1.5">
                            <span>{assignedTenant.logo}</span>
                            <span className="font-medium text-white">{assignedTenant.name}</span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                            🌐 Acceso Global Root
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          u.role === 'superadmin'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="p-4">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            AUTORIZADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            PAUSADO / REVOCADO
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {u.role !== 'superadmin' && onToggleUserStatus && (
                          <button
                            onClick={() => onToggleUserStatus(u.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                              u.status === 'active'
                                ? 'bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="apple-glass-card rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-white/15 bg-[#0e121c] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Dar de Alta Nuevo Cliente (Onboarding)</h3>
                  <p className="text-xs text-slate-400">Registra a la empresa y genera sus credenciales de acceso</p>
                </div>
              </div>
              <button onClick={() => setShowNewTenantModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleCreateTenantSubmit} className="space-y-4 text-xs">
              {/* Sección 1: Datos de la Empresa */}
              <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="font-mono text-[11px] font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> 1. Datos de la Empresa Cliente
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-slate-400 block mb-1">Nombre de la Empresa</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Hospital San José"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Ícono / Logo</label>
                    <select
                      value={emojiLogo}
                      onChange={(e) => setEmojiLogo(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-2 py-2 text-white focus:outline-none focus:border-violet-500 text-sm"
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
                    <label className="text-slate-400 block mb-1">Giro / Industria</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Cirugía & Especialidades"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">WhatsApp Cloud API</label>
                    <input
                      type="text"
                      required
                      placeholder="+52 442 000 0000"
                      value={waNumber}
                      onChange={(e) => setWaNumber(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Cuota Mensual Contratada (MXN)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="500"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Sección 2: Credenciales de Acceso Autorizadas */}
              <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="font-mono text-[11px] font-bold text-violet-400 uppercase flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> 2. Credenciales Autorizadas para el Cliente
                </span>

                <div>
                  <label className="text-slate-400 block mb-1">Nombre del Responsable / Contacto</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Dr. Armando Garza"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Correo de Acceso (Usuario)</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@hospital.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Contraseña Asignada</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Hospital2026!"
                      value={contactPassword}
                      onChange={(e) => setContactPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewTenantModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-violet-600/30 transition flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dar de Alta &amp; Activar Acceso</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ÉXITO: Credenciales Creadas */}
      {createdSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="apple-glass-card rounded-3xl max-w-md w-full p-6 text-center space-y-4 border border-emerald-500/30 bg-[#0d141a]">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white">¡Cliente Dado de Alta Exitosamente!</h3>
            <p className="text-xs text-slate-300">
              La empresa <strong className="text-white">{createdSuccessModal.tenant.name}</strong> y sus credenciales están listas para operar.
            </p>

            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-left space-y-2 text-xs font-mono">
              <div className="text-slate-400 text-[10px] uppercase tracking-wider">Credenciales para entregar al cliente:</div>
              <div className="text-slate-300">
                <span className="text-slate-500">Empresa:</span> {createdSuccessModal.tenant.name}
              </div>
              <div className="text-cyan-300">
                <span className="text-slate-500">Correo:</span> {createdSuccessModal.user.email}
              </div>
              <div className="text-emerald-300">
                <span className="text-slate-500">Contraseña:</span> {createdSuccessModal.user.password}
              </div>
              <div className="text-slate-300">
                <span className="text-slate-500">Portal:</span> https://valentina-ai.mx (Acceso Clientes)
              </div>
            </div>

            <button
              onClick={() => setCreatedSuccessModal(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
            >
              Entendido &amp; Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Supabase SQL Blueprint */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="apple-glass-card rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-violet-400" />
                <h3 className="text-sm font-bold text-white">Esquema SQL Multi-Tenant con Row Level Security (RLS)</h3>
              </div>
              <button onClick={() => setShowSqlModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Este script crea las tablas multi-tenant en PostgreSQL con políticas de **Row Level Security (RLS)** para garantizar aislamiento absoluto entre clientes al costo base de $0 USD en Supabase.
            </p>

            <div className="relative flex-1 overflow-hidden rounded-xl bg-black/60 border border-white/[0.08] p-3">
              <button
                onClick={copySql}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition"
              >
                {copiedSql ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
              </button>
              <pre className="text-[11px] font-mono text-violet-200 overflow-y-auto max-h-[340px] pr-12 leading-relaxed">
                {supabaseSqlSchema}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
