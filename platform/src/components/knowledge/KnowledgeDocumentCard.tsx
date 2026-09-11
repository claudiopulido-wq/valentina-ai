import React from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { KnowledgeItem } from '../../lib/knowledgeService';

interface Props {
  doc: KnowledgeItem;
  isExpanded: boolean;
  onToggleExpand: (id: number) => void;
  canEdit: boolean;
  isReindexing: boolean;
  onReindex: (id: number) => void;
  onEdit: (doc: KnowledgeItem) => void;
  onDelete: (doc: KnowledgeItem) => void;
}

export const KnowledgeDocumentCard: React.FC<Props> = ({
  doc,
  isExpanded,
  onToggleExpand,
  canEdit,
  isReindexing,
  onReindex,
  onEdit,
  onDelete,
}) => {
  const isShort = doc.contenido.length < 180;

  return (
    <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0] hover:border-[#0b57d0] transition-all space-y-3 flex flex-col justify-between">
      <div className="space-y-2">
        {/* Header de la tarjeta */}
        <div className="flex items-center justify-between gap-2">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#e8f0fe] text-[#0b57d0] uppercase tracking-wider truncate max-w-[150px]">
            {doc.categoria.replace(/_/g, ' ')}
          </span>
          <span className="text-[10px] text-[#747775] font-mono">
            ID #{doc.id}
          </span>
        </div>

        {/* Título */}
        <h4 className="text-xs font-semibold text-[#1f1f1f] leading-snug">
          {doc.titulo}
        </h4>

        {/* Contenido con opción de expandir */}
        <p
          className={`text-[11px] text-[#5f6368] leading-relaxed whitespace-pre-line ${
            !isExpanded && !isShort ? 'line-clamp-3' : ''
          }`}
        >
          {doc.contenido}
        </p>

        {!isShort && (
          <button
            onClick={() => onToggleExpand(doc.id)}
            className="text-[10px] text-[#0b57d0] hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
          >
            {isExpanded ? (
              <>
                <span>Ver menos</span>
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>Ver completo</span>
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Pie de tarjeta con estado y acciones */}
      <div className="pt-2.5 border-t border-[#e0e2ec] space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          {doc.indexado ? (
            <span className="flex items-center gap-1 text-[#137333] font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Vectorizado</span>
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[#b06000] font-medium">
                <AlertTriangle className="w-3 h-3" />
                <span>Sin Vector</span>
              </span>
              {canEdit && (
                <button
                  onClick={() => onReindex(doc.id)}
                  disabled={isReindexing}
                  className="px-2 py-0.5 rounded bg-[#fef7e0] hover:bg-[#fee499] text-[#b06000] text-[9px] font-semibold border border-[#fee499] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Reintentar cálculo de embedding con Voyage AI"
                >
                  <RefreshCw
                    className={`w-2.5 h-2.5 ${isReindexing ? 'animate-spin' : ''}`}
                  />
                  <span>Reindexar</span>
                </button>
              )}
            </div>
          )}

          <span className="text-[#747775]">
            {doc.contenido.length} caracteres
          </span>
        </div>

        {/* Acciones de Edición/Eliminación */}
        {canEdit && (
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              onClick={() => onEdit(doc)}
              className="p-1.5 rounded-lg text-[#5f6368] hover:text-[#0b57d0] hover:bg-[#e8f0fe] transition cursor-pointer"
              title="Editar contenido"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(doc)}
              className="p-1.5 rounded-lg text-[#5f6368] hover:text-[#c5221f] hover:bg-[#fce8e6] transition cursor-pointer"
              title="Eliminar registro"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
