'use client';

import React from 'react';
import { Tenant } from '../../types/platform';
import { ValentinaLogo } from '../ValentinaLogo';
import {
  FileText,
  ShieldCheck,
  Building2,
  Calendar,
  Lock
} from 'lucide-react';

interface Props {
  tenant: Tenant;
}

export const ExecutiveAgreementSheet: React.FC<Props> = ({ tenant }) => {
  const folio = `CONV-SRV-${new Date().getFullYear()}-${tenant.id.replace('tenant-', '').slice(0, 6).toUpperCase()}`;
  const todayFormatted = new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const planName = tenant.plan || 'Scale';
  const isScale = planName === 'Scale';
  const isGrowth = planName === 'Growth';
  const defaultSetup = isScale ? 16500 : isGrowth ? 8500 : 25000;
  const defaultMonthly = isScale ? 5600 : isGrowth ? 2800 : 9500;

  const setupFee = tenant.setupFeeMxn ?? tenant.selectedPlanDetails?.setupFee ?? defaultSetup;
  const monthlyFee = tenant.subscriptionFeeMxn ?? tenant.selectedPlanDetails?.monthlyFee ?? defaultMonthly;
  const billingPeriod = tenant.billingPeriod || tenant.selectedPlanDetails?.billingPeriod || 'monthly';
  const isAnnual = billingPeriod === 'annual';

  const clientName = tenant.legalBusinessName || tenant.name;
  const clientRfc = tenant.rfc || 'RFC NO PROVISTO / EN REGISTRO';
  const clientAddress = tenant.taxAddress || 'Domicilio no provisto';
  const clientRep = tenant.legalRepresentative || 'Representante Legal Autorizado';

  return (
    <div className="space-y-8 max-w-4xl mx-auto printable-agreement font-sans">
      {/* ========================================================================= */}
      {/* PÁGINA 1: DECLARACIONES & OBJETO */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-10 md:p-12 text-[#1f1f1f] space-y-6 printable-page shadow-sm border border-[#dadce0] rounded-xl print:shadow-none print:border-none">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b-2 border-[#1f1f1f] gap-4">
          <div className="flex items-center gap-3">
            <ValentinaLogo size="md" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1f1f1f] leading-none">
                VALENTINA AI
              </h1>
              <span className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-widest">
                Estudio de Ingeniería de IA &bull; Marco Legal B2B
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs">
            <div className="inline-block px-2.5 py-1 rounded bg-[#f1f3f4] text-[#1f1f1f] font-mono font-bold border border-[#dadce0]">
              FOLIO: {folio}
            </div>
            <div className="text-[#5f6368]">
              <strong>JURISDICCIÓN:</strong> Querétaro, Qro., México
            </div>
            <div className="text-[11px] text-[#0b57d0] font-semibold">
              Régimen Mercantil Corporativo B2B
            </div>
          </div>
        </div>

        {/* Título Principal */}
        <div className="space-y-1 text-center py-2 border-b border-[#dadce0] pb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f0fe] text-[#0b57d0] border border-[#d3e3fd]">
            <FileText className="w-3.5 h-3.5" /> Convenio Mercantil de Prestación de Servicios
          </span>
          <h2 className="text-base sm:text-lg font-bold text-[#1f1f1f] uppercase tracking-wide pt-2">
            Convenio de Prestación de Servicios de Ingeniería de Inteligencia Artificial y Automatización
          </h2>
          <p className="text-xs text-[#5f6368] max-w-2xl mx-auto">
            Celebrado entre <strong>VALENTINA AI S.A.S.</strong> (en adelante &quot;EL PRESTADOR&quot;) y{' '}
            <strong className="text-[#1f1f1f]">{clientName}</strong> (en adelante &quot;EL CLIENTE&quot;), representada en este acto por {clientRep}.
          </p>
        </div>

        {/* Declaraciones */}
        <div className="space-y-3 text-xs leading-relaxed text-[#3c4043]">
          <h3 className="font-bold text-[#1f1f1f] uppercase tracking-wider text-[11px]">DECLARACIONES</h3>
          <p>
            <strong>I. Declara EL PRESTADOR:</strong> Ser una sociedad mercantil legalmente constituida conforme a las leyes mexicanas, con domicilio corporativo en Manuel Gómez Morín 3960, Centro Sur, Querétaro, Qro., con facultades plenas para el diseño, entrenamiento, orquestación y despliegue de infraestructura de software y agentes de Inteligencia Artificial.
          </p>
          <p>
            <strong>II. Declara EL CLIENTE:</strong> Ser una persona moral o física con actividad empresarial legalmente constituida bajo la denominación social <strong>{clientName}</strong>, con RFC <strong>{clientRfc}</strong> y domicilio fiscal en <em>{clientAddress}</em>, interesada en automatizar sus flujos comerciales y de atención mediante los servicios especializados del PRESTADOR.
          </p>
        </div>

        {/* Cláusulas 1 a 3 */}
        <div className="space-y-4 text-xs leading-relaxed text-[#3c4043] pt-2">
          <h3 className="font-bold text-[#1f1f1f] uppercase tracking-wider text-[11px]">CLÁUSULAS</h3>

          <div>
            <strong className="text-[#1f1f1f]">PRIMERA. OBJETO DEL CONVENIO:</strong> EL PRESTADOR se obliga a prestar sus servicios de ingeniería para diseñar, configurar, entrenar y mantener operativo el ecosistema de IA bajo el <strong>Plan {planName}</strong>, interconectando el canal oficial de WhatsApp Business Cloud API y los canales secundarios autorizados, conforme a las especificaciones técnicas del expediente digital.
          </div>

          <div>
            <strong className="text-[#1f1f1f]">SEGUNDA. CONTRAPRESTACIÓN Y CONDICIONES DE PAGO:</strong>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>
                <strong>Costo de Implementación (Setup):</strong> Monto fijado en <strong>${setupFee.toLocaleString('es-MX')} MXN</strong>, pagadero {isAnnual ? 'en una sola exhibición al 50% bonificado' : '50% como anticipo a la firma de este instrumento y 50% a la entrega y pase a producción'}.
              </li>
              <li>
                <strong>Suscripción Mensual de Operación (MRR):</strong> Cuota fija de <strong>${monthlyFee.toLocaleString('es-MX')} MXN/mes</strong> ({isAnnual ? 'facturación anual adelantada con 2 meses bonificados' : 'facturado al inicio de cada periodo mensual'}), que cubre inferencia de modelos, infraestructura multi-tenant, monitoreo continuo y calibración periódica.
              </li>
            </ul>
          </div>

          <div>
            <strong className="text-[#1f1f1f]">TERCERA. DELIMITACIÓN DE TARIFAS DE META Y TERCEROS:</strong>
            <p className="mt-1">
              Las partes reconocen que Meta Platforms Inc. opera como operador independiente de telecomunicación. EL CLIENTE registrará su propia tarjeta bancaria en Meta Business Suite para liquidar directamente el consumo de mensajería (tarifa oficial de $0.0085 USD/mensaje tras los 1,000 gratuitos mensuales). EL PRESTADOR no recarga margen alguno sobre las tarifas de Meta ni asume responsabilidad por suspensiones derivadas de impago a Meta.
            </p>
          </div>

          {/* Callout de Confidencialidad LFPDPPP */}
          <div className="p-3.5 rounded-xl bg-[#e8f0fe] border border-[#d3e3fd] text-[11px] text-[#041e49] space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-[#0b57d0]">
              <ShieldCheck className="w-4 h-4" /> Titularidad de Datos y Privacidad (LFPDPPP)
            </div>
            <p className="text-[#3c4043]">
              EL CLIENTE es y será el único titular y propietario exclusivo de sus bases de datos, catálogos, contactos y el historial de conversaciones. EL PRESTADOR procesará la información con estricto apego a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
            </p>
          </div>
        </div>

        {/* Pie Página 1 */}
        <div className="pt-4 border-t border-[#dadce0] flex justify-between text-[10px] text-[#747775]">
          <div>VALENTINA AI &bull; CONVENIO COMERCIAL &bull; REF: {folio}</div>
          <div>Página 01 de 02</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PÁGINA 2: CLÁUSULAS OPERATIVAS, CARÁTULA Y FIRMAS */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-10 md:p-12 text-[#1f1f1f] space-y-6 printable-page shadow-sm border border-[#dadce0] rounded-xl print:shadow-none print:border-none">
        {/* Encabezado Pág 2 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b-2 border-[#1f1f1f] gap-4">
          <div className="flex items-center gap-3">
            <ValentinaLogo size="md" />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#1f1f1f] leading-none">
                VALENTINA AI
              </h2>
              <span className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-widest">
                Hoja de Cierre, Carátula & Firmas
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs">
            <div className="inline-block px-2.5 py-1 rounded bg-[#f1f3f4] text-[#1f1f1f] font-mono font-bold border border-[#dadce0]">
              FOLIO: {folio}
            </div>
            <div className="text-[#5f6368]">
              Fecha: {todayFormatted}
            </div>
          </div>
        </div>

        {/* Cláusulas 4 a 8 */}
        <div className="space-y-3.5 text-xs leading-relaxed text-[#3c4043]">
          <div>
            <strong className="text-[#1f1f1f]">CUARTA. PROPIEDAD INTELECTUAL DEL MOTOR:</strong> El código fuente del orquestador, los guardrails anti-alucinaciones y la plataforma tecnológica Valentina AI son propiedad intelectual exclusiva de EL PRESTADOR. Se concede a EL CLIENTE una licencia de uso corporativa, no exclusiva y revocable durante la vigencia de su suscripción.
          </div>

          <div>
            <strong className="text-[#1f1f1f]">QUINTA. NIVELES DE SERVICIO (SLA) Y DISPONIBILIDAD:</strong> EL PRESTADOR garantiza una disponibilidad técnica de la infraestructura del 99.9% anual (excluyendo ventanas de mantenimiento programadas o caídas generales de Meta/WhatsApp). El tiempo de respuesta de soporte técnico es menor a 12 horas hábiles.
          </div>

          <div>
            <strong className="text-[#1f1f1f]">SEXTA. GARANTÍA DE CALIBRACIÓN DE 30 DÍAS:</strong> Durante los primeros 30 (treinta) días naturales posteriores a la entrega de credenciales, EL PRESTADOR realizará todas las calibraciones semánticas en la base de conocimientos sin costo adicional hasta alcanzar la satisfacción operativa de EL CLIENTE.
          </div>

          <div>
            <strong className="text-[#1f1f1f]">SÉPTIMA. VIGENCIA Y TERMINACIÓN:</strong> En modalidad mensual, EL CLIENTE podrá dar por terminado el servicio en cualquier momento con aviso previo de 30 días naturales sin penalización alguna. A la terminación, EL PRESTADOR entregará un respaldo íntegro de conversaciones y contactos y purgará los vectores de su bóveda.
          </div>

          <div>
            <strong className="text-[#1f1f1f]">OCTAVA. JURISDICCIÓN Y LEYES APLICABLES:</strong> Para cualquier controversia, las partes se someten a la competencia de los tribunales de la ciudad de <strong>Santiago de Querétaro, Querétaro</strong>, renunciando a cualquier otro fuero que pudiera corresponderles.
          </div>
        </div>

        {/* Carátula de Contratación Personalizada */}
        <div className="p-4 rounded-xl bg-[#f8f9fa] border-2 border-[#dadce0] space-y-3 text-xs">
          <div className="text-[11px] font-bold text-[#0b57d0] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#dadce0] pb-2">
            <Building2 className="w-4 h-4" /> CARÁTULA DE CONTRATACIÓN (DATOS VALIDADOS)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-[#5f6368] block">Razón Social Contratante:</span>
              <strong className="text-[#1f1f1f] text-xs">{clientName}</strong>
            </div>
            <div>
              <span className="text-[#5f6368] block">RFC:</span>
              <strong className="font-mono text-[#1f1f1f] text-xs">{clientRfc}</strong>
            </div>
            <div>
              <span className="text-[#5f6368] block">Plan Contratado:</span>
              <strong className="text-[#6D28D9] text-xs">Plan {planName}</strong>
            </div>
            <div>
              <span className="text-[#5f6368] block">Esquema de Pago:</span>
              <strong className="text-[#1f1f1f] text-xs">{isAnnual ? 'Pago Anual (Ahorro 2 meses)' : 'Mensual Recurrente'}</strong>
            </div>
            <div>
              <span className="text-[#5f6368] block">Inversión Setup:</span>
              <strong className="font-mono text-[#1f1f1f] text-xs">${setupFee.toLocaleString('es-MX')} MXN</strong>
            </div>
            <div>
              <span className="text-[#5f6368] block">Suscripción Mensual (MRR):</span>
              <strong className="font-mono text-[#0b57d0] text-xs">${monthlyFee.toLocaleString('es-MX')} MXN / mes</strong>
            </div>
          </div>
        </div>

        {/* Bloque de Firmas */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
          <div className="space-y-2">
            <div className="border-b-2 border-[#1f1f1f] pb-12"></div>
            <div className="font-bold text-[#1f1f1f]">VALENTINA AI S.A.S.</div>
            <div className="text-[11px] text-[#5f6368]">Ingeniería & Representación Legal</div>
            <div className="text-[10px] text-[#137333] font-mono">Firma Digital Verificada: SHA-256</div>
          </div>

          <div className="space-y-2">
            <div className="border-b-2 border-[#1f1f1f] pb-12"></div>
            <div className="font-bold text-[#1f1f1f]">{clientRep.toUpperCase()}</div>
            <div className="text-[11px] text-[#5f6368]">
              {clientName} &bull; Representante Legal
            </div>
            <div className="text-[10px] text-[#5f6368]">Acepto términos y condiciones comerciales</div>
          </div>
        </div>

        {/* Pie Página 2 */}
        <div className="pt-6 border-t border-[#dadce0] flex justify-between text-[10px] text-[#747775]">
          <div>VALENTINA AI &bull; Sede Central: Querétaro, Qro. &bull; contacto@valentina-ai.mx</div>
          <div>Página 02 de 02</div>
        </div>
      </div>
    </div>
  );
};
