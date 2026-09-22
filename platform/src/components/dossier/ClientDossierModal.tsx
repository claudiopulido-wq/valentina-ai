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
  AlertTriangle,
  History,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { sendDossierWelcomeEmail, logDossierEmission, fetchDossierEmissions, DossierEmission } from '../../lib/adminDataService';

interface Props {
  tenant: Tenant;
  user?: AuthUser;
  initialTab?: 'quote' | 'agreement' | 'raci' | 'credentials' | 'all';
  onClose: () => void;
  /** 'admin' (default): SuperAdmin viendo/gestionando el Expediente de un cliente. 'client': el propio Director dueño viendo su Expediente en modo solo lectura. */
  viewerContext?: 'admin' | 'client';
  /** Cuando es true, se renderiza sin el overlay fijo de modal -- para incrustarlo como contenido de un tab. */
  embedded?: boolean;
}

type TabType = 'quote' | 'agreement' | 'raci' | 'credentials' | 'all';

const ACTION_LABELS: Record<string, string> = {
  printed: 'Imprimió / descargó PDF',
  copied: 'Copió el correo',
  email_sent: 'Envió correo real',
};

const DOCUMENT_LABELS: Record<string, string> = {
  quote: 'Cotización',
  agreement: 'Convenio',
  raci: 'Anexo RACI',
  credentials: 'Credenciales',
  all: 'Expediente completo',
};

export const ClientDossierModal: React.FC<Props> = ({
  tenant,
  user,
  initialTab = 'quote',
  onClose,
  viewerContext = 'admin',
  embedded = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [emissions, setEmissions] = useState<DossierEmission[]>([]);

  const isAdminView = viewerContext === 'admin';

  // Antes, si no se pasaba un usuario real, aquí se inventaba uno completo
  // (correo `director@{slug}.com` y una contraseña adivinable
  // `Val_{slug}!2026`) que se mostraba como si fueran credenciales reales —
  // un cliente real jamás tuvo esa cuenta ni esa clave. Ahora se muestra el
  // estado honesto: no hay usuario vinculado todavía.
  const hasLinkedUser = Boolean(user);
  const displayName = user?.fullName || tenant.legalRepresentative || `${tenant.name} (sin usuario asignado)`;

  // Aviso de datos incompletos: si faltan estos campos, la Cotización y el
  // Convenio caen en números de plantilla genéricos por plan, sin avisar --
  // solo relevante para quien puede editarlos (SuperAdmin), no para el
  // cliente que solo puede leer su propio Expediente.
  const missingFields: string[] = [];
  if (!tenant.rfc) missingFields.push('RFC');
  if (!tenant.taxAddress) missingFields.push('Domicilio fiscal');
  if (!tenant.legalRepresentative) missingFields.push('Representante legal');
  if (tenant.setupFeeMxn == null && !tenant.selectedPlanDetails?.setupFee) missingFields.push('Costo de Setup');
  if (tenant.subscriptionFeeMxn == null && !tenant.selectedPlanDetails?.monthlyFee) missingFields.push('Suscripción mensual');
  const hasIncompleteData = isAdminView && missingFields.length > 0;

  const handlePrint = () => {
    window.print();
    if (isAdminView) {
      logDossierEmission(tenant.id, user?.id, activeTab, 'printed');
    }
  };

  const generateWelcomeEmail = () => {
    if (!user) {
      return `No se puede generar el correo de bienvenida: esta empresa todavía no tiene ningún usuario dado de alta. Ve a "Agregar Usuario" en el Directorio de Credenciales primero.`;
    }

    const accessUrl = typeof window !== 'undefined' ? window.location.origin : 'https://valentina-ai.mx';
    const planName = tenant.plan || 'Scale';
    const clientName = tenant.legalBusinessName || tenant.name;

    return `Asunto: Bienvenido a Valentina AI — Expediente Digital Oficial & Credenciales de Acceso: ${clientName}

Estimado/a ${user.fullName},

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
• Correo Institucional: ${user.email}
• Contraseña: ${user.password || 'Definida por el propio usuario al aceptar su invitación por correo.'}
• Plan Asignado: Plan ${planName} Enterprise

MEDIDA DE SEGURIDAD OBLIGATORIA:
Por protocolos de ciberseguridad, esta contraseña es estrictamente provisional. Al iniciar sesión por primera vez, el portal le solicitará definir obligatoriamente su clave definitiva y confidencial.

Puede descargar e imprimir su expediente completo en formato PDF desde su consola.

Atentamente,
Equipo de Arquitectura & Operaciones
VALENTINA AI ENTERPRISE CLOUD
contacto@valentina-ai.mx • Querétaro, Qro., México
`;
  };

  const handleCopyEmail = () => {
    if (!hasLinkedUser) return;
    navigator.clipboard.writeText(generateWelcomeEmail());
    setCopiedEmail(true);
    logDossierEmission(tenant.id, user?.id, activeTab, 'copied');
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleSendWelcomeEmail = async () => {
    if (!user || isSendingEmail) return;
    setIsSendingEmail(true);
    setSendResult(null);
    const result = await sendDossierWelcomeEmail(tenant.id, user.id);
    setIsSendingEmail(false);
    if (!result.success) {
      setSendResult({ success: false, message: result.error || 'No se pudo enviar el correo.' });
      return;
    }
    setSendResult({
      success: true,
      message: result.emailSimulated
        ? `Modo sandbox: no se pudo enviar por SMTP real (falta configurar GOOGLE_WORKSPACE_APP_PASSWORD), pero quedó registrado en el historial.`
        : `Correo real enviado a ${user.email}.`,
    });
  };

  const toggleHistory = async () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && emissions.length === 0) {
      setLoadingHistory(true);
      const data = await fetchDossierEmissions(tenant.id);
      setEmissions(data);
      setLoadingHistory(false);
    }
  };

  const cardContent = (
    <>
      {/* Barra de Herramientas Superior (Oculta al imprimir) */}
      <div className="px-4 sm:px-6 py-3.5 bg-white border-b border-[#dadce0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] text-[#0b57d0] flex items-center justify-center font-bold text-base shadow-xs">
            {tenant.logo || '📑'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1f1f1f]">
                {isAdminView ? `Expediente Digital B2B: ${tenant.name}` : 'Mi Expediente Digital'}
              </h3>
              {isAdminView && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6] font-semibold">
                  Generado Automáticamente
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#5f6368]">
              {tenant.legalBusinessName || tenant.name} &bull; {tenant.plan} Enterprise &bull; {displayName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {isAdminView && (
            <button
              type="button"
              onClick={handleSendWelcomeEmail}
              disabled={!hasLinkedUser || isSendingEmail}
              title={hasLinkedUser ? 'Enviar el correo de bienvenida real a este usuario' : 'Esta empresa todavía no tiene un usuario dado de alta'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f8f9fa] hover:bg-[#e8f0fe] text-[#0b57d0] border border-[#d3e3fd] text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isSendingEmail ? 'Enviando...' : 'Enviar Correo de Bienvenida'}</span>
            </button>
          )}

          {isAdminView && (
            <button
              type="button"
              onClick={handleCopyEmail}
              disabled={!hasLinkedUser}
              title={hasLinkedUser ? 'Copiar texto formal para correo de bienvenida' : 'Esta empresa todavía no tiene un usuario dado de alta'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] border border-[#dadce0] text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copiedEmail ? <CheckCircle className="w-3.5 h-3.5 text-[#137333]" /> : <Copy className="w-3.5 h-3.5 text-[#5f6368]" />}
              <span>{copiedEmail ? '¡Copiado!' : 'Copiar Correo'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>

          {!embedded && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e0e2ec] transition cursor-pointer ml-1"
              title="Cerrar expediente"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Aviso de datos fiscales/plan incompletos */}
      {hasIncompleteData && (
        <div className="px-6 py-2.5 bg-[#fce8e6] border-b border-[#f5c2c7] text-[#c5221f] text-xs font-medium flex items-start gap-2.5 print:hidden">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Datos incompletos:</strong> falta {missingFields.join(', ')}. Los montos/datos faltantes se muestran con
            valores de ejemplo de plantilla — edita la empresa antes de enviar este documento a un cliente real.
          </span>
        </div>
      )}

      {/* Resultado del envío real de correo */}
      {sendResult && (
        <div
          className={`px-6 py-2.5 border-b text-xs font-medium flex items-center justify-between gap-3 animate-fadeIn print:hidden ${
            sendResult.success
              ? 'bg-[#e6f4ea] border-[#ceead6] text-[#137333]'
              : 'bg-[#fce8e6] border-[#f5c2c7] text-[#c5221f]'
          }`}
        >
          <div className="flex items-center gap-2">
            {sendResult.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{sendResult.message}</span>
          </div>
          <button onClick={() => setSendResult(null)} className="text-current opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
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

        {isAdminView && (
          <>
            <div className="h-4 w-px bg-[#dadce0] mx-1"></div>
            <button
              type="button"
              onClick={toggleHistory}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1f1f1f] ml-auto"
            >
              <History className="w-3.5 h-3.5" />
              <span>Historial de Emisiones</span>
              {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </>
        )}
      </div>

      {/* Historial de Emisiones (colapsable, solo admin) */}
      {isAdminView && showHistory && (
        <div className="px-4 sm:px-6 py-3 bg-[#f8f9fa] border-b border-[#dadce0] print:hidden">
          {loadingHistory ? (
            <p className="text-xs text-[#5f6368]">Cargando historial...</p>
          ) : emissions.length === 0 ? (
            <p className="text-xs text-[#5f6368]">Sin registros todavía — imprime, copia o envía un correo para empezar el historial.</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {emissions.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-[11px] bg-white border border-[#dadce0] rounded-lg px-3 py-1.5">
                  <span className="text-[#1f1f1f] font-medium">
                    {ACTION_LABELS[e.action] || e.action} &bull; {DOCUMENT_LABELS[e.document_type] || e.document_type}
                  </span>
                  <span className="text-[#5f6368] font-mono">
                    {new Date(e.created_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} &bull; {e.actor_email}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Visor de Documentos con Scroll */}
      <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 print:p-0 print:overflow-visible print:space-y-0">
        {activeTab === 'quote' && <ExecutiveQuoteSheet tenant={tenant} />}
        {activeTab === 'agreement' && <ExecutiveAgreementSheet tenant={tenant} />}
        {activeTab === 'raci' && <ExecutiveRaciSheet tenant={tenant} />}
        {activeTab === 'credentials' && (
          <ExecutiveCredentialSheet tenant={tenant} user={user} />
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
              <ExecutiveCredentialSheet tenant={tenant} user={user} />
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

        {!embedded && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#1f1f1f] hover:bg-black text-white font-semibold transition cursor-pointer"
          >
            Cerrar Visor
          </button>
        )}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="bg-[#f8f9fa] rounded-2xl border border-[#dadce0] shadow-sm overflow-hidden flex flex-col print:border-none print:shadow-none">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-[#f8f9fa] rounded-2xl max-w-5xl w-full border border-[#dadce0] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh] print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none print:max-h-none">
        {cardContent}
      </div>
    </div>
  );
};
