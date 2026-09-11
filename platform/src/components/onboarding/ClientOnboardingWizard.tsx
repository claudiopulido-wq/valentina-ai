'use client';

import React, { useState } from 'react';
import { Tenant, AuthUser, Channel, UserLevel } from '../../types/platform';
import {
  Building2,
  Cpu,
  Key,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Step1CorporateIdentity } from './Step1CorporateIdentity';
import { Step2ChannelsArchitecture } from './Step2ChannelsArchitecture';
import { Step3PricingMeta } from './Step3PricingMeta';
import { Step4Credentials } from './Step4Credentials';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (tenant: Tenant, user: AuthUser) => void;
}

export const ClientOnboardingWizard: React.FC<Props> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Paso 1: Identidad Corporativa & Fiscal
  const [companyName, setCompanyName] = useState('');
  const [legalBusinessName, setLegalBusinessName] = useState('');
  const [rfc, setRfc] = useState('');
  const [taxAddress, setTaxAddress] = useState('');
  const [industry, setIndustry] = useState('Salud & Especialidades');
  const [legalRepresentative, setLegalRepresentative] = useState('');
  const [legalRepresentativeTitle, setLegalRepresentativeTitle] = useState('Director General');
  const [emojiLogo, setEmojiLogo] = useState('🏢');

  // Paso 2: Arquitectura del Bot & Canales
  const [waNumber, setWaNumber] = useState('');
  const [enableWebchat, setEnableWebchat] = useState(true);
  const [enableInstagram, setEnableInstagram] = useState(false);
  const [selectedCrm, setSelectedCrm] = useState('Google Sheets & Webhook');
  const [selectedCalendar, setSelectedCalendar] = useState('Google Calendar');
  const [knowledgeNotes, setKnowledgeNotes] = useState('');

  // Paso 3: Plan, Precios & Estimador Meta
  const [selectedPlan, setSelectedPlan] = useState<'Growth' | 'Scale' | 'Enterprise'>('Scale');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [metaExpectedVolume, setMetaExpectedVolume] = useState<number>(1500);

  // Paso 4: Credenciales del Director
  const [contactName, setContactName] = useState('');
  const [contactJobTitle, setContactJobTitle] = useState('Director General');
  const [contactLevel, setContactLevel] = useState<UserLevel>('director');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPassword, setContactPassword] = useState(() => generateSecureTempPassword());
  const [copiedPassword, setCopiedPassword] = useState(false);

  function generateSecureTempPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'Val_';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass + '!2026';
  }

  if (!isOpen) return null;

  // Precios dinámicos según el plan y periodo
  const planConfigs = {
    Growth: {
      setupMonthly: 8500,
      setupAnnual: 4250,
      feeMonthly: 2800,
      feeAnnual: 2333,
    },
    Scale: {
      setupMonthly: 16500,
      setupAnnual: 8250,
      feeMonthly: 5600,
      feeAnnual: 4666,
    },
    Enterprise: {
      setupMonthly: 25000,
      setupAnnual: 15000,
      feeMonthly: 9500,
      feeAnnual: 7900,
    },
  };

  const currentConfig = planConfigs[selectedPlan];
  const setupFee = billingPeriod === 'annual' ? currentConfig.setupAnnual : currentConfig.setupMonthly;
  const monthlyFee = billingPeriod === 'annual' ? currentConfig.feeAnnual : currentConfig.feeMonthly;

  // Estimador de Meta: Primeros 1,000 gratis, excedente a $0.0085 USD (~$0.15 MXN)
  const metaExcessMessages = Math.max(0, metaExpectedVolume - 1000);
  const estimatedMetaCostMxn = Math.round(metaExcessMessages * 0.153);
  const projectedSavingsMonthly = 39600;
  const daysToRoi = Math.max(7, Math.round(setupFee / (projectedSavingsMonthly / 30)));

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 4) {
      setCurrentStep((prev) => ((prev + 1) as 1 | 2 | 3 | 4));
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = () => {
    const slug =
      companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
      `org-${Date.now()}`;
    const newTenantId = `tenant-${slug}`;

    const newChannels: Channel[] = [
      {
        id: `ch-${slug}-wa`,
        type: 'whatsapp',
        name: `WhatsApp Oficial ${companyName}`,
        identifier: waNumber || '+52 442 000 0000',
        status: 'connected',
        lastPing: 'Hace unos momentos',
        batteryLevel: 99,
        dailyMessagesCount: 0,
      },
    ];

    if (enableWebchat) {
      newChannels.push({
        id: `ch-${slug}-web`,
        type: 'web',
        name: `Webchat Flotante ${companyName}`,
        identifier: `widget-${slug}`,
        status: 'connected',
        lastPing: 'En línea',
        dailyMessagesCount: 0,
      });
    }

    const connectedSystems = [selectedCrm, selectedCalendar];

    const newTenant: Tenant = {
      id: newTenantId,
      name: companyName,
      slug,
      industry: industry || 'Empresarial & Servicios',
      logo: emojiLogo || '🏢',
      plan: selectedPlan,
      status: 'active',
      subscriptionFeeMxn: monthlyFee,
      monthlyBudgetMxn: 500,
      totalSpentMxn: 0,
      totalTokensUsed: 0,
      activeAgentsCount: 1,
      metaFreeConversationsUsed: 0,
      metaExcessCostMxn: 0,
      channels: newChannels,

      // Datos Fiscales & Comercial
      legalBusinessName: legalBusinessName || `${companyName} S.A. de C.V.`,
      rfc: rfc.toUpperCase() || 'XAXX010101000',
      taxAddress: taxAddress || 'Querétaro, Qro., México',
      legalRepresentative: legalRepresentative || contactName || 'Representante Legal',
      legalRepresentativeTitle: legalRepresentativeTitle || 'Director General',
      billingPeriod,
      setupFeeMxn: setupFee,
      selectedPlanDetails: {
        setupFee,
        monthlyFee,
        billingPeriod,
        estimatedMetaMessages: metaExpectedVolume,
        estimatedMetaCostMxn,
        projectedMonthlySavingsMxn: projectedSavingsMonthly,
      },
      connectedSystems,
      secondaryChannels: enableWebchat ? ['webchat'] : [],
      notes: knowledgeNotes,
    };

    const newUser: AuthUser = {
      id: `user-${slug}-admin`,
      email: contactEmail.toLowerCase().trim(),
      password: contactPassword,
      fullName: contactName || `${companyName} Administrador`,
      tenantId: newTenantId,
      role: 'tenant_admin',
      jobTitle: contactJobTitle || 'Director General',
      level: contactLevel,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      notes: `Alta autorizada por Claudio Pulido para ${companyName}`,
      mustChangePassword: true,
    };

    onComplete(newTenant, newUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#dadce0] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Encabezado del Wizard con Pasos */}
        <div className="px-6 py-4 bg-[#f8f9fa] border-b border-[#dadce0] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#e8f0fe] text-[#0b57d0] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1f1f1f]">Wizard de Alta &amp; Expediente Digital</h3>
                <p className="text-[11px] text-[#5f6368]">
                  Onboarding corporativo automatizado &bull; Emisión instantánea de 4 documentos en PDF
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e0e2ec] transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Stepper Visual */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[
              { num: 1, label: 'Identidad Fiscal', icon: Building2 },
              { num: 2, label: 'Arquitectura & Canales', icon: Cpu },
              { num: 3, label: 'Precios & Meta ROI', icon: DollarSign },
              { num: 4, label: 'Credenciales Director', icon: Key },
            ].map((step) => {
              const isActive = currentStep === step.num;
              const isDone = currentStep > step.num;
              return (
                <div
                  key={step.num}
                  className={`flex flex-col items-center text-center p-2 rounded-xl transition border ${
                    isActive
                      ? 'bg-white border-[#0b57d0] shadow-xs'
                      : isDone
                      ? 'bg-[#e8f0fe] border-[#d3e3fd]'
                      : 'bg-white/50 border-transparent text-[#747775]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                      isActive
                        ? 'bg-[#0b57d0] text-white'
                        : isDone
                        ? 'bg-[#137333] text-white'
                        : 'bg-[#e0e2ec] text-[#5f6368]'
                    }`}
                  >
                    {isDone ? '✓' : step.num}
                  </div>
                  <span
                    className={`text-[10px] font-medium line-clamp-1 ${
                      isActive ? 'text-[#0b57d0] font-bold' : isDone ? 'text-[#1f1f1f]' : 'text-[#747775]'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contenido Dinámico de Cada Paso */}
        <form onSubmit={handleNextStep} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {currentStep === 1 && (
            <Step1CorporateIdentity
              companyName={companyName}
              setCompanyName={setCompanyName}
              legalBusinessName={legalBusinessName}
              setLegalBusinessName={setLegalBusinessName}
              rfc={rfc}
              setRfc={setRfc}
              taxAddress={taxAddress}
              setTaxAddress={setTaxAddress}
              industry={industry}
              setIndustry={setIndustry}
              legalRepresentative={legalRepresentative}
              setLegalRepresentative={setLegalRepresentative}
              emojiLogo={emojiLogo}
              setEmojiLogo={setEmojiLogo}
              contactName={contactName}
              setContactName={setContactName}
            />
          )}

          {currentStep === 2 && (
            <Step2ChannelsArchitecture
              waNumber={waNumber}
              setWaNumber={setWaNumber}
              enableWebchat={enableWebchat}
              setEnableWebchat={setEnableWebchat}
              enableInstagram={enableInstagram}
              setEnableInstagram={setEnableInstagram}
              selectedCrm={selectedCrm}
              setSelectedCrm={setSelectedCrm}
              selectedCalendar={selectedCalendar}
              setSelectedCalendar={setSelectedCalendar}
              knowledgeNotes={knowledgeNotes}
              setKnowledgeNotes={setKnowledgeNotes}
            />
          )}

          {currentStep === 3 && (
            <Step3PricingMeta
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              billingPeriod={billingPeriod}
              setBillingPeriod={setBillingPeriod}
              metaExpectedVolume={metaExpectedVolume}
              setMetaExpectedVolume={setMetaExpectedVolume}
              estimatedMetaCostMxn={estimatedMetaCostMxn}
              projectedSavingsMonthly={projectedSavingsMonthly}
              daysToRoi={daysToRoi}
            />
          )}

          {currentStep === 4 && (
            <Step4Credentials
              contactName={contactName}
              setContactName={setContactName}
              contactJobTitle={contactJobTitle}
              setContactJobTitle={setContactJobTitle}
              contactLevel={contactLevel}
              setContactLevel={setContactLevel}
              contactEmail={contactEmail}
              setContactEmail={setContactEmail}
              contactPassword={contactPassword}
              copiedPassword={copiedPassword}
              setCopiedPassword={setCopiedPassword}
              onRegeneratePassword={() => setContactPassword(generateSecureTempPassword())}
            />
          )}

          {/* Footer de Navegación del Wizard */}
          <div className="pt-4 border-t border-[#dadce0] flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => ((prev - 1) as 1 | 2 | 3 | 4))}
                className="px-4 py-2 rounded-full bg-white hover:bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0] font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full bg-white hover:bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0] font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>Continuar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2 rounded-full bg-[#137333] hover:bg-[#0f5b28] text-white font-bold transition cursor-pointer flex items-center gap-2 shadow-md shadow-[#137333]/20"
              >
                <Zap className="w-4 h-4" />
                <span>Dar de Alta &amp; Emitir Expediente Digital</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
