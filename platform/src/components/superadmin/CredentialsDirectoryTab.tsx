import React from 'react';
import { Tenant, AuthUser } from '../../types/platform';
import { Mail, FileText, KeyRound } from 'lucide-react';

interface Props {
  users: AuthUser[];
  tenants: Tenant[];
  onOpenNewTenantModal: () => void;
  onOpenDossierModal: (tenant: Tenant, user: AuthUser) => void;
  onResetPassword: (user: AuthUser) => void;
  onToggleUserStatus?: (userId: string) => void;
}

export const CredentialsDirectoryTab: React.FC<Props> = ({
  users,
  tenants,
  onOpenNewTenantModal,
  onOpenDossierModal,
  onResetPassword,
  onToggleUserStatus,
}) => {
  return (
    <div className="bg-white border border-[#dadce0] rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-[#dadce0] flex items-center justify-between bg-[#f8f9fa]">
        <div>
          <h3 className="text-sm font-semibold text-[#1f1f1f]">Directorio Maestro de Credenciales</h3>
          <p className="text-xs text-[#5f6368]">Solo las cuentas listadas aquí pueden iniciar sesión en el portal</p>
        </div>
        <button
          onClick={onOpenNewTenantModal}
          className="text-[#0b57d0] font-semibold text-xs hover:underline cursor-pointer"
        >
          Crear empresa &amp; Credenciales
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f8f9fa] border-b border-[#dadce0] text-[#5f6368] font-semibold text-[11px]">
            <tr>
              <th className="p-4">Usuario Autorizado</th>
              <th className="p-4">Correo Corporativo</th>
              <th className="p-4">Empresa Asignada</th>
              <th className="p-4">Nivel / Rol</th>
              <th className="p-4">Estatus Acceso</th>
              <th className="p-4 text-right">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f3f4]">
            {users.map((u) => {
              const assignedTenant = tenants.find((t) => t.id === u.tenantId);

              const renderLevelBadge = () => {
                if (u.role === 'superadmin') {
                  return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0b57d0] text-white">
                      👑 SuperAdmin Global
                    </span>
                  );
                }
                switch (u.level) {
                  case 'director':
                    return (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e8f0fe] text-[#0b57d0] border border-[#d3e3fd]">
                          👑 Director / C-Level
                        </span>
                        {u.jobTitle && <p className="text-[10px] text-[#5f6368]">{u.jobTitle}</p>}
                      </div>
                    );
                  case 'coordinador':
                    return (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fef7e0] text-[#b06000] border border-[#feefc3]">
                          📋 Coordinador
                        </span>
                        {u.jobTitle && <p className="text-[10px] text-[#5f6368]">{u.jobTitle}</p>}
                      </div>
                    );
                  case 'vendedor':
                  case 'asesor':
                    return (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                          💬 Asesor / Venta
                        </span>
                        {u.jobTitle && <p className="text-[10px] text-[#5f6368]">{u.jobTitle}</p>}
                      </div>
                    );
                  case 'evaluador':
                    return (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f3e8fd] text-[#7627bb] border border-[#e9d5ff]">
                          📜 Evaluador
                        </span>
                        {u.jobTitle && <p className="text-[10px] text-[#5f6368]">{u.jobTitle}</p>}
                      </div>
                    );
                  default:
                    return (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f1f3f4] text-[#444746] border border-[#dadce0]">
                          👤 Admin
                        </span>
                        {u.jobTitle && <p className="text-[10px] text-[#5f6368]">{u.jobTitle}</p>}
                      </div>
                    );
                }
              };

              return (
                <tr key={u.id} className="hover:bg-[#f8f9fa] transition">
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#e8f0fe] text-[#0b57d0] flex items-center justify-center text-xs font-bold">
                        {u.role === 'superadmin' ? '👑' : '👤'}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1f1f1f] text-xs">{u.fullName}</p>
                        <p className="text-[10px] text-[#5f6368]">{u.notes || 'Alta autorizada'}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 font-mono text-[#1f1f1f]">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#747775]" />
                      <span>{u.email}</span>
                    </div>
                  </td>

                  <td className="p-4">
                    {assignedTenant ? (
                      <div className="flex items-center gap-1.5">
                        <span>{assignedTenant.logo}</span>
                        <span className="font-medium text-[#1f1f1f]">{assignedTenant.name}</span>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#e8f0fe] text-[#0b57d0] font-bold">
                        Acceso Root Global
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    {renderLevelBadge()}
                  </td>

                  <td className="p-4 space-y-1">
                    <div>
                      {u.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span>
                          AUTORIZADO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fce8e6] text-[#c5221f] border border-[#f5c2c7]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c5221f]"></span>
                          PAUSADO
                        </span>
                      )}
                    </div>
                    {u.mustChangePassword && (
                      <p className="text-[10px] text-[#b06000] font-medium">⚠️ Clave provisional activa</p>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {assignedTenant && (
                        <button
                          onClick={() => onOpenDossierModal(assignedTenant, u)}
                          title="Ver Expediente Digital de esta organización"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f8f9fa] hover:bg-[#e8f0fe] text-[#0b57d0] border border-[#dadce0] transition cursor-pointer shadow-xs"
                        >
                          <FileText className="w-3 h-3 text-[#0b57d0]" />
                          <span>Expediente</span>
                        </button>
                      )}
                      {u.role !== 'superadmin' && (
                        <button
                          onClick={() => onResetPassword(u)}
                          title="Restablecer contraseña provisional y abrir ficha PDF oficial"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white hover:bg-[#e8f0fe] text-[#0b57d0] border border-[#dadce0] transition cursor-pointer shadow-xs"
                        >
                          <KeyRound className="w-3 h-3 text-[#0b57d0]" />
                          <span>Reset Clave</span>
                        </button>
                      )}
                      {u.role !== 'superadmin' && onToggleUserStatus && (
                        <button
                          onClick={() => onToggleUserStatus(u.id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-white hover:bg-[#fce8e6] text-[#c5221f] border border-[#f5c2c7]'
                              : 'bg-white hover:bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
                          }`}
                        >
                          {u.status === 'active' ? 'Pausar' : 'Reactivar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
