'use client';

import React, { useState, useEffect } from 'react';
import { CommercialQuote } from '../../types/platform';
import { CommercialQuotePdfSheet } from './CommercialQuotePdfSheet';
import {
  Sparkles,
  Calculator,
  Building2,
  Users,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Zap,
  Printer,
  Copy,
  CheckCircle,
  Mail,
  Send,
  ArrowRight,
  ArrowLeft,
  X,
  UserCheck,
  Smartphone,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  initialQuote?: CommercialQuote | null;
  onClose: () => void;
  onSaveQuote: (quote: CommercialQuote) => void;
  onConvertToClient?: (quote: CommercialQuote) => void;
}

const AVAILABLE_FEATURES = [
  { id: 'wa', label: 'WhatsApp Business Cloud API Oficial (Meta)', tier: 'Growth' },
  { id: 'rag', label: 'Base de Conocimiento RAG (Catálogos y Políticas)', tier: 'Growth' },
  { id: 'scoring', label: 'Calificación Inteligente de Leads (Lead Scoring)', tier: 'Growth' },
  { id: 'escalation', label: 'Derivación a Asesor Humano con Alerta por WhatsApp', tier: 'Growth' },
  { id: 'webchat', label: 'Webchat Interactivo Flotante en Sitio Web', tier: 'Scale' },
  { id: 'quoter', label: 'Motor de Cotización Dinámico en Chat (En Vivo)', tier: 'Scale' },
  { id: 'calendar', label: 'Agendamiento Automatizado (Google Calendar / Cal.com)', tier: 'Scale' },
  { id: 'crm', label: 'Sincronización Bidireccional CRM (Google Sheets / HubSpot / Zoho)', tier: 'Scale' },
  { id: 'voice', label: 'Atención y Transcripción de Notas de Voz (Voice AI Whisper)', tier: 'Scale' },
  { id: 'erp', label: 'Conexión a ERP / Base de Datos SQL Server o Postgres', tier: 'Enterprise' },
  { id: 'ocr', label: 'Validación de Comprobantes con OCR Forense', tier: 'Enterprise' },
];

export const SalesQuoteGeneratorModal: React.FC<Props> = ({
  isOpen,
  initialQuote,
  onClose,
  onSaveQuote,
  onConvertToClient,
}) => {
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');

  // Datos Prospecto
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactJobTitle, setContactJobTitle] = useState('Director General');
  const [industry, setIndustry] = useState('Clínica & Salud Privada');

  // Diagnóstico Operativo
  const [currentStaffCount, setCurrentStaffCount] = useState<number>(2);
  const [staffSalaryMxn, setStaffSalaryMxn] = useState<number>(14000);
  const [normalMonthlyVolume, setNormalMonthlyVolume] = useState<number>(1500);
  const [peakMonthlyVolume, setPeakMonthlyVolume] = useState<number>(3800);
  const [missedOffHoursPercent, setMissedOffHoursPercent] = useState<number>(35);

  // Alcance
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([
    'wa',
    'rag',
    'scoring',
    'escalation',
    'webchat',
    'quoter',
    'calendar',
    'crm',
  ]);

  // Comercial
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [overrideSetup, setOverrideSetup] = useState<number | null>(null);
  const [overrideMonthly, setOverrideMonthly] = useState<number | null>(null);

  // Estados de envío
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<string | null>(null);
  const [copiedPitch, setCopiedPitch] = useState(false);

  useEffect(() => {
    if (initialQuote) {
      setCompanyName(initialQuote.companyName);
      setContactName(initialQuote.contactName);
      setContactEmail(initialQuote.contactEmail);
      setContactPhone(initialQuote.contactPhone);
      setContactJobTitle(initialQuote.contactJobTitle || 'Director General');
      setIndustry(initialQuote.industry);
      setCurrentStaffCount(initialQuote.currentStaffCount);
      setStaffSalaryMxn(initialQuote.staffSalaryMxn);
      setNormalMonthlyVolume(initialQuote.normalMonthlyVolume);
      setPeakMonthlyVolume(initialQuote.peakMonthlyVolume);
      setMissedOffHoursPercent(initialQuote.missedOffHoursPercent || 35);
      setBillingPeriod(initialQuote.billingPeriod);
      setOverrideSetup(initialQuote.setupFeeMxn);
      setOverrideMonthly(initialQuote.monthlyFeeMxn);
      setViewMode('preview');
    } else {
      setViewMode('form');
    }
  }, [initialQuote, isOpen]);

  if (!isOpen) return null;

  // Lógica de Plan según POL-COM-VAL-2026-B
  const hasEnterpriseFeatures = selectedFeatureIds.some((id) => id === 'erp' || id === 'ocr');
  const hasScaleFeatures = selectedFeatureIds.some(
    (id) => id === 'webchat' || id === 'quoter' || id === 'calendar' || id === 'crm' || id === 'voice'
  );

  const calculatedPlan: 'Growth' | 'Scale' | 'Enterprise' = hasEnterpriseFeatures
    ? 'Enterprise'
    : hasScaleFeatures
    ? 'Scale'
    : 'Growth';

  // Precios oficiales según política
  const defaultSetupMonthly = calculatedPlan === 'Enterprise' ? 38500 : calculatedPlan === 'Scale' ? 16500 : 8500;
  const defaultMonthlyFee = calculatedPlan === 'Enterprise' ? 12500 : calculatedPlan === 'Scale' ? 5600 : 2800;

  // Si es anual: 50% descuento en Setup, y 2 meses gratis de mensualidad (10 pagados / 12)
  const defaultSetupAnnual = Math.round(defaultSetupMonthly * 0.5);
  const defaultMonthlyFeeAnnual = Math.round((defaultMonthlyFee * 10) / 12);

  const effectiveSetupFee =
    overrideSetup !== null
      ? overrideSetup
      : billingPeriod === 'annual'
      ? defaultSetupAnnual
      : defaultSetupMonthly;

  const effectiveMonthlyFee =
    overrideMonthly !== null
      ? overrideMonthly
      : billingPeriod === 'annual'
      ? defaultMonthlyFeeAnnual
      : defaultMonthlyFee;

  // Métricas Financieras y de ROI
  const currentHumanCostMxn = currentStaffCount * staffSalaryMxn;
  const monthlySavingsMxn = Math.max(0, currentHumanCostMxn - effectiveMonthlyFee);
  const netAnnualSavingsMxn = monthlySavingsMxn * 12;
  const amortizationDays = Math.max(5, Math.round((effectiveSetupFee / (Math.max(1, monthlySavingsMxn) / 30))));

  // Estimación de Meta Oficial Octubre 2026 ($0.0085 USD/msg ~ $0.15 MXN tras 1,000 gratuitos)
  const estimatedMetaMonthlyCostMxn = Math.round(Math.max(0, normalMonthlyVolume - 1000) * 0.153);

  const selectedFeatureLabels = AVAILABLE_FEATURES.filter((f) =>
    selectedFeatureIds.includes(f.id)
  ).map((f) => f.label);

  const compiledQuote: CommercialQuote = {
    id: initialQuote?.id || `quote-${Date.now()}`,
    folio: initialQuote?.folio || `COT-VAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    companyName: companyName || 'Empresa Prospecto',
    contactName: contactName || 'Tomador de Decisión',
    contactEmail: contactEmail || 'contacto@empresa.com',
    contactPhone: contactPhone || '+52 442 000 0000',
    contactJobTitle,
    industry,
    currentStaffCount,
    staffSalaryMxn,
    normalMonthlyVolume,
    peakMonthlyVolume,
    missedOffHoursPercent,
    selectedFeatures: selectedFeatureLabels,
    plan: calculatedPlan,
    billingPeriod,
    setupFeeMxn: effectiveSetupFee,
    monthlyFeeMxn: effectiveMonthlyFee,
    currentHumanCostMxn,
    monthlySavingsMxn,
    netAnnualSavingsMxn,
    amortizationDays,
    estimatedMetaMonthlyCostMxn,
    status: initialQuote?.status || 'draft',
    createdAt: initialQuote?.createdAt || new Date().toISOString().split('T')[0],
    expiresAt:
      initialQuote?.expiresAt ||
      new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };

  const handleToggleFeature = (id: string) => {
    setSelectedFeatureIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSendViaEmail = async () => {
    setSendingEmail(true);
    setEmailStatusMessage(null);
    try {
      const res = await fetch('/api/sales/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: compiledQuote,
          emailTo: compiledQuote.contactEmail,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailStatusMessage(data.message || 'Cotización enviada exitosamente.');
        const updatedQuote: CommercialQuote = {
          ...compiledQuote,
          status: 'sent',
          sentAt: new Date().toISOString(),
        };
        onSaveQuote(updatedQuote);
      } else {
        setEmailStatusMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setEmailStatusMessage(`Error de red al enviar: ${err?.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const getWhatsAppPitchText = () => {
    return `Hola ${compiledQuote.contactName}, un gusto saludarte.

Conforme a la sesión de diagnóstico de ${compiledQuote.companyName}, preparé la propuesta formal oficial de Valentina AI:

📄 Folio Oficial: ${compiledQuote.folio}
🎯 Solución Recomendada: Plan ${compiledQuote.plan}
💰 Implementación (Setup): $${compiledQuote.setupFeeMxn.toLocaleString('es-MX')} MXN (${compiledQuote.billingPeriod === 'annual' ? '50% Bonificado' : '50% anticipo'})
⚙️ Mensualidad Operativa: $${compiledQuote.monthlyFeeMxn.toLocaleString('es-MX')} MXN/mes

📊 RETORNO DE INVERSIÓN (ROI):
• Costo de tu equipo actual (${compiledQuote.currentStaffCount} personas): ~$${compiledQuote.currentHumanCostMxn.toLocaleString('es-MX')} MXN/mes
• Ahorro mensual neto con Valentina: +$${compiledQuote.monthlySavingsMxn.toLocaleString('es-MX')} MXN/mes
• Tiempo de recuperación del Setup: Amortizado en solo ${compiledQuote.amortizationDays} días hábiles.
• Cobertura: 24/7 en menos de 3 segundos sin prospectos perdidos.

Te envié la propuesta membretada a tu correo ${compiledQuote.contactEmail}. Si me confirmas, reservamos la fecha de ingeniería. ¡Saludos!`;
  };

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(getWhatsAppPitchText());
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-[#f8f9fa] rounded-2xl max-w-5xl w-full border border-[#dadce0] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh] print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none print:max-h-none">
        
        {/* Cabecera de la Modal */}
        <div className="px-5 py-3.5 bg-white border-b border-[#dadce0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] text-[#0b57d0] flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1f1f1f]">
                  Cotizador Comercial Inteligente B2B
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#fef7e0] text-[#b06000] border border-[#feefc3] font-bold">
                  POL-COM-VAL-2026-B
                </span>
              </div>
              <p className="text-[11px] text-[#5f6368]">
                Diagnóstico de operación humana, checklist modular y cálculo automático de ROI
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-[#f1f3f4] rounded-lg p-0.5 flex text-xs font-semibold mr-1">
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className={`px-3 py-1 rounded-md transition ${
                  viewMode === 'form' ? 'bg-white text-[#0b57d0] shadow-xs' : 'text-[#5f6368]'
                }`}
              >
                1. Diagnóstico & Alcance
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-md transition ${
                  viewMode === 'preview' ? 'bg-white text-[#0b57d0] shadow-xs' : 'text-[#5f6368]'
                }`}
              >
                2. Propuesta Membretada (PDF)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e0e2ec] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notificación de Estado de Correo */}
        {emailStatusMessage && (
          <div className="px-6 py-2.5 bg-[#e6f4ea] border-b border-[#ceead6] text-[#137333] text-xs font-medium flex items-center justify-between print:hidden">
            <span>{emailStatusMessage}</span>
            <button
              onClick={() => setEmailStatusMessage(null)}
              className="text-[#137333] hover:underline text-[11px]"
            >
              Entendido
            </button>
          </div>
        )}

        {/* VISTA 1: FORMULARIO DE DIAGNÓSTICO Y CHECKLIST */}
        {viewMode === 'form' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
            
            {/* Bloque A: Datos del Prospecto */}
            <div className="p-4 rounded-xl bg-white border border-[#dadce0] space-y-3">
              <div className="text-[11px] font-bold text-[#0b57d0] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#dadce0] pb-2">
                <Building2 className="w-4 h-4" /> A. Datos del Prospecto y Tomador de Decisión
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[#5f6368] block mb-1 font-medium">Nombre de la Empresa o Institución *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Hospital San José / Inmobiliaria Cumbres"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                  />
                </div>
                <div>
                  <label className="text-[#5f6368] block mb-1 font-medium">Giro / Sector Comercial</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                  >
                    <option value="Clínica & Salud Privada">🏥 Clínica & Salud Privada</option>
                    <option value="Educación & Universidades">🎓 Educación & Universidades</option>
                    <option value="Inmobiliario & Desarrollos">🏢 Inmobiliario & Desarrollos</option>
                    <option value="Automotriz & Talleres">🚗 Automotriz & Talleres</option>
                    <option value="Servicios Legales & Notariales">⚖️ Servicios Legales & Notariales</option>
                    <option value="Comercio & Retail">🛍️ Comercio & Retail</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[#5f6368] block mb-1 font-medium">Nombre del Directivo / Contacto *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Dr. Roberto Valdés"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                  />
                </div>

                <div>
                  <label className="text-[#5f6368] block mb-1 font-medium">Cargo o Puesto</label>
                  <input
                    type="text"
                    placeholder="ej. Director General / Dueño"
                    value={contactJobTitle}
                    onChange={(e) => setContactJobTitle(e.target.value)}
                    className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                  />
                </div>

                <div>
                  <label className="text-[#5f6368] block mb-1 font-medium">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="director@empresa.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                  />
                </div>
              </div>

              <div className="sm:w-1/3">
                <label className="text-[#5f6368] block mb-1 font-medium">WhatsApp / Teléfono *</label>
                <input
                  type="text"
                  required
                  placeholder="+52 442 000 0000"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-[#1f1f1f] font-mono focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                />
              </div>
            </div>

            {/* Bloque B: Diagnóstico Operativo Humano */}
            <div className="p-4 rounded-xl bg-white border border-[#dadce0] space-y-3">
              <div className="text-[11px] font-bold text-[#b06000] uppercase tracking-wider flex items-center justify-between border-b border-[#dadce0] pb-2">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#e37400]" /> B. Diagnóstico Operativo Humano (Cálculo del Dolor Financiero)
                </span>
                <span className="font-mono text-[11px] text-[#843800]">
                  Costo Humano Actual: ${currentHumanCostMxn.toLocaleString('es-MX')} MXN/mes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[#5f6368] block mb-1 font-medium">Asesores / Recepcionistas</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={currentStaffCount}
                    onChange={(e) => setCurrentStaffCount(Number(e.target.value))}
                    className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 font-mono text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                  />
                  <span className="text-[10px] text-[#5f6368] mt-0.5 block">Personas en WhatsApp/teléfono.</span>
                </div>

                <div>
                  <label className="text-[#5f6368] block mb-1 font-medium">Sueldo Promedio + Cargas (MXN)</label>
                  <input
                    type="number"
                    step="500"
                    min="5000"
                    value={staffSalaryMxn}
                    onChange={(e) => setStaffSalaryMxn(Number(e.target.value))}
                    className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 font-mono text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                  />
                  <span className="text-[10px] text-[#5f6368] mt-0.5 block">Sueldo bruto + IMSS por persona.</span>
                </div>

                <div>
                  <label className="text-[#5f6368] block mb-1 font-medium">Volumen Mensual Normal</label>
                  <input
                    type="number"
                    step="100"
                    value={normalMonthlyVolume}
                    onChange={(e) => setNormalMonthlyVolume(Number(e.target.value))}
                    className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 font-mono text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                  />
                  <span className="text-[10px] text-[#5f6368] mt-0.5 block">Conversaciones al mes.</span>
                </div>

                <div>
                  <label className="text-[#5f6368] block mb-1 font-medium">Volumen en Temporada Alta</label>
                  <input
                    type="number"
                    step="500"
                    value={peakMonthlyVolume}
                    onChange={(e) => setPeakMonthlyVolume(Number(e.target.value))}
                    className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 font-mono text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
                  />
                  <span className="text-[10px] text-[#5f6368] mt-0.5 block">Picos de campaña o lanzamientos.</span>
                </div>
              </div>
            </div>

            {/* Bloque C: Alcance Técnico Modular (Checklist) */}
            <div className="p-4 rounded-xl bg-white border border-[#dadce0] space-y-3">
              <div className="flex items-center justify-between border-b border-[#dadce0] pb-2">
                <span className="text-[11px] font-bold text-[#0b57d0] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4" /> C. Alcance Técnico Modular (Checklist de Capacidades)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f3e8fd] text-[#7627bb] border border-[#e9d5ff]">
                  Plan Recomendado: Plan {calculatedPlan}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AVAILABLE_FEATURES.map((feat) => {
                  const isChecked = selectedFeatureIds.includes(feat.id);
                  return (
                    <label
                      key={feat.id}
                      className={`p-2.5 rounded-lg border transition flex items-start gap-2.5 cursor-pointer ${
                        isChecked
                          ? 'bg-[#e8f0fe] border-[#0b57d0]'
                          : 'bg-[#f8f9fa] border-[#dadce0] hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleFeature(feat.id)}
                        className="mt-0.5 rounded text-[#0b57d0] focus:ring-[#0b57d0]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[11px] text-[#1f1f1f]">{feat.label}</span>
                          <span className="text-[9px] font-mono text-[#5f6368] uppercase bg-white px-1.5 py-0.5 rounded border border-[#dadce0]">
                            {feat.tier}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Bloque D: Condiciones Comerciales & ROI */}
            <div className="p-4 rounded-xl bg-white border border-[#dadce0] space-y-3">
              <div className="flex items-center justify-between border-b border-[#dadce0] pb-2">
                <span className="text-[11px] font-bold text-[#137333] uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" /> D. Condiciones Comerciales & Retorno de Inversión
                </span>

                <div className="flex bg-[#f1f3f4] rounded-lg p-0.5 border border-[#dadce0] text-[11px]">
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('monthly')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      billingPeriod === 'monthly' ? 'bg-[#0b57d0] text-white' : 'text-[#5f6368]'
                    }`}
                  >
                    Mensual (50% anticipo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('annual')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      billingPeriod === 'annual' ? 'bg-[#137333] text-white' : 'text-[#5f6368]'
                    }`}
                  >
                    Anual (Ahorro 2M + 50% Setup)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#f8f9fa] border border-[#dadce0]">
                  <span className="text-[10px] text-[#5f6368] block">Inversión Setup:</span>
                  <div className="text-base font-bold font-mono text-[#1f1f1f] mt-0.5">
                    ${effectiveSetupFee.toLocaleString('es-MX')} MXN
                  </div>
                  <span className="text-[10px] text-[#5f6368]">
                    {billingPeriod === 'annual' ? '50% Bonificado' : '50% Anticipo / 50% Entrega'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#f8f9fa] border border-[#dadce0]">
                  <span className="text-[10px] text-[#5f6368] block">Suscripción Mensual:</span>
                  <div className="text-base font-bold font-mono text-[#0b57d0] mt-0.5">
                    ${effectiveMonthlyFee.toLocaleString('es-MX')} MXN/mes
                  </div>
                  <span className="text-[10px] text-[#5f6368]">
                    {billingPeriod === 'annual' ? '10 meses pagados / 12 servicio' : 'Facturación mensual recurrente'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#e6f4ea] border border-[#ceead6]">
                  <span className="text-[10px] text-[#137333] font-bold block">Ahorro Mensual Neto:</span>
                  <div className="text-base font-extrabold font-mono text-[#137333] mt-0.5">
                    +${monthlySavingsMxn.toLocaleString('es-MX')} MXN
                  </div>
                  <span className="text-[10px] text-[#1e8e3e]">Beneficio al flujo de caja</span>
                </div>

                <div className="p-3 rounded-lg bg-[#e8f0fe] border border-[#d3e3fd]">
                  <span className="text-[10px] text-[#0b57d0] font-bold block">Recuperación de Inversión:</span>
                  <div className="text-base font-extrabold font-mono text-[#0b57d0] mt-0.5">
                    {amortizationDays} Días
                  </div>
                  <span className="text-[10px] text-[#5f6368]">Desde salida a producción</span>
                </div>
              </div>
            </div>

            {/* Botón de acción hacia la propuesta membretada */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  onSaveQuote(compiledQuote);
                  setViewMode('preview');
                }}
                className="px-6 py-2.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Generar Propuesta Membretada Oficial</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* VISTA 2: PREVISUALIZACIÓN DE LA PROPUESTA MEMBRETADA OFICIAL */}
        {viewMode === 'preview' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            
            {/* Barra de Acciones de la Propuesta */}
            <div className="px-6 py-2.5 bg-white border-b border-[#dadce0] flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('form')}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Modificar Datos</span>
                </button>
                <span className="text-xs text-[#5f6368] font-mono font-bold">
                  FOLIO: {compiledQuote.folio}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPitch}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] border border-[#dadce0] text-xs font-semibold cursor-pointer shadow-xs"
                  title="Copiar resumen ejecutivo para enviar por WhatsApp"
                >
                  {copiedPitch ? <CheckCircle className="w-3.5 h-3.5 text-[#137333]" /> : <Copy className="w-3.5 h-3.5 text-[#5f6368]" />}
                  <span>{copiedPitch ? '¡Copiado!' : 'Copiar Pitch WhatsApp'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendViaEmail}
                  disabled={sendingEmail}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#137333] hover:bg-[#0f5b28] text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                  title="Enviar por correo vía Google Workspace for Education"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{sendingEmail ? 'Enviando...' : 'Enviar por Correo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>

                {onConvertToClient && (
                  <button
                    type="button"
                    onClick={() => onConvertToClient(compiledQuote)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#6D28D9] hover:bg-[#5b21b6] text-white text-xs font-bold cursor-pointer shadow-xs"
                    title="Transferir datos ganados al Wizard de Alta"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Convertir en Cliente</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hoja Membretada con Scroll */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
              <CommercialQuotePdfSheet quote={compiledQuote} />
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
