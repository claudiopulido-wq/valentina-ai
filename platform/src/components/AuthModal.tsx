'use client';

import React, { useState } from 'react';
import { AuthUser, Tenant } from '../types/platform';
import {
  Lock,
  Mail,
  Shield,
  KeyRound,
  ArrowRight,
  AlertTriangle,
  Building2,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

interface AuthModalProps {
  users: AuthUser[];
  tenants: Tenant[];
  onLoginSuccess: (user: AuthUser, tenant: Tenant | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ users, tenants, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      const foundUser = users.find(
        (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
      );

      if (!foundUser) {
        setErrorMsg(
          'Correo no registrado en la plataforma. Valentina AI opera bajo onboarding cerrado: tu empresa debe ser dada de alta formalmente por el SuperAdministrador.'
        );
        setLoading(false);
        return;
      }

      if (foundUser.password !== password) {
        setErrorMsg('Contraseña incorrecta. Verifica tus credenciales asignadas.');
        setLoading(false);
        return;
      }

      if (foundUser.status === 'suspended') {
        setErrorMsg(
          'El acceso de tu empresa se encuentra temporalmente pausado por administración. Contacta a soporte corporativo.'
        );
        setLoading(false);
        return;
      }

      // Resolver Tenant
      const userTenant = foundUser.tenantId
        ? tenants.find((t) => t.id === foundUser.tenantId) || null
        : null;

      setLoading(false);
      onLoginSuccess(foundUser, userTenant);
    }, 450);
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      const foundUser = users.find((u) => u.email === demoEmail);
      if (foundUser) {
        const userTenant = foundUser.tenantId
          ? tenants.find((t) => t.id === foundUser.tenantId) || null
          : null;
        setLoading(false);
        onLoginSuccess(foundUser, userTenant);
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-2xl">
      {/* Ambient Backlight Highlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-violet-600/25 via-cyan-500/15 to-transparent blur-[140px] pointer-events-none"></div>

      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d111a]/95 p-6 sm:p-8 shadow-2xl shadow-violet-950/40 backdrop-blur-xl text-white overflow-hidden">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 p-0.5 shadow-lg shadow-violet-500/30">
              <div className="w-full h-full bg-[#0a0d14] rounded-[14px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                VALENTINA <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono border border-violet-500/30">PORTAL CLIENTES</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">Autenticación Enterprise B2B</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            SISTEMA ACTIVO
          </div>
        </div>

        {/* Security Message */}
        <div className="my-5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
          <KeyRound className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            Portal exclusivo para empresas con agentes en producción. Ingresa con las credenciales que el <strong className="text-white">SuperAdmin</strong> dio de alta para tu proyecto.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              CORREO CORPORATIVO AUTORIZADO
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ej. admisiones@uges.edu.mx"
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              CONTRASEÑA ASIGNADA
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 text-white disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Ingresar al Tablero Empresarial</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo / Acceso Rápido para Dueño y Validación */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              ACCESO RÁPIDO PILOTO (SOLO DEMO)
            </span>
            <span className="text-[10px] text-slate-500">1-clic login</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('claudio@valentina-ai.mx', 'Valentina2026!')}
              className="px-2.5 py-2 rounded-xl bg-white/[0.04] hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/40 text-left transition-all group"
            >
              <div className="text-[11px] font-bold text-violet-300 flex items-center gap-1">
                <span>👑</span> SuperAdmin
              </div>
              <div className="text-[10px] text-slate-400 truncate">Claudio Pulido</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admisiones@uges.edu.mx', 'Uges2026!')}
              className="px-2.5 py-2 rounded-xl bg-white/[0.04] hover:bg-cyan-600/20 border border-white/10 hover:border-cyan-500/40 text-left transition-all group"
            >
              <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                <span>🎓</span> UGES
              </div>
              <div className="text-[10px] text-slate-400 truncate">Universidad UGES</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('coordinacion@conocer-ges.com', 'Conocer2026!')}
              className="px-2.5 py-2 rounded-xl bg-white/[0.04] hover:bg-emerald-600/20 border border-white/10 hover:border-emerald-500/40 text-left transition-all group"
            >
              <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                <span>📜</span> CONOCER
              </div>
              <div className="text-[10px] text-slate-400 truncate">Centro Evaluador</div>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 text-center text-[11px] text-slate-500">
          ¿Tu empresa no tiene acceso? Solicita una cotización y alta oficial en{' '}
          <a href="https://valentina-ai.mx" className="text-violet-400 hover:underline">
            valentina-ai.mx
          </a>
        </div>
      </div>
    </div>
  );
};
