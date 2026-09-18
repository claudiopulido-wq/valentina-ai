import { describe, it, expect } from 'vitest';
import { getAllowedTabsForUser, canUserAccessTab, getDefaultTabForUser } from './permissions';
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
    expect(getAllowedTabsForUser(user)).toEqual(['inbox', 'channels', 'knowledge', 'analytics']);
  });

  it('restricts a vendedor to only the inbox — the "no distracciones ni costos" rule', () => {
    const user = makeUser({ level: 'vendedor' });
    expect(getAllowedTabsForUser(user)).toEqual(['inbox']);
  });

  it('never grants financial visibility tabs to a coordinador', () => {
    const user = makeUser({ level: 'coordinador' });
    const tabs = getAllowedTabsForUser(user);
    // El coordinador gestiona chats/conocimiento/canales, pero jamás 'analytics'
    // (esa pestaña es la que expone costos financieros de la empresa).
    expect(tabs).not.toContain('analytics');
    expect(tabs).toEqual(['inbox', 'knowledge', 'channels']);
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
