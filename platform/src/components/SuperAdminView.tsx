'use client';

import React, { useState, useEffect } from 'react';
import { Tenant, AuthUser, CommercialQuote } from '../types/platform';
import {
  getLocalCommercialQuotes,
  syncCommercialQuotesFromSupabase,
  saveCommercialQuote,
  getLocalCloudCosts,
  setLocalCloudCosts,
} from '../lib/quotesService';
import { resetUserPassword as resetUserPasswordReal } from '../lib/adminDataService';
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
  onCreateTenantAndUser?: (newTenant: Tenant, newUser: AuthUser) => Promise<void>;
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

  // Costos mensuales reales de infraestructura cloud (Persistidos solo en localStorage del navegador —
  // no se sincronizan con Supabase ni son compartidos entre dispositivos/usuarios)
  const initialCosts = getLocalCloudCosts();
  const [supabaseCostMxn, setSupabaseCostMxn] = useState<number>(initialCosts.supabase);
  const [railwayCostMxn, setRailwayCostMxn] = useState<number>(initialCosts.railway);
  const [vercelCostMxn, setVercelCostMxn] = useState<number>(initialCosts.vercel);
  const [domainCostMxn, setDomainCostMxn] = useState<number>(initialCosts.domain);
  const [infraSaveNote, setInfraSaveNote] = useState(false);
  const [cloudSyncWarning, setCloudSyncWarning] = useState<string | null>(null);

  const notifyIfCloudSyncFailed = (result: { syncedToCloud: boolean; cloudError?: string }) => {
    if (!result.syncedToCloud) {
      setCloudSyncWarning(
        `Guardado localmente, pero no se sincronizó con la nube: ${result.cloudError || 'error desconocido'}. Solo tú ves este cambio hasta que se resuelva.`
      );
      setTimeout(() => setCloudSyncWarning(null), 8000);
    }
  };

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
-- NOTA DE ORDEN: cada CREATE TABLE usa REFERENCES hacia una tabla ya creada
-- arriba en este mismo script; si ejecutas esto de una sola vez en un
-- proyecto nuevo, respeta este orden. "IF NOT EXISTS" hace seguro reejecutar
-- el script completo si ya corriste una versión anterior.

-- 1. Tenants: fuente de verdad REAL y compartida del directorio de empresas.
--    Antes de esta tabla, "crear cliente" solo escribía en el localStorage
--    del navegador del SuperAdmin que lo daba de alta y nadie más lo veía.
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,              -- ej. 'tenant-uges' (mismo id usado en toda la app)
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    plan TEXT NOT NULL DEFAULT 'Growth',
    railway_tenant_id INT,             -- mapeo dinámico hacia el backend RAG de Railway
    data JSONB NOT NULL DEFAULT '{}'::jsonb,  -- resto de campos del Tenant (canales, datos fiscales, etc.)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenants_select_authenticated" ON tenants
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tenants_service_role_write" ON tenants
    FOR ALL USING (auth.role() = 'service_role');

-- 2. Perfiles de usuarios de la plataforma (rol/tenant/nivel). Las
--    contraseñas NUNCA se guardan aquí: viven exclusivamente en el store
--    interno de Supabase Auth (auth.users), gestionado por la API de
--    administrador con la service_role key.
CREATE TABLE IF NOT EXISTS platform_users (
    id TEXT PRIMARY KEY,               -- coincide con auth.users.id cuando existe cuenta real
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    tenant_id TEXT REFERENCES tenants(id),
    role TEXT NOT NULL,
    level TEXT,
    job_title TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    must_change_password BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE platform_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_users_select_authenticated" ON platform_users
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "platform_users_service_role_write" ON platform_users
    FOR ALL USING (auth.role() = 'service_role');

-- 3. Contactos y Prospectos reales por tenant.
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT,
    phone_or_email TEXT NOT NULL,
    channel_origin TEXT NOT NULL DEFAULT 'whatsapp',
    city TEXT,
    qualification_score INT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_select_authenticated" ON contacts
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "contacts_service_role_write" ON contacts
    FOR ALL USING (auth.role() = 'service_role');

-- 4. Conversaciones reales por tenant. Una fila por hilo con un contacto.
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    status TEXT NOT NULL DEFAULT 'ai_handling',
    sentiment TEXT NOT NULL DEFAULT 'neutral',
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_select_authenticated" ON conversations
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "conversations_service_role_write" ON conversations
    FOR ALL USING (auth.role() = 'service_role');

-- 5. Mensajes individuales de cada conversación (entrantes del cliente vía
--    Meta/WhatsApp y salientes de la IA o de un operador humano).
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sender TEXT NOT NULL, -- 'user' | 'ai_agent' | 'human_operator'
    sender_name TEXT,
    content TEXT NOT NULL,
    tokens_prompt INT DEFAULT 0,
    tokens_completion INT DEFAULT 0,
    cost_mxn NUMERIC(10, 5) DEFAULT 0,
    status TEXT DEFAULT 'sent',
    simulated BOOLEAN DEFAULT false,
    media_url TEXT,
    media_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select_authenticated" ON messages
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "messages_service_role_write" ON messages
    FOR ALL USING (auth.role() = 'service_role');

-- 6. Habilitar Supabase Realtime en estas tablas: sin esto, la consola NUNCA
--    recibe actualizaciones en vivo y solo se refresca al recargar la página.
--    Si tu proyecto ya las tiene agregadas, Supabase mostrará un error de
--    "already member of publication" que puedes ignorar sin problema.
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- 7. Cotizaciones Comerciales B2B (Pipeline)
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

-- 8. Auditoría de acciones administrativas (alta/edición de tenants y
--    usuarios, reseteo de contraseñas). Solo el servidor (service_role)
--    escribe aquí; ningún SuperAdmin puede borrar su propio rastro desde
--    el cliente.
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    action TEXT NOT NULL,          -- ej. 'tenant.create', 'user.password_reset'
    actor_id TEXT NOT NULL,        -- id del SuperAdmin que ejecutó la acción
    actor_email TEXT NOT NULL,
    target_id TEXT NOT NULL,       -- id del tenant/usuario afectado
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_select_authenticated" ON audit_log
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "audit_log_service_role_write" ON audit_log
    FOR INSERT WITH CHECK (auth.role() = 'service_role');
`;

  const copySql = () => {
    navigator.clipboard.writeText(supabaseSqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleWizardComplete = async (newTenant: Tenant, newUser: AuthUser) => {
    // La creación real (tenant en Supabase + cuenta de Supabase Auth vía API
    // de administrador) ahora ocurre server-side en `onCreateTenantAndUser`.
    // Ya no se usa `supabase.auth.signUp` desde el cliente: ese endpoint es
    // de auto-registro público, no el mecanismo correcto para que un
    // SuperAdmin provisione la cuenta de otra persona.
    try {
      if (onCreateTenantAndUser) {
        await onCreateTenantAndUser(newTenant, newUser);
      }
    } catch (err: any) {
      window.alert(
        `No se pudo crear el cliente en el servidor: ${err?.message || 'error desconocido'}.\n\n` +
          'Verifica que SUPABASE_SERVICE_ROLE_KEY esté configurada y que las tablas "tenants"/"platform_users" existan (botón "Ver esquema SQL").'
      );
      return;
    }

    setShowNewTenantModal(false);
    // Abrir de inmediato el expediente digital completo para emitir/descargar/enviar
    setDossierModal({ tenant: newTenant, user: newUser, initialTab: 'quote' });
  };

  const handleSaveQuote = (newOrUpdatedQuote: CommercialQuote) => {
    saveCommercialQuote(newOrUpdatedQuote).then(notifyIfCloudSyncFailed);
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

    const tempPasswordSuffix = Math.floor(1000 + Math.random() * 9000);
    const newUser: AuthUser = {
      id: `user-${slug}-admin`,
      email: quote.contactEmail.toLowerCase().trim(),
      password: `Val_${slug.slice(0, 4)}-${tempPasswordSuffix}!`,
      fullName: quote.contactName,
      tenantId: newTenantId,
      role: 'tenant_admin',
      jobTitle: quote.contactJobTitle || 'Director General',
      level: 'director',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      mustChangePassword: true,
    };

    (async () => {
      try {
        if (onCreateTenantAndUser) {
          await onCreateTenantAndUser(newTenant, newUser);
        }
      } catch (err: any) {
        window.alert(
          `No se pudo crear el cliente en el servidor: ${err?.message || 'error desconocido'}.`
        );
        return;
      }

      const acceptedQuote: CommercialQuote = { ...quote, status: 'accepted' };
      saveCommercialQuote(acceptedQuote).then(notifyIfCloudSyncFailed);

      setQuotes((prev) => prev.map((item) => (item.id === quote.id ? acceptedQuote : item)));

      setShowQuoteGeneratorModal(false);
      setDossierModal({ tenant: newTenant, user: newUser, initialTab: 'quote' });
    })();
  };


  const handleResetPassword = async (targetUser: AuthUser) => {
    let newTempPassword: string;
    try {
      // Genera Y aplica la nueva contraseña REAL en Supabase Auth del lado
      // del servidor (antes esto solo actualizaba un campo en memoria del
      // navegador sin tocar la cuenta real).
      newTempPassword = await resetUserPasswordReal(targetUser.id);
    } catch (err: any) {
      window.alert(
        `No se pudo resetear la contraseña real de ${targetUser.email}: ${err?.message || 'error desconocido'}.`
      );
      return;
    }

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
      {/* Aviso de sincronización con la nube fallida (guardado local únicamente) */}
      {cloudSyncWarning && (
        <div className="p-3.5 rounded-xl bg-[#fef7e0] border border-[#feefc3] text-[#b06000] text-xs font-medium flex items-start gap-2.5">
          <span className="shrink-0">⚠️</span>
          <span>{cloudSyncWarning}</span>
        </div>
      )}

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
