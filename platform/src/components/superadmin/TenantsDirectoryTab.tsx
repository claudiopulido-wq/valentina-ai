import React from 'react';
import { Tenant, AuthUser } from '../../types/platform';
import { Search, FileText, ArrowRight, Pencil } from 'lucide-react';

interface Props {
  tenants: Tenant[];
  users: AuthUser[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterType: string;
  onFilterChange: (f: string) => void;
  onOpenNewTenantModal: () => void;
  onOpenDossierModal: (tenant: Tenant, user?: AuthUser) => void;
  onSelectTenant: (tenant: Tenant) => void;
  onEnterAsClient: (tenant: Tenant) => void;
  onEditTenant: (tenant: Tenant) => void;
}

export const TenantsDirectoryTab: React.FC<Props> = ({
  tenants,
  users,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  onOpenNewTenantModal,
  onOpenDossierModal,
  onSelectTenant,
  onEnterAsClient,
  onEditTenant,
}) => {
  const filteredTenants = tenants.filter((t) => {
    if (filterType === 'active' && t.status !== 'active') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.industry.toLowerCase().includes(q) || t.slug.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header Row: Count & Action */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1f1f1f]">
          {tenants.length} {tenants.length === 1 ? 'empresa' : 'empresas'}
        </h2>
        <button
          onClick={onOpenNewTenantModal}
          className="text-[#0b57d0] font-semibold text-xs hover:underline cursor-pointer"
        >
          Crear empresa
        </button>
      </div>

      {/* Filters and Search Bar (Exact Google Play Console Style) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5f6368]">Filtrar por</span>
          <select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value)}
            className="bg-[#f1f3f4] text-[#1f1f1f] border border-[#dadce0] rounded-full px-3 py-1.5 text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">Todas</option>
            <option value="active">Solo Activas</option>
          </select>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#747775]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Busca por empresa o paquete"
            className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-full pl-9 pr-4 py-2 text-xs text-[#1f1f1f] placeholder-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] focus:bg-white"
          />
        </div>
      </div>

      {/* Clean Google Play Console Table */}
      <div className="bg-white border border-[#dadce0] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fa] border-b border-[#dadce0] text-[#5f6368] font-semibold text-[11px]">
              <tr>
                <th className="p-4">Aplicación</th>
                <th className="p-4">Usuarios con la app instalada</th>
                <th className="p-4">Estado de la app</th>
                <th className="p-4">Facturación &amp; Consumo IA</th>
                <th className="p-4">Última actualización</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f4]">
              {filteredTenants.map((t) => {
                const waChannel = t.channels.find((c) => c.type === 'whatsapp');

                return (
                  <tr key={t.id} className="hover:bg-[#f8f9fa] transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-1.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">{t.logo}</span>
                        <div>
                          <p className="font-semibold text-[#1f1f1f] text-xs">{t.name}</p>
                          <p className="text-[11px] text-[#5f6368] font-mono">
                            {t.website || `${t.slug}.valentina-ai.mx`}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-[#1f1f1f]">
                      {waChannel ? '33' : '0'}
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span>
                        Producción
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-mono font-bold text-[#1f1f1f] text-xs">
                          ${(t.subscriptionFeeMxn || 8500).toLocaleString('es-MX')} MXN
                        </p>
                        <p className="text-[11px] text-[#137333] font-mono">
                          IA: ${t.totalSpentMxn.toFixed(2)} MXN <span className="text-[#747775]">(Límite: ${t.monthlyBudgetMxn.toLocaleString()})</span>
                        </p>
                      </div>
                    </td>

                    <td className="p-4 text-[#5f6368]">
                      16 jun 2026
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditTenant(t)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#f1f3f4] text-[#1f1f1f] hover:bg-[#e8eaed] transition flex items-center gap-1 cursor-pointer"
                          title="Editar información de la empresa"
                        >
                          <Pencil className="w-3 h-3 text-[#5f6368]" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => {
                            const associatedUser = users.find((u) => u.tenantId === t.id);
                            onOpenDossierModal(t, associatedUser);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#e8f0fe] text-[#0b57d0] hover:bg-[#d3e3fd] transition flex items-center gap-1 cursor-pointer"
                          title="Ver Expediente Digital B2B (Cotización, Convenio, RACI, Credenciales)"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Expediente</span>
                        </button>
                        <button
                          onClick={() => {
                            onSelectTenant(t);
                            onEnterAsClient(t);
                          }}
                          className="text-[#0b57d0] hover:underline font-semibold flex items-center gap-1 text-xs cursor-pointer ml-1"
                        >
                          <span>Ver app</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-[#dadce0] bg-[#f8f9fa] flex items-center justify-between text-xs text-[#5f6368]">
          <span>Mostrar filas: 10</span>
          <span>1 - {filteredTenants.length} de {filteredTenants.length}</span>
        </div>
      </div>
    </div>
  );
};
