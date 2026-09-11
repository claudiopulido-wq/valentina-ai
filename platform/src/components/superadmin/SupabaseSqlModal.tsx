import React from 'react';
import { Database, Copy, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  copiedSql: boolean;
  onCopySql: () => void;
  sqlContent: string;
}

export const SupabaseSqlModal: React.FC<Props> = ({
  isOpen,
  onClose,
  copiedSql,
  onCopySql,
  sqlContent,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col border border-[#dadce0] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#dadce0] pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#0b57d0]" />
            <h3 className="text-sm font-bold text-[#1f1f1f]">Esquema SQL Multi-Tenant con Row Level Security (RLS)</h3>
          </div>
          <button onClick={onClose} className="text-[#5f6368] hover:text-[#1f1f1f] cursor-pointer">✕</button>
        </div>

        <p className="text-xs text-[#5f6368] leading-relaxed">
          Este script crea las tablas multi-tenant en PostgreSQL con políticas de <strong>Row Level Security (RLS)</strong> para garantizar aislamiento absoluto entre clientes al costo base de $0 USD en Supabase.
        </p>

        <div className="relative flex-1 overflow-hidden rounded-xl bg-[#f8f9fa] border border-[#dadce0] p-3">
          <button
            onClick={onCopySql}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] border border-[#dadce0] text-xs font-mono transition cursor-pointer shadow-sm"
          >
            {copiedSql ? <CheckCircle className="w-3.5 h-3.5 text-[#137333]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
          </button>
          <pre className="text-[11px] font-mono text-[#1f1f1f] overflow-y-auto max-h-[340px] pr-12 leading-relaxed">
            {sqlContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
