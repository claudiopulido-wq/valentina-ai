'use client';

import React, { useState } from 'react';
import { Tenant, AuthUser } from '../../types/platform';
import { ValentinaLogo } from '../ValentinaLogo';
import {
  Shield,
  Building2,
  Lock,
  Mail,
  AlertTriangle,
  UserCheck,
  Copy,
  CheckCircle
} from 'lucide-react';

interface Props {
  tenant: Tenant;
  user: AuthUser;
}

export const ExecutiveCredentialSheet: React.FC<Props> = ({ tenant, user }) => {
  const [copiedPassword, setCopiedPassword] = useState(false);

  const documentFolio = `VAL-SEC-${new Date().getFullYear()}-${user.id.slice(-6).toUpperCase() || '778901'}`;
  const accessUrl = typeof window !== 'undefined' ? window.location.origin : 'https://valentina-ai.mx';

  const handleCopyPasswordOnly = () => {
    if (user.password) {
      navigator.clipboard.writeText(user.password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const getLevelBadge = () => {
    switch (user.level) {
      case 'director':
        return { label: 'Director / C-Level', color: 'bg-[#e8f0fe] text-[#0b57d0] border-[#d3e3fd]' };
      case 'coordinador':
        return { label: 'Coordinador / Supervisor', color: 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]' };
      case 'vendedor':
      case 'asesor':
        return { label: 'Asesor / Vendedor', color: 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]' };
      case 'evaluador':
        return { label: 'Evaluador Oficial', color: 'bg-[#f3e8fd] text-[#7627bb] border-[#e9d5ff]' };
      default:
        return { label: 'Administrador de Organización', color: 'bg-[#e8f0fe] text-[#0b57d0] border-[#d3e3fd]' };
    }
  };

  const levelBadge = getLevelBadge();

  return (
    <div className="bg-white p-6 sm:p-10 md:p-12 text-[#1f1f1f] space-y-6 max-w-4xl mx-auto printable-sheet font-sans border border-[#dadce0] rounded-xl shadow-sm print:shadow-none print:border-none">
      {/* Encabezado Institucional */}
      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between border-b-2 border-[#1f1f1f] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <ValentinaLogo size="md" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1f1f1f] leading-none">
                VALENTINA AI
              </h1>
              <span className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-widest">
                Enterprise Cloud Solutions
              </span>
            </div>
          </div>
          <p className="text-xs text-[#5f6368] pt-1">
            División de Infraestructura & Seguridad Multi-Tenant
          </p>
        </div>

        <div className="text-left sm:text-right space-y-1">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#f1f3f4] text-[#1f1f1f] border border-[#dadce0] inline-block">
            FOLIO: {documentFolio}
          </span>
          <p className="text-[11px] text-[#5f6368]">
            Fecha de Emisión: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-[10px] text-[#137333] font-medium flex items-center justify-start sm:justify-end gap-1">
            <Shield className="w-3 h-3" />
            <span>Provisión Criptográfica Activa</span>
          </p>
        </div>
      </div>

      {/* Título Principal */}
      <div className="space-y-1 text-center py-2 border-b border-[#dadce0] pb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f0fe] text-[#0b57d0] border border-[#d3e3fd]">
          <UserCheck className="w-3.5 h-3.5" /> Ficha de Identidad Digital
        </span>
        <h2 className="text-base sm:text-lg font-bold text-[#1f1f1f] uppercase tracking-wide pt-2">
          Ficha Oficial de Provisión de Acceso & Credenciales Institucionales
        </h2>
        <p className="text-xs text-[#5f6368]">
          Documento confidencial emitido para la incorporación de cuentas autorizadas a la plataforma Valentina.
        </p>
      </div>

      {/* Bloque 1: Datos de la Organización Cliente */}
      <div className="rounded-xl bg-[#f8f9fa] border border-[#dadce0] p-4 sm:p-5 space-y-3">
        <div className="text-[11px] font-bold text-[#0b57d0] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#dadce0] pb-2">
          <Building2 className="w-4 h-4" />
          <span>1. Datos de la Organización Autorizada</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
          <div>
            <span className="text-[#5f6368] block text-[11px]">Empresa / Institución:</span>
            <strong className="text-[#1f1f1f] text-sm flex items-center gap-1.5 mt-0.5">
              <span>{tenant.logo || '🏢'}</span>
              <span>{tenant.legalBusinessName || tenant.name}</span>
            </strong>
          </div>

          <div>
            <span className="text-[#5f6368] block text-[11px]">Giro / Sector:</span>
            <span className="text-[#1f1f1f] font-medium block mt-0.5">{tenant.industry}</span>
          </div>

          <div>
            <span className="text-[#5f6368] block text-[11px]">Plan Contratado:</span>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e8f0fe] text-[#0b57d0] border border-[#d3e3fd]">
              {tenant.plan} Enterprise
            </span>
          </div>
        </div>
      </div>

      {/* Bloque 2: Ficha del Usuario y Credenciales */}
      <div className="rounded-xl bg-[#f8f9fa] border border-[#dadce0] p-4 sm:p-5 space-y-4">
        <div className="text-[11px] font-bold text-[#0b57d0] uppercase tracking-wider flex items-center justify-between border-b border-[#dadce0] pb-2">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" />
            <span>2. Credenciales y Nivel de Usuario</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${levelBadge.color}`}>
            {levelBadge.label}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#5f6368] block text-[11px]">Nombre del Titular:</span>
            <span className="text-[#1f1f1f] font-bold text-sm block mt-0.5">{user.fullName}</span>
            {user.jobTitle && (
              <span className="text-[11px] text-[#5f6368] block">{user.jobTitle}</span>
            )}
          </div>

          <div>
            <span className="text-[#5f6368] block text-[11px]">URL Oficial de Acceso:</span>
            <a
              href={accessUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#0b57d0] font-semibold underline block mt-0.5 font-mono text-xs"
            >
              {accessUrl}
            </a>
          </div>
        </div>

        {/* Recuadro de Credenciales de Inicio de Sesión */}
        <div className="p-4 rounded-xl bg-white border-2 border-[#d3e3fd] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#5f6368] block uppercase">
                Usuario / Correo Institucional
              </label>
              <div className="mt-1 flex items-center gap-2 p-2 rounded-lg bg-[#f8f9fa] border border-[#dadce0] font-mono text-xs text-[#0b57d0] font-bold">
                <Mail className="w-3.5 h-3.5 text-[#747775]" />
                <span className="break-all">{user.email}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#5f6368] block uppercase">
                  Contraseña Provisional
                </label>
                <button
                  type="button"
                  onClick={handleCopyPasswordOnly}
                  className="text-[10px] text-[#0b57d0] hover:underline cursor-pointer print:hidden flex items-center gap-1"
                >
                  {copiedPassword ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-[#137333]" />
                      <span className="text-[#137333]">¡Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar clave</span>
                    </>
                  )}
                </button>
              </div>
              <div className="mt-1 flex items-center gap-2 p-2 rounded-lg bg-[#f8f9fa] border border-[#dadce0] font-mono text-xs text-[#137333] font-bold">
                <Lock className="w-3.5 h-3.5 text-[#747775]" />
                <span>{user.password || '•••••••• (Definida por el usuario)'}</span>
              </div>
            </div>
          </div>

          {/* Callout de Seguridad */}
          <div className="p-3 rounded-lg bg-[#fef7e0] border border-[#feefc3] text-[#b06000] flex items-start gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#b06000]" />
            <div className="space-y-0.5">
              <strong className="font-semibold block">
                Actualización Obligatoria de Contraseña en el Primer Acceso
              </strong>
              <p className="text-[11px] text-[#843800] leading-relaxed">
                Por estrictas políticas de ciberseguridad, esta contraseña es estrictamente provisional. El sistema <strong>requerirá de forma automática que defina su contraseña personal definitiva</strong> en el momento exacto en que inicie sesión por primera vez.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bloque 3: Pasos para Comenzar */}
      <div className="space-y-2 text-xs">
        <h4 className="font-bold text-xs uppercase tracking-wider text-[#1f1f1f]">
          3. Pasos para Activar su Acceso
        </h4>
        <ol className="list-decimal list-inside space-y-1.5 text-[#444746] pl-1">
          <li>
            Ingrese en su navegador a la dirección oficial: <strong className="font-mono text-[#0b57d0]">{accessUrl}</strong>
          </li>
          <li>
            Escriba su correo corporativo y la contraseña provisional especificada en este documento.
          </li>
          <li>
            Al ingresar, complete la pantalla de seguridad estableciendo su contraseña definitiva confidencial.
          </li>
          <li>
            Acceda a su consola institucional para gestionar las conversaciones de Valentina AI, leads y telemetría en vivo.
          </li>
        </ol>
      </div>

      {/* Pie de Página */}
      <div className="pt-6 border-t border-[#dadce0] flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-[#747775]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 font-medium">
            <Shield className="w-3 h-3 text-[#137333]" />
            Cifrado AES-256 GCM
          </span>
          <span>•</span>
          <span>Aislamiento Multi-Tenant RLS</span>
        </div>

        <div className="text-right font-mono">
          Valentina AI Platform &bull; Soporte: contacto@valentina-ai.mx
        </div>
      </div>
    </div>
  );
};
