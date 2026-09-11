'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';
import { AuthUser, Tenant } from '../types/platform';
import { LEVEL_CONFIGS } from '../lib/permissions';
import {
  KnowledgeItem,
  fetchKnowledgeDocs,
  createKnowledgeDoc,
  updateKnowledgeDoc,
  deleteKnowledgeDoc,
  reindexKnowledgeDoc,
} from '../lib/knowledgeService';
import { KnowledgeDocumentCard } from './knowledge/KnowledgeDocumentCard';
import { KnowledgeFormModal } from './knowledge/KnowledgeFormModal';
import { KnowledgeDeleteModal } from './knowledge/KnowledgeDeleteModal';

interface KnowledgeBaseManagerProps {
  tenant: Tenant;
  currentUser: AuthUser | null;
}

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({
  tenant,
  currentUser,
}) => {
  // Mapeo dinámico de tenant a tenantId numérico de Railway
  const numericTenantId = tenant.railwayTenantId ?? (tenant.id === 'tenant-uges' ? 1 : null);

  // Permisos de edición del usuario
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const levelConfig = currentUser?.level ? LEVEL_CONFIGS[currentUser.level] : null;
  const canEdit = isSuperAdmin || Boolean(levelConfig?.canEditKnowledge);

  // Estados de datos
  const [docs, setDocs] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unindexed'>('all');

  // Tarjetas expandidas
  const [expandedDocIds, setExpandedDocIds] = useState<Set<number>>(new Set());

  // Estado de modales
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeItem | null>(null);
  const [formTitulo, setFormTitulo] = useState<string>('');
  const [formCategoria, setFormCategoria] = useState<string>('');
  const [formContenido, setFormContenido] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modal de confirmación de eliminación
  const [docToDelete, setDocToDelete] = useState<KnowledgeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Estado de reindexación por documento
  const [reindexingDocId, setReindexingDocId] = useState<number | null>(null);

  // Notificación tipo toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  // Carga inicial y recarga
  const loadDocuments = async () => {
    if (!numericTenantId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await fetchKnowledgeDocs(numericTenantId, currentUser);
      setDocs(data);
    } catch (err: any) {
      console.error('[KnowledgeBaseManager] Error al cargar:', err);
      setErrorMsg(err.message || 'No fue posible cargar la base de conocimientos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [tenant.id, currentUser?.id]);

  // Lista de categorías únicas
  const categories = useMemo(() => {
    const set = new Set<string>();
    docs.forEach((d) => {
      if (d.categoria) set.add(d.categoria);
    });
    return Array.from(set).sort();
  }, [docs]);

  // Documentos filtrados
  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.contenido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.categoria.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat =
        selectedCategory === 'all' || doc.categoria === selectedCategory;

      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'unindexed' && doc.indexado === false);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [docs, searchTerm, selectedCategory, statusFilter]);

  // Métricas
  const totalCount = docs.length;
  const indexedCount = docs.filter((d) => d.indexado === true).length;
  const unindexedCount = docs.filter((d) => d.indexado === false).length;

  // Alternar expandir contenido
  const toggleExpand = (id: number) => {
    setExpandedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setEditingDoc(null);
    setFormTitulo('');
    setFormCategoria(categories[0] || 'general');
    setFormContenido('');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (doc: KnowledgeItem) => {
    setEditingDoc(doc);
    setFormTitulo(doc.titulo);
    setFormCategoria(doc.categoria);
    setFormContenido(doc.contenido);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Guardar (Crear o Editar)
  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericTenantId) return;

    if (!formTitulo.trim() || !formCategoria.trim() || !formContenido.trim()) {
      setFormError('Por favor completa todos los campos requeridos.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingDoc) {
        const updated = await updateKnowledgeDoc(numericTenantId, currentUser, editingDoc.id, {
          titulo: formTitulo.trim(),
          categoria: formCategoria.trim().toLowerCase(),
          contenido: formContenido.trim(),
        });

        setDocs((prev) =>
          prev.map((d) => (d.id === editingDoc.id ? { ...d, ...updated } : d))
        );
        showToast('success', 'Documento actualizado y vectorizado correctamente.');
      } else {
        const created = await createKnowledgeDoc(numericTenantId, currentUser, {
          titulo: formTitulo.trim(),
          categoria: formCategoria.trim().toLowerCase(),
          contenido: formContenido.trim(),
        });

        setDocs((prev) => [created, ...prev]);
        showToast('success', 'Nuevo conocimiento indexado con éxito para Valentina.');
      }

      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error('[KnowledgeBaseManager] Error al guardar:', err);
      setFormError(err.message || 'Error al guardar el documento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar
  const handleConfirmDelete = async () => {
    if (!numericTenantId || !docToDelete) return;

    setIsDeleting(true);
    try {
      await deleteKnowledgeDoc(numericTenantId, currentUser, docToDelete.id);
      setDocs((prev) => prev.filter((d) => d.id !== docToDelete.id));
      showToast('success', 'Documento eliminado de la base de conocimientos.');
      setDocToDelete(null);
    } catch (err: any) {
      console.error('[KnowledgeBaseManager] Error al eliminar:', err);
      showToast('error', err.message || 'No fue posible eliminar el documento.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reindexar vector
  const handleReindex = async (docId: number) => {
    if (!numericTenantId) return;

    setReindexingDocId(docId);
    try {
      const updated = await reindexKnowledgeDoc(numericTenantId, currentUser, docId);
      setDocs((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, indexado: true, ...updated } : d))
      );
      showToast('success', 'Vector recalculado con Voyage AI con éxito.');
    } catch (err: any) {
      console.error('[KnowledgeBaseManager] Error al reindexar:', err);
      showToast('error', err.message || 'Error al reindexar el documento.');
    } finally {
      setReindexingDocId(null);
    }
  };

  // Si no es el tenant UGES (empresas mockups en despliegue)
  if (!numericTenantId) {
    return (
      <div className="bg-white border border-[#dadce0] rounded-2xl p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-[#fef7e0] text-[#b06000]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1f1f1f]">
              Base de Conocimientos — {tenant.name}
            </h3>
            <p className="text-xs text-[#5f6368]">
              Motor RAG personalizado con embeddings semánticos Voyage AI
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-[#e0e2ec] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1f1f1f]">
            <Info className="w-4 h-4 text-[#0b57d0]" />
            <span>Integración RAG en Proceso de Aprovisionamiento</span>
          </div>
          <p className="text-xs text-[#5f6368] leading-relaxed">
            Esta cuenta empresarial se encuentra actualmente en fase de configuración de bot y canales.
            La base de conocimientos vectorial en vivo está disponible para la organización{' '}
            <strong className="text-[#1f1f1f]">Universidad UGES</strong> (Tenant #1).
          </p>
          <p className="text-xs text-[#747775]">
            Para conectar el modelo de conocimiento de esta empresa, solicita el alta de su tenant en el backend de Valentina.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-2 transition-all transform animate-in fade-in slide-in-from-bottom-2 ${
            toastMsg.type === 'success'
              ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
              : 'bg-[#fce8e6] text-[#c5221f] border-[#f5c2c7]'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Contenedor Principal */}
      <div className="bg-white border border-[#dadce0] rounded-2xl p-6 space-y-6 shadow-sm">
        {/* Cabecera y Acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-semibold text-[#1f1f1f] tracking-tight">
                Base de Conocimiento RAG &amp; Políticas — {tenant.name}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                {totalCount} Documentos Activos
              </span>
            </div>
            <p className="text-xs text-[#5f6368] mt-1">
              Catálogo de fragmentos semánticos vectorizados con Voyage AI para que Valentina responda con precisión sin alucinaciones.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={loadDocuments}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#0b57d0] bg-[#f0f4f9] hover:bg-[#e0e2ec] border border-[#dadce0] transition cursor-pointer disabled:opacity-50"
              title="Recargar datos desde la API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>

            {canEdit && (
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-[#0b57d0] hover:bg-[#0842a0] transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Documento</span>
              </button>
            )}
          </div>
        </div>

        {/* Resumen de Estado de Vectorización */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-[#5f6368]">Total Registros</span>
              <p className="text-lg font-bold text-[#1f1f1f]">{totalCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-[#e8f0fe] text-[#0b57d0]">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-[#5f6368]">Vectorizados (Buscables)</span>
              <p className="text-lg font-bold text-[#137333]">{indexedCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-[#e6f4ea] text-[#137333]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'unindexed' ? 'all' : 'unindexed')}
            className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
              statusFilter === 'unindexed'
                ? 'bg-[#fef7e0] border-[#b06000]'
                : unindexedCount > 0
                ? 'bg-[#fef7e0]/40 border-[#fee499] hover:border-[#b06000]'
                : 'bg-[#f8f9fa] border-[#dadce0]'
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-[#5f6368]">
                Pendientes de Vector
              </span>
              <p className="text-lg font-bold text-[#b06000]">{unindexedCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-[#fef7e0] text-[#b06000]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="space-y-3 pt-4 border-t border-[#dadce0]">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#747775]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, contenido o palabras clave..."
                className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl pl-9 pr-4 py-1.5 text-xs text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]"
              />
            </div>

            {/* Categorías en chips horizontales */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full font-medium transition cursor-pointer text-xs whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-[#0b57d0] text-white shadow-sm'
                    : 'bg-[#f1f3f4] text-[#5f6368] hover:text-[#1f1f1f]'
                }`}
              >
                Todas ({docs.length})
              </button>
              {categories.map((cat) => {
                const count = docs.filter((d) => d.categoria === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full font-medium transition cursor-pointer text-xs whitespace-nowrap capitalize ${
                      selectedCategory === cat
                        ? 'bg-[#0b57d0] text-white shadow-sm'
                        : 'bg-[#f1f3f4] text-[#5f6368] hover:text-[#1f1f1f]'
                    }`}
                  >
                    {cat.replace(/_/g, ' ')} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aviso si se filtran solo no indexados */}
          {statusFilter === 'unindexed' && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#fef7e0] border border-[#fee499] text-xs text-[#b06000]">
              <span>Mostrando únicamente documentos que requieren reindexación de vector.</span>
              <button
                onClick={() => setStatusFilter('all')}
                className="underline font-semibold cursor-pointer"
              >
                Ver todos
              </button>
            </div>
          )}
        </div>

        {/* Error global */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-[#fce8e6] border border-[#f5c2c7] text-[#c5221f] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Spinner de carga */}
        {isLoading && docs.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-[#5f6368] space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0b57d0]" />
            <p className="text-xs">Consultando base de conocimientos en Railway...</p>
          </div>
        )}

        {/* Grid de Documentos */}
        {!isLoading && filteredDocs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {filteredDocs.map((doc) => (
              <KnowledgeDocumentCard
                key={doc.id}
                doc={doc}
                isExpanded={expandedDocIds.has(doc.id)}
                onToggleExpand={toggleExpand}
                canEdit={canEdit}
                isReindexing={reindexingDocId === doc.id}
                onReindex={handleReindex}
                onEdit={handleOpenEditModal}
                onDelete={setDocToDelete}
              />
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!isLoading && filteredDocs.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <BookOpen className="w-8 h-8 text-[#747775] mx-auto opacity-50" />
            <p className="text-xs text-[#5f6368]">
              No se encontraron documentos con los filtros seleccionados.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: CREAR / EDITAR DOCUMENTO */}
      <KnowledgeFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        editingDoc={editingDoc}
        formTitulo={formTitulo}
        setFormTitulo={setFormTitulo}
        formCategoria={formCategoria}
        setFormCategoria={setFormCategoria}
        formContenido={formContenido}
        setFormContenido={setFormContenido}
        formError={formError}
        isSubmitting={isSubmitting}
        categories={categories}
        onSubmit={handleSaveDoc}
      />

      {/* MODAL: CONFIRMAR ELIMINACIÓN */}
      <KnowledgeDeleteModal
        doc={docToDelete}
        isDeleting={isDeleting}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
