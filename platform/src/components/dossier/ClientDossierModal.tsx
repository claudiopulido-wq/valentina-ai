'use client';

import React, { useState } from 'react';
import { Tenant, AuthUser } from '../../types/platform';
import { ExecutiveQuoteSheet } from './ExecutiveQuoteSheet';
import { ExecutiveAgreementSheet } from './ExecutiveAgreementSheet';
import { ExecutiveRaciSheet } from './ExecutiveRaciSheet';
import { ExecutiveCredentialSheet } from './ExecutiveCredentialSheet';
import {
  Printer,
  Copy,
  CheckCircle,
  X,
  FileText,
  FileSpreadsheet,
  CheckSquare,
  Key,
  Layers,
  Send,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface Props {
  tenant: Tenant;
  user?: AuthUser;
  initialTab?: 'quote' | 'agreement' | 'raci' | 'credentials' | 'all';
  onClose: () => void;
}

type TabType = 'quote' | 'agreement' | 'raci' | 'credentials' | 'all';

export const ClientDossierModal: React.FC<Props> = ({
  tenant,
  user,
  initialTab = 'quote',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [simulatedWebhookSent, setSimulatedWebhookSent] = useState(false);

  // Fallback de usuario si no se suministra directamente
  const effectiveUser: AuthUser = user || {
    id: `user-${tenant.slug}-admin`,
    email: `director@${tenant.slug}.com`,
    password: `Val_${tenant.slug.slice(0, 4)}!2026`,
    fullName: tenant.legalRepresentative || `${tenant.name} Administrador`,
    tenantId: tenant.id,
    role: 'tenant_admin',
    jobTitle: tenant.legalRepresentativeTitle || 'Director General',
    level: 'director',
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
  };

  const handlePrint = () => {
    window.print();
  };

  const generateWelcomeEmail = () => {
    const accessUrl = typeof window !== 'undefined' ? window.location.origin : 'https://valentina-ai.mx';
    const planName = tenant.plan || 'Scale';
    const clientName = tenant.legalBusinessName || tenant.name;

    return `Asunto: Bienvenido a Valentina AI — Expediente Digital Oficial & Credenciales de Acceso: ${clientName}

Estimado/a ${effectiveUser.fullName},

En nombre de todo el equipo de ingeniería de Valentina AI, le damos la más cordial bienvenida a nuestra infraestructura de Inteligencia Artificial Enterprise.

Hemos generado y emitido de forma automatizada su Expediente Digital de Incorporación oficial, el cual incluye los siguientes 4 instrumentos:

1. 📄 COTIZACIÓN FORMAL EJECUTIVA: Desglose de inversión, amortización proyectada en menos de 10 días (ROI estimado de +$39,600 MXN/mes) y costeo transparente de telecomunicaciones Meta.
2. 📄 CONVENIO COMERCIAL DE PRESTACIÓN DE SERVICIOS: Marco jurídico mercantil B2B con 8 cláusulas, delimitación de responsabilidades y soberanía total de datos (LFPDPPP).
3. 📄 ANEXO TÉCNICO A-01 (MATRIZ RACI & PRERREQUISITOS): Checklist de 4 insumos requeridos (línea WhatsApp, Business Manager con tarjeta y catálogos) con cronograma de despliegue de 10 a 21 días hábiles.
4. 📄 FICHA OFICIAL DE PROVISIÓN DE ACCESO: Credenciales institucionales para el ingreso a la consola de control.

=======================================================
DATOS DE ACCESO A SU CONSOLA DE ADMINISTRACIÓN:
=======================================================
• Portal Oficial: ${accessUrl}
• Correo Institucional: ${effectiveUser.email}
• Contraseña Temporal: ${effectiveUser.password || '•••••••• (Definida por el usuario)'}
• Plan Asignado: Plan ${planName} Enterprise

MEDIDA DE SEGURIDAD OBLIGATORIA:
Por protocolos de ciberseguridad, esta contraseña es estrictamente provisional. Al iniciar sesión por primera vez, el portal le solicitará definir obligatoriamente su clave definitiva y confidencial.

Puede descargar e imprimir su expediente completo en formato PDF o firmar digitalmente desde su consola.

Atentamente,
Equipo de Arquitectura & Operaciones
VALENTINA AI ENTERPRISE CLOUD
contacto@valentina-ai.mx • Querétaro, Qro., México
`;
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generateWelcomeEmail());
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleSimulateWebhook = () => {
    setSimulatedWebhookSent(true);
    setTimeout(() => setSimulatedWebhookSent(false), 4500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-[#f8f9fa] rounded-2xl max-w-5xl w-full border border-[#dadce0] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh] print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none print:max-h-none">
        
        {/* Barra de Herramientas Superior (Oculta al imprimir) */}
        <div className="px-4 sm:px-6 py-3.5 bg-white border-b border-[#dadce0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] text-[#0b57d0] flex items-center justify-center font-bold text-base shadow-xs">
              {tenant.logo || '📑'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1f1f1f]">
                  Expediente Digital B2B: {tenant.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6] font-semibold">
                  Generado Automáticamente
                </span>
              </div>
              <p className="text-[11px] text-[#5f6368]">
                {tenant.legalBusinessName || tenant.name} &bull; {tenant.plan} Enterprise &bull; {effectiveUser.fullName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSimulateWebhook}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f8f9fa] hover:bg-[#e8f0fe] text-[#0b57d0] border border-[#d3e3fd] text-xs font-semibold transition cursor-pointer shadow-xs"
              title="Disparar correos y notificación por API"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{simulatedWebhookSent ? '¡Notificación Disparada!' : 'Disparar por API'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] border border-[#dadce0] text-xs font-semibold transition cursor-pointer shadow-xs"
              title="Copiar texto formal para correo de bienvenida"
            >
              {copiedEmail ? <CheckCircle className="w-3.5 h-3.5 text-[#137333]" /> : <Copy className="w-3.5 h-3.5 text-[#5f6368]" />}
              <span>{copiedEmail ? '¡Copiado!' : 'Copiar Correo'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e0e2ec] transition cursor-pointer ml-1"
              title="Cerrar expediente"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notificación Flotante de Webhook Disparado */}
        {simulatedWebhookSent && (
          <div className="px-6 py-2.5 bg-[#e6f4ea] border-b border-[#ceead6] text-[#137333] text-xs font-medium flex items-center justify-between gap-3 animate-fadeIn print:hidden">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#137333] shrink-0" />
              <span>
                <strong>¡Expediente Despachado con Éxito!</strong> Correo transaccional enviado a <u>{effectiveUser.email}</u> (Resend API) y alerta operativa enviada al WhatsApp del equipo de ingeniería.
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#137333] bg-white px-2 py-0.5 rounded border border-[#ceead6]">
              STATUS 200 OK
            </span>
          </div>
        )}

        {/* Selector de Pestañas de Documentos (Oculto al imprimir) */}
        <div className="px-4 sm:px-6 py-2 bg-white border-b border-[#dadce0] flex items-center gap-1.5 overflow-x-auto print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('quote')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'quote'
                ? 'bg-[#e8f0fe] text-[#0b57d0] font-bold border border-[#d3e3fd]'
                : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1f1f1f]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>1. Cotización Formal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agreement')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'agreement'
                ? 'bg-[#e8f0fe] text-[#0b57d0] font-bold border border-[#d3e3fd]'
                : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1f1f1f]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>2. Convenio Legal B2B</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('raci')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'raci'
                ? 'bg-[#e8f0fe] text-[#0b57d0] font-bold border border-[#d3e3fd]'
                : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1f1f1f]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>3. Anexo RACI & Checklist</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'credentials'
                ? 'bg-[#e8f0fe] text-[#0b57d0] font-bold border border-[#d3e3fd]'
                : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1f1f1f]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>4. Ficha de Credenciales</span>
          </button>

          <div className="h-4 w-px bg-[#dadce0] mx-1"></div>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'all'
                ? 'bg-[#1f1f1f] text-white font-bold'
                : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1f1f1f]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>📚 Expediente Completo (4 Documentos)</span>
          </button>
        </div>

        {/* Visor de Documentos con Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 print:p-0 print:overflow-visible print:space-y-0">
          {activeTab === 'quote' && <ExecutiveQuoteSheet tenant={tenant} />}
          {activeTab === 'agreement' && <ExecutiveAgreementSheet tenant={tenant} />}
          {activeTab === 'raci' && <ExecutiveRaciSheet tenant={tenant} />}
          {activeTab === 'credentials' && (
            <ExecutiveCredentialSheet tenant={tenant} user={effectiveUser} />
          )}

          {activeTab === 'all' && (
            <div className="space-y-8 print:space-y-0">
              <div className="print:break-after-page mb-8">
                <ExecutiveQuoteSheet tenant={tenant} />
              </div>
              <div className="print:break-after-page mb-8">
                <ExecutiveAgreementSheet tenant={tenant} />
              </div>
              <div className="print:break-after-page mb-8">
                <ExecutiveRaciSheet tenant={tenant} />
              </div>
              <div className="print:break-after-page">
                <ExecutiveCredentialSheet tenant={tenant} user={effectiveUser} />
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal (Oculto al imprimir) */}
        <div className="px-6 py-3 bg-white border-t border-[#dadce0] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#5f6368] print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#137333]"></span>
            <span>
              Expediente digital listo para entrega. Cada documento está formateado para impresión oficial Letter/A4.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#1f1f1f] hover:bg-black text-white font-semibold transition cursor-pointer"
          >
            Cerrar Visor
          </button>
        </div>

      </div>
    </div>
  );
};
