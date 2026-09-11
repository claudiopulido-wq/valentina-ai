'use client';

import React from 'react';
import { Tenant } from '../../types/platform';
import { ValentinaLogo } from '../ValentinaLogo';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  FileText,
  FolderSync,
  Sparkles
} from 'lucide-react';

interface Props {
  tenant: Tenant;
}

export const ExecutiveQuoteSheet: React.FC<Props> = ({ tenant }) => {
  const folio = `COT-VAL-${new Date().getFullYear()}-${tenant.id.replace('tenant-', '').slice(0, 6).toUpperCase()}`;
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

  // Cálculos de ahorro y ROI
  const projectedSavingsMonthly = tenant.selectedPlanDetails?.projectedMonthlySavingsMxn || 39600;
  const daysToRoi = Math.max(7, Math.round((setupFee / (projectedSavingsMonthly / 30))));
  const estimatedMessages = tenant.selectedPlanDetails?.estimatedMetaMessages || 1500;
  const estimatedMetaCost = tenant.selectedPlanDetails?.estimatedMetaCostMxn || 128;

  return (
    <div className="bg-white p-6 sm:p-10 md:p-12 text-[#1f1f1f] space-y-6 max-w-4xl mx-auto printable-sheet font-sans">
      {/* Membrete Oficial Superior */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b-2 border-[#1f1f1f] gap-4">
        <div className="flex items-center gap-3">
          <ValentinaLogo size="md" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1f1f1f] leading-none">
              VALENTINA AI
            </h1>
            <span className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-widest">
              Estudio de Ingeniería de IA &bull; Soluciones B2B
            </span>
          </div>
        </div>

        <div className="text-left sm:text-right space-y-1 text-xs">
          <div className="inline-block px-2.5 py-1 rounded bg-[#f1f3f4] text-[#1f1f1f] font-mono font-bold border border-[#dadce0]">
            FOLIO: {folio}
          </div>
          <div className="text-[#5f6368] flex items-center sm:justify-end gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Fecha de Emisión: {todayFormatted}</span>
          </div>
          <div className="text-[11px] text-[#137333] font-semibold flex items-center sm:justify-end gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Propuesta Formal con Garantía de 30 Días</span>
          </div>
        </div>
      </div>

      {/* Título y Resumen del Destinatario */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0] text-xs">
        <div className="md:col-span-2 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0b57d0] flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> Organización Titular
          </span>
          <h2 className="text-base font-bold text-[#1f1f1f] flex items-center gap-2">
            <span>{tenant.logo || '🏢'}</span>
            <span>{tenant.legalBusinessName || tenant.name}</span>
          </h2>
          {tenant.rfc && (
            <p className="text-[#5f6368] font-mono text-[11px]">
              <strong>RFC:</strong> {tenant.rfc}
            </p>
          )}
          {tenant.taxAddress && (
            <p className="text-[#5f6368] text-[11px] line-clamp-1">
              <strong>Domicilio Fiscal:</strong> {tenant.taxAddress}
            </p>
          )}
          {tenant.legalRepresentative && (
            <p className="text-[#5f6368] text-[11px]">
              <strong>Atención / Representante:</strong> {tenant.legalRepresentative} ({tenant.legalRepresentativeTitle || 'Titular'})
            </p>
          )}
        </div>

        <div className="space-y-1 md:border-l md:border-[#dadce0] md:pl-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368]">
            Plan & Modalidad
          </span>
          <div className="text-sm font-bold text-[#6D28D9]">
            Plan {planName} {isScale && '⚡ Recomendado'}
          </div>
          <div className="text-xs text-[#1f1f1f]">
            Modalidad: <strong>{isAnnual ? 'Anual (2 meses bonificados)' : 'Facturación Mensual'}</strong>
          </div>
          <div className="text-[11px] text-[#5f6368]">
            Vigencia de cotización: <strong>15 días naturales</strong>
          </div>
        </div>
      </div>

      {/* Tabla Desglose de Inversión */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1f1f1f] flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-[#0b57d0]" /> 1. Desglose Formal de Inversión Profesional
        </h3>
        <div className="overflow-x-auto border border-[#dadce0] rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f1f3f4] text-[#1f1f1f] border-b border-[#dadce0]">
                <th className="p-3 font-semibold">Concepto / Etapa</th>
                <th className="p-3 font-semibold">Modalidad de Pago</th>
                <th className="p-3 font-semibold text-right">Inversión (MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dadce0]">
              <tr>
                <td className="p-3">
                  <div className="font-bold text-[#1f1f1f]">Implementación, Ingesta & Calibración (Setup)</div>
                  <div className="text-[#5f6368] text-[11px]">
                    Arquitectura de guardrails anti-alucinaciones, ingesta vectorial (RAG) de catálogos y políticas, conexión WhatsApp Cloud API y pruebas de carga.
                  </div>
                </td>
                <td className="p-3 text-[#5f6368]">
                  {isAnnual ? 'Pago Único (50% Bonificado en Anual)' : '50% Anticipo / 50% Entrega'}
                </td>
                <td className="p-3 text-right font-mono font-bold text-sm text-[#1f1f1f]">
                  ${setupFee.toLocaleString('es-MX')} MXN
                </td>
              </tr>
              <tr>
                <td className="p-3">
                  <div className="font-bold text-[#1f1f1f]">Suscripción Mensual de Operación & Mantenimiento</div>
                  <div className="text-[#5f6368] text-[11px]">
                    Alojamiento dedicado, tokens de IA de alta velocidad, monitoreo 24/7 de disponibilidad (99.9% SLA) y hasta 2 horas mensuales de soporte y calibración.
                  </div>
                </td>
                <td className="p-3 text-[#5f6368]">
                  {isAnnual ? 'Facturado Anual (10 meses pagados / 2 meses bonificados)' : 'Facturación Mensual Recurrente'}
                </td>
                <td className="p-3 text-right font-mono font-bold text-sm text-[#0b57d0]">
                  ${monthlyFee.toLocaleString('es-MX')} MXN / mes
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Servicios y Módulos Adicionales Disponibles */}
      <div className="p-3.5 rounded-xl bg-[#faf5ff] border border-[#e9d5ff] space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#6D28D9] uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" /> Otros Servicios que Puedes Contratar (Módulos On-Demand)
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#f3e8ff] text-[#6D28D9] text-[10px] font-bold border border-[#d8b4fe]">
            Activación con 1 Clic
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-white border border-[#e9d5ff] flex items-start gap-2.5">
            <div className="p-1.5 rounded-md bg-[#ede9fe] text-[#6D28D9] shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#1f1f1f] text-[11px]">Envío Automatizado de Documentos PDF</div>
              <div className="text-[#5f6368] text-[10px] leading-tight mt-0.5">
                Despacho dinámico de comprobantes, fichas técnicas, contratos o estados de cuenta en formato PDF oficial por WhatsApp y correo.
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-[#e9d5ff] flex items-start gap-2.5">
            <div className="p-1.5 rounded-md bg-[#ede9fe] text-[#6D28D9] shrink-0 mt-0.5">
              <FolderSync className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#1f1f1f] text-[11px]">Organización y Respaldo en Google Drive</div>
              <div className="text-[#5f6368] text-[10px] leading-tight mt-0.5">
                Clasificación automática de documentos recibidos, creación de carpetas por cliente/alumno y respaldo cloud seguro.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proyección de ROI y Retorno de Inversión */}
      <div className="p-4 rounded-xl bg-[#e8f0fe] border border-[#d3e3fd] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#0b57d0] font-bold text-xs uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>2. Proyección Financiera y Retorno de Inversión (ROI)</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-white text-[#0b57d0] font-mono text-[10px] font-bold border border-[#d3e3fd]">
            Amortización en ~{daysToRoi} Días
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-white border border-[#d3e3fd]">
            <span className="text-[11px] text-[#5f6368] block">Ahorro Mensual Proyectado:</span>
            <div className="text-base font-extrabold text-[#137333] font-mono mt-0.5">
              +${projectedSavingsMonthly.toLocaleString('es-MX')} MXN
            </div>
            <span className="text-[10px] text-[#5f6368]">Equivalente a 1.5 plazas operativas</span>
          </div>

          <div className="p-3 rounded-lg bg-white border border-[#d3e3fd]">
            <span className="text-[11px] text-[#5f6368] block">Tiempo de Recuperación de Setup:</span>
            <div className="text-base font-extrabold text-[#0b57d0] font-mono mt-0.5">
              {daysToRoi} Días Hábiles
            </div>
            <span className="text-[10px] text-[#5f6368]">Desde el encendido en producción</span>
          </div>

          <div className="p-3 rounded-lg bg-white border border-[#d3e3fd]">
            <span className="text-[11px] text-[#5f6368] block">Retorno Anualizado Neto:</span>
            <div className="text-base font-extrabold text-[#7627bb] font-mono mt-0.5">
              +${((projectedSavingsMonthly - monthlyFee) * 12).toLocaleString('es-MX')} MXN
            </div>
            <span className="text-[10px] text-[#5f6368]">Beneficio neto directo al EBITDA</span>
          </div>
        </div>
      </div>

      {/* Desglose Transparente de Telecomunicaciones Meta (WhatsApp) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1f1f1f] flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-[#e37400]" /> 3. Transparencia en Telecomunicaciones (Meta Cloud API)
        </h3>
        <div className="p-4 rounded-xl bg-[#fef7e0] border border-[#feefc3] text-xs space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#b06000] shrink-0 mt-0.5" />
            <p className="text-[#5f6368] text-[11px] leading-relaxed">
              <strong>Política Anti-Comisiones Ocultas:</strong> Valentina AI no cobra tarifas por mensaje. Meta Platforms Inc. aplica una tarifa pública directa de <strong>$0.0085 USD (~$0.15 MXN)</strong> por mensaje de servicio (después de los primeros 1,000 gratuitos mensuales), facturados directo a la tarjeta del cliente en su Business Manager.
            </p>
          </div>
          <div className="pt-2 border-t border-[#feefc3] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
            <span className="text-[#5f6368]">
              Volumen Estimado: <strong>~{estimatedMessages.toLocaleString()} mensajes/mes</strong>
            </span>
            <span className="text-[#b06000] font-bold">
              Consumo proyectado Meta: ~${estimatedMetaCost} MXN / mes (facturado directo por Meta)
            </span>
          </div>
        </div>
      </div>

      {/* Condiciones de Pago y Banco */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
        <div className="p-3.5 rounded-xl border border-[#dadce0] bg-[#f8f9fa] space-y-1.5">
          <span className="font-bold text-[#1f1f1f] block text-[11px] uppercase tracking-wider">
            Datos Bancarios Oficiales (Transferencia SPEI)
          </span>
          <div className="font-mono text-[11px] space-y-0.5 text-[#1f1f1f]">
            <div><strong>Beneficiario:</strong> VALENTINA AI S.A.S.</div>
            <div><strong>Banco:</strong> BBVA México</div>
            <div><strong>CLABE Interbancaria:</strong> 012 680 01589412039 1</div>
            <div><strong>Concepto:</strong> Setup {tenant.name.slice(0, 15)}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#dadce0] bg-[#f8f9fa] space-y-1.5">
          <span className="font-bold text-[#1f1f1f] block text-[11px] uppercase tracking-wider">
            Garantías de Entrega y Calidad
          </span>
          <ul className="text-[11px] text-[#5f6368] space-y-1">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] shrink-0" />
              <span>Garantía de 30 días de calibración sin costo.</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] shrink-0" />
              <span>Titularidad 100% exclusiva de sus bases de datos.</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] shrink-0" />
              <span>Entrega de acceso al portal oficial en 10 a 21 días.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Pie de Página Membretado */}
      <div className="pt-4 border-t border-[#dadce0] flex flex-col sm:flex-row items-center justify-between text-[10px] text-[#747775]">
        <div>VALENTINA AI S.A.S. &bull; Manuel Gómez Morín 3960, Centro Sur, Querétaro, Qro.</div>
        <div>Mesa de Atención: contacto@valentina-ai.mx &bull; valentina-ai.mx</div>
      </div>
    </div>
  );
};
