'use client';

import React, { useState } from 'react';
import { Tenant } from '../types/platform';
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
} from 'lucide-react';

interface Props {
  tenants: Tenant[];
  onSelectTenant: (tenant: Tenant) => void;
  onEnterAsClient: (tenant: Tenant) => void;
}

export const SuperAdminView: React.FC<Props> = ({ tenants, onSelectTenant, onEnterAsClient }) => {
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantIndustry, setNewTenantIndustry] = useState('');
  const [newTenantWa, setNewTenantWa] = useState('');

  // Financial aggregates
  const totalRevenueMxn = tenants.reduce((acc, t) => acc + t.monthlyBudgetMxn, 0);
  const totalCostMxn = tenants.reduce((acc, t) => acc + t.totalSpentMxn, 0);
  const netProfitMxn = totalRevenueMxn - totalCostMxn;
  const grossMargin = Math.round((netProfitMxn / totalRevenueMxn) * 100);

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
    channel_type TEXT NOT NULL, -- 'whatsapp', 'web'
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
              Gestión global de flotas multi-tenant, costos de API y márgenes de utilidad
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
            <span>Nuevo Cliente Tenant</span>
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
          <p className="text-[11px] text-slate-400 mt-1">Railway + Supabase + Gemini 2.0</p>
        </div>

        <div className="apple-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Utilidad Neta</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-emerald-400">
            ${netProfitMxn.toLocaleString('es-MX')} <span className="text-xs font-normal text-slate-400">MXN</span>
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-1 font-mono font-bold">Margen bruto: {grossMargin}%</p>
        </div>

        <div className="apple-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Infraestructura Base</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-cyan-400">
            $0.00 <span className="text-xs font-normal text-slate-400">fijo</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">100% arquitectura Serverless &amp; RLS</p>
        </div>
      </div>

      {/* Tenants Table */}
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
                const margin = Math.round((profit / t.monthlyBudgetMxn) * 100);
                const waChannel = t.channels.find((c) => c.type === 'whatsapp');

                return (
                  <tr key={t.id} className="hover:bg-white/[0.03] transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">{t.logo}</span>
                        <div>
                          <p className="font-bold text-white text-xs">{t.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{t.slug}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-slate-300">
                      {waChannel ? (
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-violet-600 text-white font-medium transition"
                      >
                        <span>Abrir Portal</span>
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

      {/* MODAL: Supabase SQL Blueprint */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="apple-glass-card rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-violet-400" />
                <h3 className="text-base font-bold text-white">Supabase Multi-Tenant SQL Schema</h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Cerrar
              </button>
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

      {/* MODAL: Nuevo Tenant */}
      {showNewTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="apple-glass-card rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white">Dar de Alta Nuevo Cliente Tenant</h3>
              <button onClick={() => setShowNewTenantModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(`Cliente "${newTenantName}" configurado en el cluster.`);
                setShowNewTenantModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="text-slate-400 block mb-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Hospital Ángeles Dental"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Giro / Industria</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Odontología & Ortodoncia"
                  value={newTenantIndustry}
                  onChange={(e) => setNewTenantIndustry(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Número de WhatsApp Cloud API</label>
                <input
                  type="text"
                  required
                  placeholder="+52 55 0000 0000"
                  value={newTenantWa}
                  onChange={(e) => setNewTenantWa(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTenantModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold"
                >
                  Crear Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
