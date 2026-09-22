'use client';

import React, { useState } from 'react';
import { Tenant, UserLevel } from '../../types/platform';
import { InviteUserPayload } from '../../lib/adminDataService';
import { LEVEL_CONFIGS } from '../../lib/permissions';
import { X, UserPlus, Mail, Send, CheckCircle2 } from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  tenants: Tenant[];
  onClose: () => void;
  onSubmit: (payload: InviteUserPayload) => Promise<void>;
}

const LEVEL_OPTIONS: UserLevel[] = ['director', 'coordinador', 'vendedor', 'asesor', 'evaluador', 'soporte'];

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, tenants, onClose, onSubmit }) => {
  const [tenantId, setTenantId] = useState(tenants[0]?.id || '');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [level, setLevel] = useState<UserLevel>('vendedor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setFullName('');
    setEmail('');
    setJobTitle('');
    setLevel('vendedor');
    setSentTo(null);
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        tenantId,
        level,
        jobTitle: jobTitle.trim() || undefined,
      });
      setSentTo(email.trim());
    } catch (err: any) {
      setErrorMessage(err?.message || 'No se pudo enviar la invitación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-[#dadce0] rounded-2xl shadow-xl overflow-hidden my-auto">
        <div className="p-5 border-b border-[#dadce0] flex items-center justify-between bg-[#f8f9fa]">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-[#e8f0fe] text-[#0b57d0] flex items-center justify-center shrink-0">
              <UserPlus className="w-4.5 h-4.5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-[#1f1f1f]">Agregar Usuario</h3>
              <p className="text-xs text-[#5f6368]">Invita a un miembro de equipo a una empresa ya existente</p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentTo ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#e6f4ea] text-[#137333] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1f1f1f]">Invitación enviada</h4>
              <p className="text-xs text-[#5f6368] mt-1">
                Se envió un correo a <strong className="text-[#1f1f1f]">{sentTo}</strong> para que active su cuenta y
                establezca su propia contraseña.
              </p>
            </div>
            <button
              onClick={resetAndClose}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#0b57d0] hover:bg-[#0842a0] text-white transition cursor-pointer shadow-sm"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1">Empresa *</label>
                <select
                  required
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] cursor-pointer"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.logo} {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#444746] mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ej. Ana García"
                    className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] focus:ring-2 focus:ring-[#d3e3fd]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#444746] mb-1">Cargo o Puesto</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="ej. Asesor Comercial"
                    className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] focus:ring-2 focus:ring-[#d3e3fd]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#444746] mb-1">Correo Electrónico *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#747775] absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ej. vendedor@empresa.com"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] focus:ring-2 focus:ring-[#d3e3fd]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#444746] mb-1">Nivel Organizacional *</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as UserLevel)}
                    className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] cursor-pointer"
                  >
                    {LEVEL_OPTIONS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {LEVEL_CONFIGS[lvl].badgeLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#e8f0fe] border border-[#d3e3fd] text-[11px] text-[#041e49] flex items-start gap-2.5">
                <Send className="w-4 h-4 shrink-0 mt-0.5 text-[#0b57d0]" />
                <span>
                  No se genera ninguna contraseña aquí: se le enviará un correo con un enlace para que establezca la
                  suya propia. Nadie más la conocerá.
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-[#fce8e6] border border-[#fad2cf] text-xs text-[#c5221f]">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#dadce0] bg-[#f8f9fa] flex items-center justify-between">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-4 py-2 text-xs font-semibold text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !tenantId}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#0b57d0] hover:bg-[#0842a0] text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Enviando invitación...' : 'Enviar Invitación'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
