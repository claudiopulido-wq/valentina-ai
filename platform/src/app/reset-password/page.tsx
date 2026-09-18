'use client';

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { ValentinaLogo } from '../../components/ValentinaLogo';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function verifyRecoverySession() {
      if (!isSupabaseConfigured) {
        if (mounted) {
          setIsSessionValid(true);
          setCheckingSession(false);
        }
        return;
      }

      try {
        // 1. Verificar si viene un código PKCE en la URL (?code=...)
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.warn('Error intercambiando código de recuperación:', exchangeError);
            }
          }
        }

        // 2. Comprobar sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (mounted) {
            setIsSessionValid(true);
            setCheckingSession(false);
          }
          return;
        }

        // 3. Suscribirse a cambios de estado de autenticación (evento PASSWORD_RECOVERY)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            if (mounted) {
              setIsSessionValid(true);
              setCheckingSession(false);
            }
          }
        });

        // Margen de espera para procesar el hash de recuperación en la URL
        setTimeout(async () => {
          if (mounted) {
            const { data: { session: finalSession } } = await supabase.auth.getSession();
            setIsSessionValid(Boolean(finalSession));
            setCheckingSession(false);
          }
        }, 1500);

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error al verificar sesión de recuperación:', err);
        if (mounted) {
          setIsSessionValid(false);
          setCheckingSession(false);
        }
      }
    }

    verifyRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage('Por políticas de ciberseguridad, la contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Verifica que ambas sean exactamente iguales.');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.updateUser({
          password: password,
        });

        if (error) {
          throw error;
        }
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Error al actualizar contraseña:', err);
      setErrorMessage(
        err.message || 'No fue posible actualizar la contraseña. El enlace puede haber expirado o ser inválido.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 bg-[#f0f4f9] selection:bg-purple-500/20">
      <div className="relative w-full max-w-md bg-white border border-[#dadce0] rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Header & Logo */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-[#f1f3f4]">
          <div className="mb-2">
            <ValentinaLogo size="xl" />
          </div>
          <h1 className="text-xl font-semibold text-[#1f1f1f] tracking-tight">
            Restablecer contraseña
          </h1>
          <p className="text-xs text-[#5f6368] mt-1">
            Consola Empresarial de Valentina AI
          </p>
        </div>

        <div className="pt-6">
          {checkingSession ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
              <RefreshCw className="w-8 h-8 text-[#0b57d0] animate-spin" />
              <p className="text-xs text-[#5f6368]">
                Verificando enlace seguro de recuperación...
              </p>
            </div>
          ) : success ? (
            <div className="p-5 rounded-2xl bg-[#e6f4ea] border border-[#ceead6] text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#137333] text-white flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#1f1f1f]">
                  ¡Contraseña actualizada con éxito!
                </h3>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  Tu nueva credencial corporativa ha sido registrada y asegurada en Supabase Auth. Ya puedes ingresar a la plataforma.
                </p>
              </div>

              <a
                href="https://portal.valentina-ai.mx"
                className="w-full py-2.5 px-4 rounded-lg bg-[#0b57d0] hover:bg-[#0842a0] active:scale-[0.99] text-white text-xs font-semibold cursor-pointer transition shadow-sm flex items-center justify-center gap-2"
              >
                <span>Acceder a la plataforma</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ) : !isSessionValid ? (
            <div className="p-5 rounded-2xl bg-[#fef7f0] border border-[#feeedb] text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#d93025]/10 text-[#d93025] flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#1f1f1f]">
                  Enlace inválido o expirado
                </h3>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  El enlace de recuperación ha caducado o ya fue utilizado por razones de ciberseguridad. Por favor, solicita un nuevo enlace desde la pantalla de inicio de sesión.
                </p>
              </div>

              <a
                href="https://portal.valentina-ai.mx"
                className="w-full py-2.5 px-4 rounded-lg bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold cursor-pointer transition shadow-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a iniciar sesión</span>
              </a>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f0f4f9] border border-[#d3e3fd] text-xs text-[#0b57d0]">
                <ShieldCheck className="w-5 h-5 shrink-0 text-[#0b57d0]" />
                <span>Crea una nueva contraseña robusta para proteger tu acceso.</span>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-[#fce8e6] border border-[#fad2cf] flex items-start gap-2.5 text-xs text-[#c5221f]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1.5 uppercase tracking-wide">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#747775]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#747775] focus:border-[#0b57d0] focus:ring-2 focus:ring-[#0b57d0]/20 rounded-lg text-sm text-[#1f1f1f] placeholder:text-[#8e918f] transition outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747775] hover:text-[#1f1f1f] p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1.5 uppercase tracking-wide">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#747775]" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#747775] focus:border-[#0b57d0] focus:ring-2 focus:ring-[#0b57d0]/20 rounded-lg text-sm text-[#1f1f1f] placeholder:text-[#8e918f] transition outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747775] hover:text-[#1f1f1f] p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm bg-[#0b57d0] hover:bg-[#0842a0] active:scale-[0.99] transition-all text-white shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Actualizar contraseña y acceder</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
