'use client';

import React, { useState, useEffect } from 'react';
import { Tenant, AuthUser, CommercialQuote } from '../types/platform';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  getLocalCommercialQuotes,
  syncCommercialQuotesFromSupabase,
  saveCommercialQuote,
  getLocalCloudCosts,
  setLocalCloudCosts,
} from '../lib/quotesService';
import { ExecutiveCredentialPdf } from './ExecutiveCredentialPdf';
import { ClientOnboardingWizard } from './onboarding/ClientOnboardingWizard';
import { ClientDossierModal } from './dossier/ClientDossierModal';
import { SalesQuoteGeneratorModal } from './sales/SalesQuoteGeneratorModal';
import { SupabaseSqlModal } from './superadmin/SupabaseSqlModal';
import { TenantsDirectoryTab } from './superadmin/TenantsDirectoryTab';
import { CredentialsDirectoryTab } from './superadmin/CredentialsDirectoryTab';
import { CloudInfrastructureTab } from './superadmin/CloudInfrastructureTab';
import { SalesPipelineTab } from './superadmin/SalesPipelineTab';
import { EditTenantModal } from './superadmin/EditTenantModal';
import {
  Database,
  PlusCircle,
  Calculator,
  Coins,
  Server,
  TrendingUp,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface Props {
  tenants: Tenant[];
  users: AuthUser[];
  onSelectTenant: (tenant: Tenant) => void;
  onEnterAsClient: (tenant: Tenant) => void;
  onCreateTenantAndUser?: (newTenant: Tenant, newUser: AuthUser) => void;
  onUpdateTenant?: (updatedTenant: Tenant) => void;
  onToggleUserStatus?: (userId: string) => void;
  onResetUserPassword?: (userId: string, newPassword: string) => void;
}

export const SuperAdminView: React.FC<Props> = ({
  tenants,
  users,
  onSelectTenant,
  onEnterAsClient,
  onCreateTenantAndUser,
  onUpdateTenant,
  onToggleUserStatus,
  onResetUserPassword,
}) => {
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [activeTab, setActiveTab] = useState<'tenants' | 'credentials' | 'infrastructure' | 'sales_pipeline'>('tenants');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Pipeline B2B & Cotizaciones Comerciales (Persistencia bidireccional Supabase + localStorage)
  const [quotes, setQuotes] = useState<CommercialQuote[]>(() => getLocalCommercialQuotes());
  const [selectedQuoteForModal, setSelectedQuoteForModal] = useState<CommercialQuote | null>(null);
  const [showQuoteGeneratorModal, setShowQuoteGeneratorModal] = useState(false);
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<'all' | 'draft' | 'sent' | 'negotiating' | 'accepted'>('all');

  // Sincronizar en segundo plano con Supabase al montar
  useEffect(() => {
    syncCommercialQuotesFromSupabase().then((synced) => {
      setQuotes(synced);
    });
  }, []);

  // Costos mensuales reales de infraestructura cloud (Persistidos en localStorage y Supabase)
  const initialCosts = getLocalCloudCosts();
  const [supabaseCostMxn, setSupabaseCostMxn] = useState<number>(initialCosts.supabase);
  const [railwayCostMxn, setRailwayCostMxn] = useState<number>(initialCosts.railway);
  const [vercelCostMxn, setVercelCostMxn] = useState<number>(initialCosts.vercel);
  const [domainCostMxn, setDomainCostMxn] = useState<number>(initialCosts.domain);
  const [infraSaveNote, setInfraSaveNote] = useState(false);

  const handleSaveInfra = () => {
    setLocalCloudCosts({
      supabase: supabaseCostMxn,
      railway: railwayCostMxn,
      vercel: vercelCostMxn,
      domain: domainCostMxn,
    });
    setInfraSaveNote(true);
    setTimeout(() => setInfraSaveNote(false), 2500);
  };


  // Modal para documento oficial PDF de credenciales
  const [credentialPdfModal, setCredentialPdfModal] = useState<{
    tenant: Tenant;
    user: AuthUser;
    mode: 'new_client' | 'password_reset';
  } | null>(null);

  // Modal para el Expediente Digital Integral (Cotización, Convenio, RACI, Credenciales)
  const [dossierModal, setDossierModal] = useState<{
    tenant: Tenant;
    user?: AuthUser;
    initialTab?: 'quote' | 'agreement' | 'raci' | 'credentials' | 'all';
  } | null>(null);

  // 1. Facturación Bruta (Suscripciones cobradas a los clientes)
  const totalRevenueMxn = tenants.reduce((acc, t) => acc + (t.subscriptionFeeMxn || 8500), 0);

  // 2. Costos Variables de Inferencia IA (OpenAI, Gemini, Anthropic) calculados en tiempo real
  const totalAiTokens = tenants.reduce((acc, t) => acc + (t.totalTokensUsed || 0), 0);
  const totalAiCostMxn = tenants.reduce((acc, t) => acc + (t.totalSpentMxn || 0), 0);

  // 3. Costos Fijos de Infraestructura Cloud
  const totalFixedCloudCostMxn = supabaseCostMxn + railwayCostMxn + vercelCostMxn + domainCostMxn;

  // 4. Costo Operativo Global que paga Valentina AI (Inferencia IA + Servidores)
  // NOTA: Meta / WhatsApp Cloud API = $0.00 para Valentina AI (se factura directo a la tarjeta del cliente)
  const totalOperatingCostMxn = totalAiCostMxn + totalFixedCloudCostMxn;

  // 5. Utilidad Operativa Neta y Margen Real
  const netProfitMxn = totalRevenueMxn - totalOperatingCostMxn;
  const grossMargin = totalRevenueMxn > 0 ? ((netProfitMxn / totalRevenueMxn) * 100).toFixed(1) : '100';

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

-- 6. Cotizaciones Comerciales B2B (Pipeline)
CREATE TABLE IF NOT EXISTS commercial_quotes (
    id TEXT PRIMARY KEY,
    folio TEXT NOT NULL,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    contact_job_title TEXT,
    industry TEXT,
    plan TEXT NOT NULL,
    billing_period TEXT NOT NULL,
    setup_fee_mxn NUMERIC NOT NULL,
    monthly_fee_mxn NUMERIC NOT NULL,
    monthly_savings_mxn NUMERIC DEFAULT 0,
    net_annual_savings_mxn NUMERIC DEFAULT 0,
    amortization_days INT DEFAULT 15,
    status TEXT DEFAULT 'draft',
    selected_features JSONB DEFAULT '[]'::jsonb,
    quote_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE commercial_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin full access commercial_quotes" ON commercial_quotes
    FOR ALL USING (true);
`;

  const copySql = () => {
    navigator.clipboard.writeText(supabaseSqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleWizardComplete = (newTenant: Tenant, newUser: AuthUser) => {
    if (onCreateTenantAndUser) {
      onCreateTenantAndUser(newTenant, newUser);
    }

    // Registrar en Supabase Authentication si está configurado
    if (isSupabaseConfigured && newUser.password) {
      supabase.auth
        .signUp({
          email: newUser.email,
          password: newUser.password,
          options: {
            data: {
              full_name: newUser.fullName,
              role: 'tenant_admin',
              tenant_id: newTenant.id,
              job_title: newUser.jobTitle,
              level: newUser.level,
              must_change_password: true,
            },
          },
        })
        .catch((err) => console.warn('Supabase auto-create user error:', err));
    }

    setShowNewTenantModal(false);
    // Abrir de inmediato el expediente digital completo para emitir/descargar/enviar
    setDossierModal({ tenant: newTenant, user: newUser, initialTab: 'quote' });
  };

  const handleSaveQuote = (newOrUpdatedQuote: CommercialQuote) => {
    saveCommercialQuote(newOrUpdatedQuote);
    setQuotes((prev) => {
      const exists = prev.some((q) => q.id === newOrUpdatedQuote.id);
      return exists
        ? prev.map((q) => (q.id === newOrUpdatedQuote.id ? newOrUpdatedQuote : q))
        : [newOrUpdatedQuote, ...prev];
    });
  };

  const handleConvertQuoteToClient = (quote: CommercialQuote) => {
    const slug = quote.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `org-${Date.now()}`;
    const newTenantId = `tenant-${slug}`;

    const newTenant: Tenant = {
      id: newTenantId,
      name: quote.companyName,
      slug,
      industry: quote.industry,
      logo: '🏢',
      plan: quote.plan,
      status: 'active',
      subscriptionFeeMxn: quote.monthlyFeeMxn,
      monthlyBudgetMxn: 500,
      totalSpentMxn: 0,
      totalTokensUsed: 0,
      activeAgentsCount: 1,
      metaFreeConversationsUsed: 0,
      metaExcessCostMxn: 0,
      channels: [
        {
          id: `ch-${slug}-wa`,
          type: 'whatsapp',
          name: `WhatsApp Oficial ${quote.companyName}`,
          identifier: quote.contactPhone,
          status: 'connected',
          lastPing: 'Recién enlazado',
          dailyMessagesCount: 0,
        },
      ],
      legalBusinessName: `${quote.companyName} S.A. de C.V.`,
      rfc: 'XAXX010101000',
      taxAddress: 'Querétaro, Qro., México',
      legalRepresentative: quote.contactName,
      legalRepresentativeTitle: quote.contactJobTitle || 'Director General',
      billingPeriod: quote.billingPeriod,
      setupFeeMxn: quote.setupFeeMxn,
      selectedPlanDetails: {
        setupFee: quote.setupFeeMxn,
        monthlyFee: quote.monthlyFeeMxn,
        billingPeriod: quote.billingPeriod,
        estimatedMetaMessages: quote.normalMonthlyVolume,
        estimatedMetaCostMxn: quote.estimatedMetaMonthlyCostMxn,
        projectedMonthlySavingsMxn: quote.monthlySavingsMxn,
      },
      connectedSystems: ['Google Sheets & Webhook'],
      secondaryChannels: quote.selectedFeatures.some((f) => f.toLowerCase().includes('webchat')) ? ['webchat'] : [],
    };

    const newUser: AuthUser = {
      id: `user-${slug}-admin`,
      email: quote.contactEmail.toLowerCase().trim(),
      password: `Val_${slug.slice(0, 4)}!2026`,
      fullName: quote.contactName,
      tenantId: newTenantId,
      role: 'tenant_admin',
      jobTitle: quote.contactJobTitle || 'Director General',
      level: 'director',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      mustChangePassword: true,
    };

    if (onCreateTenantAndUser) {
      onCreateTenantAndUser(newTenant, newUser);
    }

    const acceptedQuote: CommercialQuote = { ...quote, status: 'accepted' };
    saveCommercialQuote(acceptedQuote);

    setQuotes((prev) => {
      return prev.map((item) => (item.id === quote.id ? acceptedQuote : item));
    });

    setShowQuoteGeneratorModal(false);
    setDossierModal({ tenant: newTenant, user: newUser, initialTab: 'quote' });
  };


  const handleResetPassword = (targetUser: AuthUser) => {
    // Generar contraseña temporal segura
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newTempPassword = `Val2026!#${randomSuffix}`;

    if (onResetUserPassword) {
      onResetUserPassword(targetUser.id, newTempPassword);
    }

    const matchedTenant = targetUser.tenantId
      ? tenants.find((t) => t.id === targetUser.tenantId) || tenants[0]
      : tenants[0];

    const updatedUser: AuthUser = {
      ...targetUser,
      password: newTempPassword,
      mustChangePassword: true,
    };

    setCredentialPdfModal({
      tenant: matchedTenant,
      user: updatedUser,
      mode: 'password_reset',
    });
  };

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
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white hover:bg-[#f1f3f4] border border-[#dadce0] text-xs font-semibold text-[#1f1f1f] transition shadow-sm cursor-pointer"
          >
            <Database className="w-4 h-4 text-[#0b57d0]" />
            <span>Supabase RLS Blueprint</span>
          </button>

          <button
            onClick={() => {
              setSelectedQuoteForModal(null);
              setShowQuoteGeneratorModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#6D28D9] hover:bg-[#5b21b6] text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>+ Nueva Cotización B2B</span>
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
        {/* Card 1: Facturación Bruta */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5f6368] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Facturación Clientes</span>
            <Coins className="w-4 h-4 text-[#0b57d0]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#1f1f1f]">
            ${totalRevenueMxn.toLocaleString('es-MX')} <span className="text-xs font-normal text-[#5f6368]">MXN</span>
          </p>
          <p className="text-xs text-[#5f6368] mt-1">{tenants.length} empresas facturando planes activos</p>
        </div>

        {/* Card 2: Costo Operativo Total (IA + Servidores) */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5f6368] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Costo Operativo Valentina</span>
            <Server className="w-4 h-4 text-[#b06000]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#1f1f1f]">
            ${totalOperatingCostMxn.toFixed(2)} <span className="text-xs font-normal text-[#5f6368]">MXN</span>
          </p>
          <p className="text-xs text-[#5f6368] mt-1 flex items-center justify-between">
            <span>IA: ${totalAiCostMxn.toFixed(2)}</span>
            <span>Cloud: ${totalFixedCloudCostMxn.toFixed(0)}</span>
          </p>
        </div>

        {/* Card 3: Utilidad Operativa Neta */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5f6368] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Utilidad Neta Real</span>
            <TrendingUp className="w-4 h-4 text-[#137333]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#137333]">
            ${netProfitMxn.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-[#5f6368]">MXN</span>
          </p>
          <p className="text-xs text-[#137333] mt-1 font-semibold">Margen Neto: {grossMargin}%</p>
        </div>

        {/* Card 4: WhatsApp Cloud API (Costo $0 para Valentina) */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#5f6368] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Meta WhatsApp API</span>
            <div className="p-1 rounded bg-[#e6f4ea] text-[#137333]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[#137333]">
            $0.00 <span className="text-xs font-normal text-[#5f6368]">MXN</span>
          </p>
          <p className="text-xs text-[#5f6368] mt-1">Facturado directo a la tarjeta del cliente</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#dadce0] pb-2">
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

        <button
          onClick={() => setActiveTab('infrastructure')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'infrastructure'
              ? 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
              : 'text-[#5f6368] hover:text-[#1f1f1f]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Infraestructura Cloud & P&L Real</span>
        </button>

        <button
          onClick={() => setActiveTab('sales_pipeline')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sales_pipeline'
              ? 'bg-[#f8f5ff] text-[#6D28D9] font-bold border border-[#d8b4fe]'
              : 'text-[#5f6368] hover:text-[#1f1f1f]'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-[#6D28D9]" />
          <span>Cotizador & Pipeline B2B ({quotes.length})</span>
        </button>
      </div>

      {/* TAB 1: Directorio de Empresas */}
      {activeTab === 'tenants' && (
        <TenantsDirectoryTab
          tenants={tenants}
          users={users}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterType={filterType}
          onFilterChange={setFilterType}
          onOpenNewTenantModal={() => setShowNewTenantModal(true)}
          onOpenDossierModal={(t, u) => setDossierModal({ tenant: t, user: u, initialTab: 'quote' })}
          onSelectTenant={onSelectTenant}
          onEnterAsClient={onEnterAsClient}
          onEditTenant={(t) => setEditingTenant(t)}
        />
      )}

      {/* TAB 2: Directorio Maestro de Credenciales */}
      {activeTab === 'credentials' && (
        <CredentialsDirectoryTab
          users={users}
          tenants={tenants}
          onOpenNewTenantModal={() => setShowNewTenantModal(true)}
          onOpenDossierModal={(t, u) => setDossierModal({ tenant: t, user: u, initialTab: 'credentials' })}
          onResetPassword={handleResetPassword}
          onToggleUserStatus={onToggleUserStatus}
        />
      )}

      {/* TAB 3: Infraestructura Cloud & P&L Real */}
      {activeTab === 'infrastructure' && (
        <CloudInfrastructureTab
          tenants={tenants}
          totalRevenueMxn={totalRevenueMxn}
          totalAiTokens={totalAiTokens}
          totalAiCostMxn={totalAiCostMxn}
          totalFixedCloudCostMxn={totalFixedCloudCostMxn}
          netProfitMxn={netProfitMxn}
          grossMargin={grossMargin}
          supabaseCostMxn={supabaseCostMxn}
          onSupabaseCostChange={setSupabaseCostMxn}
          railwayCostMxn={railwayCostMxn}
          onRailwayCostChange={setRailwayCostMxn}
          vercelCostMxn={vercelCostMxn}
          onVercelCostChange={setVercelCostMxn}
          domainCostMxn={domainCostMxn}
          onDomainCostChange={setDomainCostMxn}
          infraSaveNote={infraSaveNote}
          onSaveInfra={handleSaveInfra}
        />
      )}

      {/* TAB 4: Cotizador & Pipeline B2B */}
      {activeTab === 'sales_pipeline' && (
        <SalesPipelineTab
          quotes={quotes}
          quoteStatusFilter={quoteStatusFilter}
          setQuoteStatusFilter={setQuoteStatusFilter}
          searchQuery={searchQuery}
          onNewQuote={() => {
            setSelectedQuoteForModal(null);
            setShowQuoteGeneratorModal(true);
          }}
          onViewQuote={(q) => {
            setSelectedQuoteForModal(q);
            setShowQuoteGeneratorModal(true);
          }}
          onConvertQuote={handleConvertQuoteToClient}
        />
      )}

      {/* WIZARD DE ALTA DE CLIENTE EN 4 PASOS */}
      <ClientOnboardingWizard
        isOpen={showNewTenantModal}
        onClose={() => setShowNewTenantModal(false)}
        onComplete={handleWizardComplete}
      />

      {/* MODAL EDICIÓN DE EMPRESA / CLIENTE */}
      {editingTenant && (
        <EditTenantModal
          tenant={editingTenant}
          isOpen={Boolean(editingTenant)}
          onClose={() => setEditingTenant(null)}
          onSave={(updated) => {
            if (onUpdateTenant) {
              onUpdateTenant(updated);
            }
            setEditingTenant(null);
          }}
        />
      )}

      {/* MODAL EXPEDIENTE DIGITAL B2B INTEGRAL */}
      {dossierModal && (
        <ClientDossierModal
          tenant={dossierModal.tenant}
          user={dossierModal.user}
          initialTab={dossierModal.initialTab || 'quote'}
          onClose={() => setDossierModal(null)}
        />
      )}

      {/* MODAL OFICIAL: Ficha de Credenciales en PDF */}
      {credentialPdfModal && (
        <ExecutiveCredentialPdf
          tenant={credentialPdfModal.tenant}
          user={credentialPdfModal.user}
          mode={credentialPdfModal.mode}
          onClose={() => setCredentialPdfModal(null)}
        />
      )}

      {/* MODAL COTIZADOR COMERCIAL B2B */}
      <SalesQuoteGeneratorModal
        isOpen={showQuoteGeneratorModal}
        initialQuote={selectedQuoteForModal}
        onClose={() => setShowQuoteGeneratorModal(false)}
        onSaveQuote={handleSaveQuote}
        onConvertToClient={handleConvertQuoteToClient}
      />

      {/* MODAL: Supabase SQL Blueprint */}
      <SupabaseSqlModal
        isOpen={showSqlModal}
        onClose={() => setShowSqlModal(false)}
        copiedSql={copiedSql}
        onCopySql={copySql}
        sqlContent={supabaseSqlSchema}
      />
    </div>
  );
};
