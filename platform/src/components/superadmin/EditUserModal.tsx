'use client';

import React, { useState } from 'react';
import { AuthUser, Tenant, UserLevel } from '../../types/platform';
import { LEVEL_CONFIGS } from '../../lib/permissions';
import { X, UserCog, Check, Save } from 'lucide-react';

interface EditUserModalProps {
  user: AuthUser;
  tenants: Tenant[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    userId: string,
    patch: Partial<Pick<AuthUser, 'level' | 'tenantId' | 'jobTitle' | 'notes'>>
  ) => Promise<void>;
}

const LEVEL_OPTIONS: UserLevel[] = ['director', 'coordinador', 'vendedor', 'asesor', 'evaluador', 'soporte'];

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, tenants, isOpen, onClose, onSave }) => {
  const [tenantId, setTenantId] = useState(user.tenantId || '');
  const [level, setLevel] = useState<UserLevel>(user.level || 'vendedor');
  const [jobTitle, setJobTitle] = useState(user.jobTitle || '');
  const [notes, setNotes] = useState(user.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onSave(user.id, {
        tenantId: tenantId || null,
        level,
        jobTitle: jobTitle.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err?.message || 'No se pudieron guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-[#dadce0] rounded-2xl shadow-xl overflow-hidden my-auto">
        <div className="p-5 border-b border-[#dadce0] flex items-center justify-between bg-[#f8f9fa]">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-[#e8f0fe] text-[#0b57d0] flex items-center justify-center shrink-0">
              <UserCog className="w-4.5 h-4.5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-[#1f1f1f]">Editar Usuario</h3>
              <p className="text-xs text-[#5f6368]">
                {user.fullName} <span className="font-mono text-[11px] text-[#747775]">({user.email})</span>
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

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1">Empresa</label>
                <select
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
              <div>
                <label className="block text-xs font-semibold text-[#444746] mb-1">Nivel Organizacional</label>
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

            <div>
              <label className="block text-xs font-semibold text-[#444746] mb-1">Notas Internas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Notas visibles solo para SuperAdmin"
                className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-sm text-[#1f1f1f] focus:outline-none focus:border-[#0b57d0] focus:ring-2 focus:ring-[#d3e3fd] resize-none"
              />
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
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#e8eaed] rounded-lg transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || savedSuccess}
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
                  <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
