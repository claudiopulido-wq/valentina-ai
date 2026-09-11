'use client';

import React, { useState } from 'react';
import { Tenant } from '../../types/platform';
import {
  X,
  Building2,
  Smartphone,
  CreditCard,
  FileSpreadsheet,
  Check,
  Globe,
  Shield,
  Save,
} from 'lucide-react';

interface EditTenantModalProps {
  tenant: Tenant;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTenant: Tenant) => void;
}

export const EditTenantModal: React.FC<EditTenantModalProps> = ({
  tenant,
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeSection, setActiveSection] = useState<'general' | 'whatsapp' | 'billing' | 'legal'>('general');

  // Form State
  const [name, setName] = useState(tenant.name);
  const [slug, setSlug] = useState(tenant.slug);
  const [industry, setIndustry] = useState(tenant.industry);
  const [logo, setLogo] = useState(tenant.logo || '🏢');
  const [website, setWebsite] = useState(tenant.website || '');
  const [plan, setPlan] = useState(tenant.plan);
  const [status, setStatus] = useState(tenant.status);
  const [subscriptionFeeMxn, setSubscriptionFeeMxn] = useState(tenant.subscriptionFeeMxn || 8500);
  const [monthlyBudgetMxn, setMonthlyBudgetMxn] = useState(tenant.monthlyBudgetMxn || 500);

  // WhatsApp / Meta Cloud
  const waChannel = tenant.channels.find((c) => c.type === 'whatsapp');
  const [phone, setPhone] = useState(waChannel?.identifier || '');
  const [phoneNumberId, setPhoneNumberId] = useState(tenant.phoneNumberId || waChannel?.phoneNumberId || '');
  const [wabaId, setWabaId] = useState(tenant.wabaId || waChannel?.wabaId || '');
  const [webhookBaseUrl, setWebhookBaseUrl] = useState(
    tenant.webhookBaseUrl ||
      waChannel?.webhookBaseUrl ||
      'https://whatsapp-empresarial-production.up.railway.app'
  );

  // Fiscal / Legal
  const [legalBusinessName, setLegalBusinessName] = useState(tenant.legalBusinessName || '');
  const [rfc, setRfc] = useState(tenant.rfc || '');
  const [taxAddress, setTaxAddress] = useState(tenant.taxAddress || '');
  const [legalRepresentative, setLegalRepresentative] = useState(tenant.legalRepresentative || '');
  const [legalRepresentativeTitle, setLegalRepresentativeTitle] = useState(tenant.legalRepresentativeTitle || '');

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Actualizar canal de WhatsApp dentro de channels
    const updatedChannels = tenant.channels.map((ch) => {
      if (ch.type === 'whatsapp') {
        return {
          ...ch,
          identifier: phone.trim(),
          phoneNumberId: phoneNumberId.trim() || undefined,
          wabaId: wabaId.trim() || undefined,
          webhookBaseUrl: webhookBaseUrl.trim() || undefined,
        };
      }
      return ch;
    });

    // Si no existía canal de WhatsApp y se proporcionó número, crearlo
    if (!updatedChannels.some((c) => c.type === 'whatsapp') && phone.trim()) {
      updatedChannels.push({
        id: `ch-${slug}-wa`,
        type: 'whatsapp',
        name: `WhatsApp Oficial ${name}`,
        identifier: phone.trim(),
        phoneNumberId: phoneNumberId.trim() || undefined,
        wabaId: wabaId.trim() || undefined,
        webhookBaseUrl: webhookBaseUrl.trim() || undefined,
        status: 'connected',
        lastPing: 'Recién configurado',
        batteryLevel: 100,
        dailyMessagesCount: 0,
      });
    }

    const updatedTenant: Tenant = {
      ...tenant,
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      industry: industry.trim(),
      logo: logo.trim() || '🏢',
      website: website.trim() || undefined,
      plan,
      status,
      subscriptionFeeMxn: Number(subscriptionFeeMxn),
      monthlyBudgetMxn: Number(monthlyBudgetMxn),
      phoneNumberId: phoneNumberId.trim() || undefined,
      wabaId: wabaId.trim() || undefined,
      webhookBaseUrl: webhookBaseUrl.trim() || undefined,
      legalBusinessName: legalBusinessName.trim() || undefined,
      rfc: rfc.trim().toUpperCase() || undefined,
      taxAddress: taxAddress.trim() || undefined,
      legalRepresentative: legalRepresentative.trim() || undefined,
      legalRepresentativeTitle: legalRepresentativeTitle.trim() || undefined,
      channels: updatedChannels,
    };

    onSave(updatedTenant);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-[#dadce0] rounded-2xl shadow-xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 border-b border-[#dadce0] flex items-center justify-between bg-[#f8f9fa]">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-xl bg-white border border-[#dadce0] shadow-xs">
              {logo}
            </span>
            <div>
              <h3 className="text-base font-semibold text-[#1f1f1f]">Editar Organización / Cliente</h3>
              <p className="text-xs text-[#5f6368]">
                {name} <span className="font-mono text-[11px] text-[#747775]">({slug})</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-[#dadce0] bg-[#f8f9fa] px-5 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSection('general')}
            className={`py-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
              activeSection === 'general'
                ? 'border-[#0b57d0] text-[#0b57d0]'
                : 'border-transparent text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Identidad &amp; General</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('whatsapp')}
            className={`py-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
              activeSection === 'whatsapp'
                ? 'border-[#0b57d0] text-[#0b57d0]'
                : 'border-transparent text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Meta WhatsApp Cloud</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('billing')}
            className={`py-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
              activeSection === 'billing'
                ? 'border-[#0b57d0] text-[#0b57d0]'
                : 'border-transparent text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Plan &amp; Presupuesto</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('legal')}
            className={`py-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
              activeSection === 'legal'
                ? 'border-[#0b57d0] text-[#0b57d0]'
                : 'border-transparent text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Datos Fiscales</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
            {/* SECCIÓN 1: GENERAL */}
            {activeSection === 'general' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#444746] mb-1">
                      Nombre de la Empresa / Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] focus:ring-2 focus:ring-[#d3e3fd]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#444746] mb-1">
                      Emoji / Icono *
                    </label>
                    <input
                      type="text"
                      required
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-center text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] focus:ring-2 focus:ring-[#d3e3fd]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#444746] mb-1">
                      Slug Único (Identificador) *
                    </label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm font-mono text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] focus:ring-2 focus:ring-[#d3e3fd]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#444746] mb-1">
                      Sitio Web Oficial
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-[#747775] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="ej. www.empresa.com"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] focus:ring-2 focus:ring-[#d3e3fd]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444746] mb-1">
                    Industria / Giro Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] focus:ring-2 focus:ring-[#d3e3fd]"
                  />
                </div>
              </div>
            )}

            {/* SECCIÓN 2: META WHATSAPP CLOUD */}
            {activeSection === 'whatsapp' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#e6f4ea] border border-[#ceead6] text-[#137333] text-xs flex items-start gap-2.5">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Infraestructura Meta Cloud Oficial</strong>
                    <p className="text-[11px] text-[#0d652d] leading-relaxed">
                      Estos identificadores permiten enviar y recibir mensajes directamente con WhatsApp Business API Graph v21.0.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444746] mb-1">
                    Número de WhatsApp Oficial (E.164) *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ej. +52 442 269 2336"
                    className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm font-mono text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] focus:ring-2 focus:ring-[#d3e3fd]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#444746] mb-1">
                      Meta Phone Number ID
                    </label>
                    <input
                      type="text"
                      value={phoneNumberId}
                      onChange={(e) => setPhoneNumberId(e.target.value)}
                      placeholder="ej. 1306465949219252"
                      className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm font-mono text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] focus:ring-2 focus:ring-[#d3e3fd]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#444746] mb-1">
                      Meta WABA ID (Business Account)
                    </label>
                    <input
                      type="text"
                      value={wabaId}
                      onChange={(e) => setWabaId(e.target.value)}
                      placeholder="ej. 1111806054618508"
                      className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm font-mono text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] focus:ring-2 focus:ring-[#d3e3fd]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444746] mb-1">
                    Servidor Backend / Webhook Base URL
                  </label>
                  <input
                    type="text"
                    value={webhookBaseUrl}
                    onChange={(e) => setWebhookBaseUrl(e.target.value)}
                    placeholder="https://whatsapp-empresarial-production.up.railway.app"
                    className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm font-mono text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] focus:ring-2 focus:ring-[#d3e3fd]"
                  />
                </div>
              </div>
            )}

            {/* SECCIÓN 3: PLAN & PRESUPUESTO */}
            {activeSection === 'billing' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#444746] mb-1">
                      Plan SaaS Asignado
                    </label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] cursor-pointer"
                    >
                      <option value="Growth">Growth (Nivel 1)</option>
                      <option value="Scale">Scale (Nivel 2)</option>
                      <option value="Enterprise">Enterprise (Nivel 3)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#444746] mb-1">
                      Estatus Operativo
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] cursor-pointer"
                    >
                      <option value="active">Activo (En Producción)</option>
                      <option value="trial">Periodo de Prueba</option>
                      <option value="suspended">Suspendido / Pausado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#444746] mb-1">
                      Cuota Mensual Valentina AI ($ MXN)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={subscriptionFeeMxn}
                      onChange={(e) => setSubscriptionFeeMxn(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm font-mono text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#444746] mb-1">
                      Límite Presupuestario Tokens IA ($ MXN)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={monthlyBudgetMxn}
                      onChange={(e) => setMonthlyBudgetMxn(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm font-mono text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN 4: FISCAL / LEGAL */}
            {activeSection === 'legal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#444746] mb-1">
                      Razón Social Oficial
                    </label>
                    <input
                      type="text"
                      value={legalBusinessName}
                      onChange={(e) => setLegalBusinessName(e.target.value)}
                      placeholder="ej. Soluciones Digitales S.A. de C.V."
                      className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#444746] mb-1">
                      RFC Fiscal
                    </label>
                    <input
                      type="text"
                      value={rfc}
                      onChange={(e) => setRfc(e.target.value.toUpperCase())}
                      placeholder="ej. VAI260901AB1"
                      className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm font-mono text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444746] mb-1">
                    Domicilio Fiscal Completo
                  </label>
                  <input
                    type="text"
                    value={taxAddress}
                    onChange={(e) => setTaxAddress(e.target.value)}
                    placeholder="Calle, Número, Colonia, C.P., Ciudad, Estado"
                    className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#444746] mb-1">
                      Representante Legal / Titular
                    </label>
                    <input
                      type="text"
                      value={legalRepresentative}
                      onChange={(e) => setLegalRepresentative(e.target.value)}
                      placeholder="Nombre del apoderado o directivo"
                      className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#444746] mb-1">
                      Cargo del Representante
                    </label>
                    <input
                      type="text"
                      value={legalRepresentativeTitle}
                      onChange={(e) => setLegalRepresentativeTitle(e.target.value)}
                      placeholder="ej. Director General / Administrador Único"
                      className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[#dadce0] bg-[#f8f9fa] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-lg transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={savedSuccess}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#0b57d0] hover:bg-[#0842a0] text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-75"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Cambios Guardados!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
