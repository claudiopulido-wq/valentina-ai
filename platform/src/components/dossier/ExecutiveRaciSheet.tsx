'use client';

import React from 'react';
import { Tenant } from '../../types/platform';
import { ValentinaLogo } from '../ValentinaLogo';
import {
  CheckSquare,
  Smartphone,
  CreditCard,
  FileText,
  Key,
  Clock,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';

interface Props {
  tenant: Tenant;
}

export const ExecutiveRaciSheet: React.FC<Props> = ({ tenant }) => {
  const folio = `ANX-RACI-${new Date().getFullYear()}-${tenant.id.replace('tenant-', '').slice(0, 6).toUpperCase()}`;
  const todayFormatted = new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const clientName = tenant.legalBusinessName || tenant.name;

  return (
    <div className="bg-white p-6 sm:p-10 md:p-12 text-[#1f1f1f] space-y-6 max-w-4xl mx-auto printable-sheet font-sans border border-[#dadce0] rounded-xl shadow-sm print:shadow-none print:border-none">
      {/* Membrete Oficial */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b-2 border-[#1f1f1f] gap-4">
        <div className="flex items-center gap-3">
          <ValentinaLogo size="md" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1f1f1f] leading-none">
              VALENTINA AI
            </h1>
            <span className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-widest">
              Anexo Técnico A-01 &bull; Onboarding Ágil
            </span>
          </div>
        </div>

        <div className="text-left sm:text-right space-y-1 text-xs">
          <div className="inline-block px-2.5 py-1 rounded bg-[#f1f3f4] text-[#1f1f1f] font-mono font-bold border border-[#dadce0]">
            FOLIO: {folio}
          </div>
          <div className="text-[#5f6368] flex items-center sm:justify-end gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Fecha: {todayFormatted}</span>
          </div>
          <div className="text-[11px] text-[#059669] font-semibold">
            Plazo de Entrega: 10 a 21 Días Hábiles
          </div>
        </div>
      </div>

      {/* Título */}
      <div className="space-y-1 text-center py-2 border-b border-[#dadce0] pb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
          <CheckSquare className="w-3.5 h-3.5" /> Guía Operativa de Despliegue
        </span>
        <h2 className="text-base sm:text-lg font-bold text-[#1f1f1f] uppercase tracking-wide pt-2">
          Prerrequisitos del Cliente & Matriz de Responsabilidades (RACI)
        </h2>
        <p className="text-xs text-[#5f6368] max-w-2xl mx-auto">
          Insumos necesarios y división de tareas para asegurar el despliegue del asistente de IA de <strong>{clientName}</strong> en tiempo y forma sin fricciones técnicas.
        </p>
      </div>

      {/* 1. Checklist de Insumos Requeridos */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1f1f1f] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#0b57d0]" /> 1. Checklist de Insumos Requeridos al Cliente
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0] space-y-1.5">
            <div className="font-bold text-[#6D28D9] flex items-center gap-1.5 text-[11px]">
              <Smartphone className="w-4 h-4" /> 1. Línea Telefónica para WhatsApp
            </div>
            <p className="text-[#5f6368] text-[11px] leading-relaxed">
              Número telefónico exclusivo sin cuenta de WhatsApp activa en dispositivos móviles (si estuvo registrado en la app normal, debe eliminarse de la aplicación para migrar a la Cloud API oficial de Meta).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0] space-y-1.5">
            <div className="font-bold text-[#059669] flex items-center gap-1.5 text-[11px]">
              <CreditCard className="w-4 h-4" /> 2. Meta Business Suite & Tarjeta
            </div>
            <p className="text-[#5f6368] text-[11px] leading-relaxed">
              Acceso con rol de Administrador al Business Manager de la empresa y tarjeta de crédito o débito vinculada para liquidar directamente el consumo de mensajería oficial ($0.0085 USD/msg).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0] space-y-1.5">
            <div className="font-bold text-[#0284C7] flex items-center gap-1.5 text-[11px]">
              <FileText className="w-4 h-4" /> 3. Documentación Oficial y Catálogos
            </div>
            <p className="text-[#5f6368] text-[11px] leading-relaxed">
              Archivos en PDF o enlaces de catálogos de servicios, listas de precios, políticas de garantía, ubicaciones y respuestas a las 20 dudas más comunes de los clientes.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0] space-y-1.5">
            <div className="font-bold text-[#D97706] flex items-center gap-1.5 text-[11px]">
              <Key className="w-4 h-4" /> 4. Credenciales de Integración (Si aplica)
            </div>
            <p className="text-[#5f6368] text-[11px] leading-relaxed">
              Para Plan Scale o Enterprise: Token o Webhook del CRM (HubSpot, Zoho o Google Sheets), API de Google Calendar o credenciales de solo lectura para el ERP.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Matriz de Responsabilidades RACI */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1f1f1f] flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-[#0b57d0]" /> 2. Matriz RACI de Implementación
          </h3>
          <span className="text-[10px] text-[#5f6368] font-mono">
            R: Responsable | A: Aprueba | C: Consultado | I: Informado
          </span>
        </div>

        <div className="overflow-x-auto border border-[#dadce0] rounded-xl text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f1f3f4] text-[#1f1f1f] border-b border-[#dadce0]">
                <th className="p-2.5 font-semibold">Fase / Actividad</th>
                <th className="p-2.5 font-semibold text-center w-24">Cliente</th>
                <th className="p-2.5 font-semibold text-center w-24">Valentina AI</th>
                <th className="p-2.5 font-semibold text-center w-28">Entregable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dadce0] text-[11px]">
              <tr>
                <td className="p-2.5 font-medium text-[#1f1f1f]">Aprovisionamiento de número y Business Manager</td>
                <td className="p-2.5 text-center font-bold text-[#6D28D9]">R / A</td>
                <td className="p-2.5 text-center text-[#5f6368]">C / I</td>
                <td className="p-2.5 text-center font-mono text-[#5f6368]">WABA Activa</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-[#1f1f1f]">Entrega de catálogos, precios y preguntas frecuentes</td>
                <td className="p-2.5 text-center font-bold text-[#6D28D9]">R / A</td>
                <td className="p-2.5 text-center text-[#5f6368]">C</td>
                <td className="p-2.5 text-center font-mono text-[#5f6368]">PDFs Ingestados</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-[#1f1f1f]">Ingesta Vectorial, Prompts y Guardrails de Seguridad</td>
                <td className="p-2.5 text-center text-[#5f6368]">C</td>
                <td className="p-2.5 text-center font-bold text-[#0b57d0]">R / A</td>
                <td className="p-2.5 text-center font-mono text-[#5f6368]">Bot Calibrado</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-[#1f1f1f]">Conexión a WhatsApp Cloud API y Webhooks</td>
                <td className="p-2.5 text-center text-[#5f6368]">C</td>
                <td className="p-2.5 text-center font-bold text-[#0b57d0]">R / A</td>
                <td className="p-2.5 text-center font-mono text-[#5f6368]">Canal Enlazado</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-[#1f1f1f]">Pruebas Piloto de Calibración Semántica</td>
                <td className="p-2.5 text-center font-bold text-[#1f1f1f]">R</td>
                <td className="p-2.5 text-center font-bold text-[#0b57d0]">R / A</td>
                <td className="p-2.5 text-center font-mono text-[#5f6368]">Visto Bueno</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-[#1f1f1f]">Pase a Producción & Entrega de Credenciales Oficiales</td>
                <td className="p-2.5 text-center font-bold text-[#137333]">A</td>
                <td className="p-2.5 text-center font-bold text-[#0b57d0]">R</td>
                <td className="p-2.5 text-center font-mono text-[#137333]">En Vivo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Cronograma de Hitos */}
      <div className="space-y-2 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1f1f1f] flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#0b57d0]" /> 3. Cronograma de Implementación (10 a 21 Días Hábiles)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
            <span className="text-[10px] font-bold text-[#6D28D9] uppercase block">Días 1 a 3</span>
            <strong className="text-[#1f1f1f] block mt-0.5 text-[11px]">Recepción de Insumos</strong>
            <p className="text-[#5f6368] text-[10px] mt-1">
              Checklist completado, validación de WABA y alta del cliente en Supabase.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
            <span className="text-[10px] font-bold text-[#0b57d0] uppercase block">Días 4 a 8</span>
            <strong className="text-[#1f1f1f] block mt-0.5 text-[11px]">Ingesta & RAG</strong>
            <p className="text-[#5f6368] text-[10px] mt-1">
              Estructuración de la base de conocimiento y guardrails de tono institucional.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
            <span className="text-[10px] font-bold text-[#D97706] uppercase block">Días 9 a 14</span>
            <strong className="text-[#1f1f1f] block mt-0.5 text-[11px]">Canales & Pruebas</strong>
            <p className="text-[#5f6368] text-[10px] mt-1">
              Conexión de la Cloud API, pruebas internas y calibración de respuestas.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#e6f4ea] border border-[#ceead6]">
            <span className="text-[10px] font-bold text-[#137333] uppercase block">Días 15 a 21</span>
            <strong className="text-[#041e49] block mt-0.5 text-[11px]">Salida a Producción</strong>
            <p className="text-[#1e8e3e] text-[10px] mt-1 font-medium">
              Entrega de credenciales, encendido en vivo e inicio de los 30 días de garantía.
            </p>
          </div>
        </div>
      </div>

      {/* Pie de Página */}
      <div className="pt-4 border-t border-[#dadce0] flex justify-between text-[10px] text-[#747775]">
        <div>VALENTINA AI S.A.S. &bull; Anexo Técnico A-01: RACI & Prerrequisitos</div>
        <div>Mesa Técnica: contacto@valentina-ai.mx</div>
      </div>
    </div>
  );
};
