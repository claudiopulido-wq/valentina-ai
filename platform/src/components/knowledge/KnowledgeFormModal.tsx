import React from 'react';
import { Pencil, Plus, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { KnowledgeItem } from '../../lib/knowledgeService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingDoc: KnowledgeItem | null;
  formTitulo: string;
  setFormTitulo: (v: string) => void;
  formCategoria: string;
  setFormCategoria: (v: string) => void;
  formContenido: string;
  setFormContenido: (v: string) => void;
  formError: string | null;
  isSubmitting: boolean;
  categories: string[];
  onSubmit: (e: React.FormEvent) => void;
}

export const KnowledgeFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  editingDoc,
  formTitulo,
  setFormTitulo,
  formCategoria,
  setFormCategoria,
  formContenido,
  setFormContenido,
  formError,
  isSubmitting,
  categories,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#dadce0] space-y-4">
        <div className="flex items-center justify-between border-b border-[#dadce0] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#e8f0fe] text-[#0b57d0]">
              {editingDoc ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1f1f1f]">
                {editingDoc ? 'Editar Conocimiento' : 'Nuevo Documento de Conocimiento'}
              </h3>
              <p className="text-[11px] text-[#5f6368]">
                Al guardar, se calculará el vector semántico con Voyage AI en tiempo real.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5f6368] hover:bg-[#f1f3f4] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-[#fce8e6] border border-[#f5c2c7] text-[#c5221f] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#1f1f1f]">
              Título del Fragmento <span className="text-[#c5221f]">*</span>
            </label>
            <input
              type="text"
              value={formTitulo}
              onChange={(e) => setFormTitulo(e.target.value)}
              placeholder="Ej: Fechas de inscripción y períodos escolares"
              className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl px-3.5 py-2 text-xs text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
              required
            />
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1f1f1f]">
              Categoría <span className="text-[#c5221f]">*</span>
            </label>
            <input
              type="text"
              value={formCategoria}
              onChange={(e) => setFormCategoria(e.target.value)}
              placeholder="Ej: tramites, costos, carreras, admisiones"
              className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl px-3.5 py-2 text-xs text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
              required
            />
            {/* Sugerencias de categorías existentes */}
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="text-[10px] text-[#747775] mr-1 self-center">Sugerencias:</span>
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormCategoria(cat)}
                  className="px-2 py-0.5 rounded-md bg-[#f1f3f4] hover:bg-[#e0e2ec] text-[10px] text-[#5f6368] font-mono cursor-pointer"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Contenido */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1f1f1f]">
                Contenido &amp; Hechos Verificables <span className="text-[#c5221f]">*</span>
              </label>
              <span className="text-[10px] text-[#747775] font-mono">
                {formContenido.length} caracteres
              </span>
            </div>
            <textarea
              value={formContenido}
              onChange={(e) => setFormContenido(e.target.value)}
              rows={6}
              placeholder="Redacta la información clara y completa. Incluye costos, fechas, requisitos o pasos específicos. También puedes incluir una sección de 'Palabras clave e intenciones' al final para facilitar la búsqueda semántica de Valentina..."
              className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-3 text-xs text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] leading-relaxed resize-y"
              required
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#dadce0]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5f6368] hover:bg-[#f1f3f4] transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0b57d0] hover:bg-[#0842a0] transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingDoc ? 'Guardar Cambios' : 'Crear & Vectorizar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
