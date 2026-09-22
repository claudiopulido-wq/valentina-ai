import { describe, it, expect } from 'vitest';
import { filterContactsByVisibility, buildContactsCsv } from './crmService';

describe('filterContactsByVisibility', () => {
  const rows = [
    { id: '1', assigned_to: 'user-a' },
    { id: '2', assigned_to: 'user-b' },
    { id: '3', assigned_to: null },
  ];

  it('returns every row when the user can manage the whole CRM (director/coordinador/superadmin)', () => {
    expect(filterContactsByVisibility(rows, 'user-a', true)).toHaveLength(3);
  });

  it('restricts a vendedor to only their own assigned leads plus unassigned ones', () => {
    const result = filterContactsByVisibility(rows, 'user-a', false);
    expect(result.map((r) => r.id)).toEqual(['1', '3']);
  });

  it('never leaks a lead assigned to a different rep', () => {
    const result = filterContactsByVisibility(rows, 'user-a', false);
    expect(result.some((r) => r.assigned_to === 'user-b')).toBe(false);
  });
});

describe('buildContactsCsv', () => {
  const baseRow = {
    name: 'Ing. Roberto Morales',
    phone_or_email: '+525512345678',
    channel_origin: 'whatsapp',
    pipeline_stage: 'calificado',
    assigned_to_name: 'Ana Vendedora',
    qualification_score: 85,
    tags: ['Prospecto Calificado', 'Sector Salud'],
    city: 'Querétaro',
    created_at: '2026-09-21T10:00:00.000Z',
  };

  it('produces a header row plus one data row per contact', () => {
    const csv = buildContactsCsv([baseRow]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('Nombre');
    expect(lines[1]).toContain('Ing. Roberto Morales');
  });

  it('falls back to honest placeholders instead of blank cells for missing data', () => {
    const csv = buildContactsCsv([{ ...baseRow, name: null, assigned_to_name: null }]);
    expect(csv).toContain('Sin nombre');
    expect(csv).toContain('Sin asignar');
  });

  it('escapes commas and quotes inside fields so the CSV stays valid', () => {
    const csv = buildContactsCsv([{ ...baseRow, name: 'Empresa, S.A. de "C.V."' }]);
    expect(csv).toContain('"Empresa, S.A. de ""C.V."""');
  });

  it('joins multiple tags with a semicolon inside a single CSV cell', () => {
    const csv = buildContactsCsv([baseRow]);
    expect(csv).toContain('Prospecto Calificado; Sector Salud');
  });
});
