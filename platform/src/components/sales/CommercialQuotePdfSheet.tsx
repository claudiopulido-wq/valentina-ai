'use client';

import React from 'react';
import { CommercialQuote } from '../../types/platform';
import { ValentinaLogo } from '../ValentinaLogo';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Clock,
  UserCheck,
  CheckSquare,
  AlertCircle,
  FileText,
  FolderSync,
  Layers,
  Sparkles
} from 'lucide-react';

interface Props {
  quote: CommercialQuote;
}

export const CommercialQuotePdfSheet: React.FC<Props> = ({ quote }) => {
  const isAnnual = quote.billingPeriod === 'annual';

  return (
    <div className="bg-white p-6 sm:p-10 md:p-12 text-[#1f1f1f] space-y-6 max-w-4xl mx-auto printable-sheet font-sans border border-[#dadce0] rounded-xl shadow-sm print:shadow-none print:border-none">
      
      {/* 1. Membrete Oficial Superior */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b-2 border-[#1f1f1f] gap-4">
        <div className="flex items-center gap-3">
          <ValentinaLogo size="md" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1f1f1f] leading-none">
              VALENTINA AI
            </h1>
            <span className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-widest">
              Estudio de Ingeniería de IA &bull; Propuesta Comercial Oficial
            </span>
          </div>
        </div>

        <div className="text-left sm:text-right space-y-1 text-xs">
          <div className="inline-block px-2.5 py-1 rounded bg-[#f1f3f4] text-[#1f1f1f] font-mono font-bold border border-[#dadce0]">
            FOLIO: {quote.folio}
          </div>
          <div className="text-[#5f6368] flex items-center sm:justify-end gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Fecha: {quote.createdAt} &bull; Vigencia: {quote.expiresAt}</span>
          </div>
          <div className="text-[11px] text-[#0b57d0] font-semibold">
            POLÍTICA COMERCIAL: POL-COM-VAL-2026-B
          </div>
        </div>
      </div>

      {/* 2. Título y Resumen del Prospecto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0] text-xs">
        <div className="md:col-span-2 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0b57d0] flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> Prospecto / Organización Destinataria
          </span>
          <h2 className="text-base font-bold text-[#1f1f1f]">
            {quote.companyName}
          </h2>
          <p className="text-[#5f6368] text-[11px]">
            <strong>Atención:</strong> {quote.contactName} {quote.contactJobTitle ? `(${quote.contactJobTitle})` : ''}
          </p>
          <p className="text-[#5f6368] text-[11px] font-mono">
            <strong>Correo:</strong> {quote.contactEmail} &bull; <strong>WhatsApp:</strong> {quote.contactPhone}
          </p>
          <p className="text-[#5f6368] text-[11px]">
            <strong>Giro:</strong> {quote.industry}
          </p>
        </div>

        <div className="space-y-1 md:border-l md:border-[#dadce0] md:pl-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368]">
            Solución Recomendada
          </span>
          <div className="text-sm font-bold text-[#6D28D9]">
            Plan {quote.plan} {quote.plan === 'Scale' && '⚡ Recomendado'}
          </div>
          <div className="text-xs text-[#1f1f1f]">
            Modalidad: <strong>{isAnnual ? 'Anual (2 meses bonificados + 50% desc setup)' : 'Facturación Mensual'}</strong>
          </div>
          <div className="text-[11px] text-[#137333] font-medium flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Garantía de Calibración 30 Días</span>
          </div>
        </div>
      </div>

      {/* 3. Diagnóstico Operativo: El Dolor Actual vs Solución Valentina */}
      <div className="p-4 rounded-xl bg-[#fef7e0] border border-[#feefc3] space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#843800] uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-[#b06000]" /> 1. Diagnóstico de Eficiencia Operativa Actual
          </span>
          <span className="font-mono text-[11px] text-[#b06000] font-bold">
            Costo Actual Humano: ~${quote.currentHumanCostMxn.toLocaleString('es-MX')} MXN/mes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
          <div className="p-2.5 rounded-lg bg-white border border-[#feefc3]">
            <span className="text-[#5f6368] block">Personal en Atención:</span>
            <strong className="text-[#1f1f1f] text-xs mt-0.5 block">
              {quote.currentStaffCount} {quote.currentStaffCount === 1 ? 'Asesor / Recepcionista' : 'Asesores / Recepcionistas'}
            </strong>
            <span className="text-[10px] text-[#5f6368]">
              Sueldo base + cargas: ~${quote.staffSalaryMxn.toLocaleString('es-MX')} MXN c/u
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-[#feefc3]">
            <span className="text-[#5f6368] block">Volumen Mensual:</span>
            <strong className="text-[#1f1f1f] text-xs mt-0.5 block">
              ~{quote.normalMonthlyVolume.toLocaleString()} conversaciones
            </strong>
            <span className="text-[10px] text-[#5f6368]">
              Temporada Alta: ~{quote.peakMonthlyVolume.toLocaleString()} chats/mes
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-[#feefc3]">
            <span className="text-[#5f6368] block">Fuga Fuera de Horario:</span>
            <strong className="text-[#b06000] text-xs mt-0.5 block">
              ~{quote.missedOffHoursPercent || 35}% de prospectos perdidos
            </strong>
            <span className="text-[10px] text-[#5f6368]">
              Noches y fines de semana sin respuesta
            </span>
          </div>
        </div>
      </div>

      {/* 4. Alcance Modular Incluido */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1f1f1f] flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4 text-[#0b57d0]" /> 2. Alcance Técnico y Módulos Incluidos en la Propuesta
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {quote.selectedFeatures.map((feat, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-[#f8f9fa] border border-[#dadce0] flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#137333] shrink-0 mt-0.5" />
              <span className="text-[#1f1f1f] font-medium text-[11px] leading-tight">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4.1 Otros Servicios y Módulos que Puedes Contratar (Add-ons On-Demand) */}
      <div className="p-3.5 rounded-xl bg-[#faf5ff] border border-[#e9d5ff] space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#6D28D9] uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" /> Otros Servicios que Puedes Contratar (Módulos On-Demand)
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#f3e8ff] text-[#6D28D9] text-[10px] font-bold border border-[#d8b4fe]">
            Activación con 1 Clic
          </span>
        </div>
        <p className="text-[#4b5563] text-[11px] leading-relaxed">
          Complementos de alto impacto disponibles para integración inmediata a tu ecosistema operativo:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-white border border-[#e9d5ff] flex items-start gap-2.5">
            <div className="p-1.5 rounded-md bg-[#ede9fe] text-[#6D28D9] shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#1f1f1f] text-[11px]">Envío Automatizado de Documentos PDF</div>
              <div className="text-[#5f6368] text-[10px] leading-tight mt-0.5">
                Generación y despacho programático de fichas de pago, estados de cuenta, pólizas, credenciales y constancias en PDF oficial por WhatsApp y correo.
              </div>
              <span className="inline-block mt-1 text-[9.5px] font-semibold text-[#059669]">
                ✓ Disponible para activar
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-[#e9d5ff] flex items-start gap-2.5">
            <div className="p-1.5 rounded-md bg-[#ede9fe] text-[#6D28D9] shrink-0 mt-0.5">
              <FolderSync className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#1f1f1f] text-[11px]">Organización y Respaldo en Google Drive</div>
              <div className="text-[#5f6368] text-[10px] leading-tight mt-0.5">
                Clasificación automática de documentos recibidos (identificaciones, comprobantes, contratos), creación de carpetas por cliente/alumno y respaldo cloud seguro.
              </div>
              <span className="inline-block mt-1 text-[9.5px] font-semibold text-[#059669]">
                ✓ Sincronización Google Workspace
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Tabla Desglose de Inversión Profesional */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1f1f1f] flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-[#0b57d0]" /> 3. Condiciones Comerciales e Inversión (POL-COM-VAL-2026-B)
        </h3>
        <div className="overflow-x-auto border border-[#dadce0] rounded-xl text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f1f3f4] text-[#1f1f1f] border-b border-[#dadce0]">
                <th className="p-3 font-semibold">Concepto</th>
                <th className="p-3 font-semibold">Condición de Pago</th>
                <th className="p-3 font-semibold text-right">Inversión (MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dadce0]">
              <tr>
                <td className="p-3">
                  <div className="font-bold text-[#1f1f1f]">Implementación & Calibración Inicial (Setup Fee)</div>
                  <div className="text-[#5f6368] text-[11px]">
                    Arquitectura de prompts, guardrails anti-alucinaciones, ingesta RAG, conexión a canales y pruebas de estrés.
                  </div>
                </td>
                <td className="p-3 text-[#5f6368]">
                  {isAnnual ? 'Pago Único (50% Descuento Aplicado)' : '50% Anticipo a la firma / 50% Entrega'}
                </td>
                <td className="p-3 text-right font-mono font-bold text-sm text-[#1f1f1f]">
                  ${quote.setupFeeMxn.toLocaleString('es-MX')} MXN
                </td>
              </tr>
              <tr>
                <td className="p-3">
                  <div className="font-bold text-[#1f1f1f]">Suscripción Mensual de Operación (MRR)</div>
                  <div className="text-[#5f6368] text-[11px]">
                    Tokens de IA, hosting cloud multi-tenant dedicado, SLA 99.9%, monitoreo continuo y hasta 2h/mes de soporte.
                  </div>
                </td>
                <td className="p-3 text-[#5f6368]">
                  {isAnnual ? 'Facturación Anual (10 meses pagados / 2 meses bonificados)' : 'Facturación Mensual Recurrente'}
                </td>
                <td className="p-3 text-right font-mono font-bold text-sm text-[#0b57d0]">
                  ${quote.monthlyFeeMxn.toLocaleString('es-MX')} MXN / mes
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Cuadro de Retorno de Inversión (ROI) */}
      <div className="p-4 rounded-xl bg-[#e6f4ea] border border-[#ceead6] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#137333] font-bold text-xs uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>4. Proyección Financiera de Retorno de Inversión (ROI)</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-white text-[#137333] font-mono text-[11px] font-bold border border-[#ceead6]">
            Amortización en ~{quote.amortizationDays} Días
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-white border border-[#ceead6]">
            <span className="text-[11px] text-[#5f6368] block">Ahorro Mensual Neto:</span>
            <div className="text-base font-extrabold text-[#137333] font-mono mt-0.5">
              +${quote.monthlySavingsMxn.toLocaleString('es-MX')} MXN / mes
            </div>
            <span className="text-[10px] text-[#5f6368]">
              Costo humano (${quote.currentHumanCostMxn.toLocaleString()}) vs Valentina (${quote.monthlyFeeMxn.toLocaleString()})
            </span>
          </div>

          <div className="p-3 rounded-lg bg-white border border-[#ceead6]">
            <span className="text-[11px] text-[#5f6368] block">Recuperación del Setup:</span>
            <div className="text-base font-extrabold text-[#0b57d0] font-mono mt-0.5">
              {quote.amortizationDays} Días Hábiles
            </div>
            <span className="text-[10px] text-[#5f6368]">
              Desde el encendido en producción
            </span>
          </div>

          <div className="p-3 rounded-lg bg-white border border-[#ceead6]">
            <span className="text-[11px] text-[#5f6368] block">Ahorro Neto Anualizado:</span>
            <div className="text-base font-extrabold text-[#7627bb] font-mono mt-0.5">
              +${quote.netAnnualSavingsMxn.toLocaleString('es-MX')} MXN
            </div>
            <span className="text-[10px] text-[#5f6368]">
              Retorno directo a la rentabilidad del negocio
            </span>
          </div>
        </div>
      </div>

      {/* 7. Transparencia en Telecomunicaciones de Meta */}
      <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0] text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#1f1f1f] uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
            <Zap className="w-4 h-4 text-[#e37400]" /> 5. Delimitación Transparente de Tarifas Meta (Efectiva Octubre 2026)
          </span>
          <span className="font-mono text-[10px] text-[#b06000] font-semibold">
            Meta Pass-Through Oficial ($0.0085 USD/msg)
          </span>
        </div>
        <p className="text-[#5f6368] text-[11px] leading-relaxed">
          Valentina AI no cobra comisiones por mensaje. Meta factura directamente a la tarjeta de crédito que la empresa vincule en su Business Manager. Para un volumen de <strong>{quote.normalMonthlyVolume.toLocaleString()} conversaciones</strong>, el consumo estimado de Meta es de <strong>~${quote.estimatedMetaMonthlyCostMxn} MXN / mes</strong> (tras agotar la cuota mensual gratuita de 1,000 mensajes).
        </p>
      </div>

      {/* 8. Datos Bancarios para el Anticipo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
        <div className="p-3.5 rounded-xl border border-[#dadce0] bg-[#f8f9fa] space-y-1">
          <span className="font-bold text-[#1f1f1f] block text-[11px] uppercase tracking-wider">
            Cuenta Oficial para Pago de Anticipo (50%)
          </span>
          <div className="font-mono text-[11px] space-y-0.5 text-[#1f1f1f]">
            <div><strong>Beneficiario:</strong> VALENTINA AI S.A.S.</div>
            <div><strong>Banco:</strong> BBVA México</div>
            <div><strong>CLABE Interbancaria:</strong> 012 680 01589412039 1</div>
            <div><strong>Concepto:</strong> Cotización {quote.folio}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#dadce0] bg-[#f8f9fa] space-y-1">
          <span className="font-bold text-[#1f1f1f] block text-[11px] uppercase tracking-wider">
            Garantías y Plazos de Despliegue
          </span>
          <ul className="text-[11px] text-[#5f6368] space-y-1">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] shrink-0" />
              <span>Garantía de precisión técnica y calibración por 30 días.</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] shrink-0" />
              <span>Titularidad 100% exclusiva de sus bases de datos (LFPDPPP).</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0b57d0] shrink-0" />
              <span>Entrega y pase a producción en 10 a 21 días hábiles.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Firmas de Aprobación */}
      <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
        <div className="space-y-1.5">
          <div className="border-b-2 border-[#1f1f1f] pb-8"></div>
          <div className="font-bold text-[#1f1f1f]">VALENTINA AI S.A.S.</div>
          <div className="text-[11px] text-[#5f6368]">Ingeniería Comercial & Producto</div>
          <div className="text-[10px] text-[#137333] font-mono">Propuesta Emitida &bull; Aprobada Oficialmente</div>
        </div>

        <div className="space-y-1.5">
          <div className="border-b-2 border-[#1f1f1f] pb-8"></div>
          <div className="font-bold text-[#1f1f1f]">{quote.contactName.toUpperCase()}</div>
          <div className="text-[11px] text-[#5f6368]">{quote.companyName} &bull; Aceptación de Propuesta</div>
          <div className="text-[10px] text-[#5f6368]">Firma de conformidad para inicio de ingeniería</div>
        </div>
      </div>

      {/* Pie de Página */}
      <div className="pt-4 border-t border-[#dadce0] flex flex-col sm:flex-row items-center justify-between text-[10px] text-[#747775]">
        <div>VALENTINA AI S.A.S. &bull; Manuel Gómez Morín 3960, Centro Sur, Querétaro, Qro.</div>
        <div>Mesa Comercial: contacto@valentina-ai.mx &bull; valentina-ai.mx</div>
      </div>
    </div>
  );
};
