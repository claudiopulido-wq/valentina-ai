import { AuthUser, UserLevel } from '../types/platform';

export type ClientTab = 'inbox' | 'analytics' | 'channels' | 'knowledge';

export interface LevelConfig {
  label: string;
  badgeLabel: string;
  badgeStyle: string;
  allowedTabs: ClientTab[];
  defaultTab: ClientTab;
  canInterveneChat: boolean;
  canViewFinances: boolean;
  canEditKnowledge: boolean;
  canManageChannels: boolean;
  description: string;
}

export const LEVEL_CONFIGS: Record<UserLevel, LevelConfig> = {
  director: {
    label: 'Director / Propietario',
    badgeLabel: '👑 Director (C-Level)',
    badgeStyle: 'bg-[#f3e8fd] text-[#7a22ce] border-[#d8b4fe]',
    // El Director ve primero métricas financieras/ROI y la bandeja en modo supervisión
    allowedTabs: ['analytics', 'inbox'],
    defaultTab: 'analytics',
    canInterveneChat: false, // Modo auditoría ejecutiva
    canViewFinances: true,
    canEditKnowledge: false,
    canManageChannels: false,
    description: 'Acceso estratégico a retorno de inversión, métricas y supervisión global.',
  },
  vendedor: {
    label: 'Vendedor Comercial',
    badgeLabel: '💬 Vendedor Comercial',
    badgeStyle: 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]',
    // El Vendedor SOLO ve la bandeja de mensajes. Cero distracciones ni costos.
    allowedTabs: ['inbox'],
    defaultTab: 'inbox',
    canInterveneChat: true,
    canViewFinances: false,
    canEditKnowledge: false,
    canManageChannels: false,
    description: 'Atención operativa y cierre comercial de prospectos en tiempo real.',
  },
  asesor: {
    label: 'Asesor de Admisiones',
    badgeLabel: '💬 Asesor de Admisiones',
    badgeStyle: 'bg-[#e8f0fe] text-[#0b57d0] border-[#d3e3fd]',
    // El Asesor SOLO ve la bandeja de mensajes.
    allowedTabs: ['inbox'],
    defaultTab: 'inbox',
    canInterveneChat: true,
    canViewFinances: false,
    canEditKnowledge: false,
    canManageChannels: false,
    description: 'Gestión y acompañamiento a aspirantes en la bandeja de WhatsApp.',
  },
  coordinador: {
    label: 'Coordinador / Supervisor',
    badgeLabel: '📋 Coordinador Operativo',
    badgeStyle: 'bg-[#fef7e0] text-[#b06000] border-[#fee499]',
    // El Coordinador gestiona atención, conocimiento de la IA y canales
    allowedTabs: ['inbox', 'knowledge', 'channels'],
    defaultTab: 'inbox',
    canInterveneChat: true,
    canViewFinances: false, // Protegido: no ve costos financieros de la empresa
    canEditKnowledge: true,
    canManageChannels: false,
    description: 'Supervisión operativa de chats y actualización de la base de conocimiento.',
  },
  evaluador: {
    label: 'Evaluador de Competencias',
    badgeLabel: '📜 Evaluador Oficial',
    badgeStyle: 'bg-[#e0e7ff] text-[#3730a3] border-[#c7d2fe]',
    // El Evaluador SOLO ve la base de conocimiento y expedientes
    allowedTabs: ['knowledge'],
    defaultTab: 'knowledge',
    canInterveneChat: false,
    canViewFinances: false,
    canEditKnowledge: false,
    canManageChannels: false,
    description: 'Dictamen de portafolios de evidencias y consulta de estándares.',
  },
  soporte: {
    label: 'Soporte Operativo',
    badgeLabel: '🛠️ Soporte Técnico',
    badgeStyle: 'bg-[#f1f3f4] text-[#3c4043] border-[#dadce0]',
    allowedTabs: ['channels', 'inbox'],
    defaultTab: 'channels',
    canInterveneChat: true,
    canViewFinances: false,
    canEditKnowledge: false,
    canManageChannels: true,
    description: 'Diagnóstico de hardware, tokens y salud de canales Meta.',
  },
};

/**
 * Retorna la lista estricta de pestañas autorizadas para el usuario.
 * Si no está autorizado para una pestaña, NO debe aparecerle en el menú.
 */
export function getAllowedTabsForUser(user: AuthUser | null): ClientTab[] {
  if (!user) return [];
  if (user.role === 'superadmin') {
    return ['inbox', 'channels', 'knowledge', 'analytics'];
  }
  const level = user.level || 'asesor';
  const config = LEVEL_CONFIGS[level];
  return config ? config.allowedTabs : ['inbox'];
}

/**
 * Retorna la pestaña a la que debe aterrizar el usuario por defecto al loguearse.
 */
export function getDefaultTabForUser(user: AuthUser | null): ClientTab {
  if (!user) return 'inbox';
  if (user.role === 'superadmin') return 'inbox';
  const level = user.level || 'asesor';
  const config = LEVEL_CONFIGS[level];
  return config ? config.defaultTab : 'inbox';
}

/**
 * Verifica si el usuario tiene permiso para acceder a una pestaña específica.
 */
export function canUserAccessTab(user: AuthUser | null, tab: ClientTab): boolean {
  const allowed = getAllowedTabsForUser(user);
  return allowed.includes(tab);
}

/**
 * Obtiene la configuración visual del nivel del usuario.
 */
export function getUserLevelConfig(user: AuthUser | null): LevelConfig {
  if (!user || user.role === 'superadmin') {
    return {
      label: 'Super Administrador Global',
      badgeLabel: '⚡ SuperAdmin HQ',
      badgeStyle: 'bg-[#fce8e6] text-[#c5221f] border-[#f5c2c7]',
      allowedTabs: ['inbox', 'channels', 'knowledge', 'analytics'],
      defaultTab: 'inbox',
      canInterveneChat: true,
      canViewFinances: true,
      canEditKnowledge: true,
      canManageChannels: true,
      description: 'Control total de la infraestructura y todas las empresas.',
    };
  }

  const level = user.level || 'asesor';
  return LEVEL_CONFIGS[level] || LEVEL_CONFIGS.asesor;
}
