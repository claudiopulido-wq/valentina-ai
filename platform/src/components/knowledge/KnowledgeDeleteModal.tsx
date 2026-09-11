import React from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { KnowledgeItem } from '../../lib/knowledgeService';

interface Props {
  doc: KnowledgeItem | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const KnowledgeDeleteModal: React.FC<Props> = ({
  doc,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!doc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#dadce0] space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-[#fce8e6] text-[#c5221f]">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1f1f1f]">
              ¿Eliminar este fragmento de conocimiento?
            </h3>
            <p className="text-[11px] text-[#5f6368]">
              ID #{doc.id} — {doc.titulo}
            </p>
          </div>
        </div>

        <p className="text-xs text-[#5f6368] leading-relaxed">
          El documento se marcará inactivo. Valentina dejará de utilizar esta información para responder preguntas abiertas en WhatsApp de manera inmediata.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#dadce0]">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5f6368] hover:bg-[#f1f3f4] transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#c5221f] hover:bg-[#a51d19] transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Confirmar Eliminación</span>
          </button>
        </div>
      </div>
    </div>
  );
};
