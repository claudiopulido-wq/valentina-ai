import { describe, it, expect } from 'vitest';
import { getAllowedTabsForUser, canUserAccessTab, getDefaultTabForUser, getUserLevelConfig } from './permissions';
import { AuthUser } from '../types/platform';

function makeUser(overrides: Partial<AuthUser>): AuthUser {
  return {
    id: 'u1',
    email: 'u1@empresa.com',
    fullName: 'Usuario Prueba',
    tenantId: 'tenant-1',
    role: 'tenant_admin',
    status: 'active',
    createdAt: '2026-01-01',
    ...overrides,
  };
}

describe('getAllowedTabsForUser', () => {
  it('returns no tabs for an unauthenticated (null) user', () => {
    expect(getAllowedTabsForUser(null)).toEqual([]);
  });

  it('gives superadmin access to every tab regardless of level', () => {
    const user = makeUser({ role: 'superadmin', level: undefined });
    expect(getAllowedTabsForUser(user)).toEqual(['inbox', 'channels', 'knowledge', 'analytics', 'crm']);
  });

  it('restricts a vendedor to the inbox and their own CRM pipeline — no costos ni canales', () => {
    const user = makeUser({ level: 'vendedor' });
    const tabs = getAllowedTabsForUser(user);
    expect(tabs).toEqual(['inbox', 'crm']);
    expect(tabs).not.toContain('analytics');
    expect(tabs).not.toContain('channels');
  });

  it('never grants financial visibility tabs to a coordinador', () => {
    const user = makeUser({ level: 'coordinador' });
    const tabs = getAllowedTabsForUser(user);
    // El coordinador gestiona chats/conocimiento/canales/CRM, pero jamás 'analytics'
    // (esa pestaña es la que expone costos financieros de la empresa).
    expect(tabs).not.toContain('analytics');
    expect(tabs).toEqual(['inbox', 'knowledge', 'channels', 'crm']);
  });

  it('restricts an evaluador to only the knowledge base', () => {
    const user = makeUser({ level: 'evaluador' });
    expect(getAllowedTabsForUser(user)).toEqual(['knowledge']);
  });
});

describe('canUserAccessTab', () => {
  it('denies access to a tab not in the allowed list', () => {
    const user = makeUser({ level: 'vendedor' });
    expect(canUserAccessTab(user, 'analytics')).toBe(false);
    expect(canUserAccessTab(user, 'inbox')).toBe(true);
  });
});

describe('CRM permissions (canManageCRM / canClaimLeads)', () => {
  it('lets director and coordinador manage (assign/reassign) any lead, but not claim', () => {
    expect(getUserLevelConfig(makeUser({ level: 'director' })).canManageCRM).toBe(true);
    expect(getUserLevelConfig(makeUser({ level: 'director' })).canClaimLeads).toBe(false);
    expect(getUserLevelConfig(makeUser({ level: 'coordinador' })).canManageCRM).toBe(true);
  });

  it('lets vendedor and asesor claim unassigned leads, but not manage the whole pipeline', () => {
    expect(getUserLevelConfig(makeUser({ level: 'vendedor' })).canClaimLeads).toBe(true);
    expect(getUserLevelConfig(makeUser({ level: 'vendedor' })).canManageCRM).toBe(false);
    expect(getUserLevelConfig(makeUser({ level: 'asesor' })).canClaimLeads).toBe(true);
  });

  it('denies CRM management entirely to evaluador and soporte', () => {
    expect(getUserLevelConfig(makeUser({ level: 'evaluador' })).canManageCRM).toBe(false);
    expect(getUserLevelConfig(makeUser({ level: 'evaluador' })).canClaimLeads).toBe(false);
    expect(getUserLevelConfig(makeUser({ level: 'soporte' })).canManageCRM).toBe(false);
  });

  it('gives superadmin full CRM control', () => {
    const config = getUserLevelConfig(makeUser({ role: 'superadmin' }));
    expect(config.canManageCRM).toBe(true);
    expect(config.canClaimLeads).toBe(true);
  });
});

describe('canViewOwnDossier', () => {
  it('is only true for director — the sole level that owns the company', () => {
    expect(getUserLevelConfig(makeUser({ level: 'director' })).canViewOwnDossier).toBe(true);
    expect(getUserLevelConfig(makeUser({ level: 'coordinador' })).canViewOwnDossier).toBe(false);
    expect(getUserLevelConfig(makeUser({ level: 'vendedor' })).canViewOwnDossier).toBe(false);
    expect(getUserLevelConfig(makeUser({ level: 'asesor' })).canViewOwnDossier).toBe(false);
    expect(getUserLevelConfig(makeUser({ level: 'evaluador' })).canViewOwnDossier).toBe(false);
    expect(getUserLevelConfig(makeUser({ level: 'soporte' })).canViewOwnDossier).toBe(false);
  });

  it('gives director access to the dossier tab', () => {
    expect(getAllowedTabsForUser(makeUser({ level: 'director' }))).toContain('dossier');
    expect(getAllowedTabsForUser(makeUser({ level: 'vendedor' }))).not.toContain('dossier');
  });
});

describe('getDefaultTabForUser', () => {
  it('lands a director on analytics (ROI/métricas primero), not inbox', () => {
    const user = makeUser({ level: 'director' });
    expect(getDefaultTabForUser(user)).toBe('analytics');
  });

  it('lands superadmin on inbox', () => {
    const user = makeUser({ role: 'superadmin' });
    expect(getDefaultTabForUser(user)).toBe('inbox');
  });

  it('falls back to inbox for a null user', () => {
    expect(getDefaultTabForUser(null)).toBe('inbox');
  });
});
