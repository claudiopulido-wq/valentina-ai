import { describe, it, expect } from 'vitest';
import {
  sendMessageSchema,
  sendQuoteSchema,
  knowledgeCreateSchema,
  knowledgeUpdateSchema,
  createUserSchema,
  userPatchSchema,
  tenantCreateSchema,
} from './validation';

describe('sendMessageSchema', () => {
  it('accepts a valid payload', () => {
    const result = sendMessageSchema.safeParse({
      conversationId: 'conv-1',
      recipient: '+524421234567',
      message: 'hola',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty recipient/message (the exact bug this closes)', () => {
    const result = sendMessageSchema.safeParse({ conversationId: 'c', recipient: '', message: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a message over the max length', () => {
    const result = sendMessageSchema.safeParse({
      conversationId: 'c',
      recipient: '+524421234567',
      message: 'a'.repeat(5000),
    });
    expect(result.success).toBe(false);
  });
});

describe('sendQuoteSchema', () => {
  const validQuote = {
    id: 'q1',
    folio: 'COT-VAL-2026-0001',
    companyName: 'Acme',
    contactName: 'Juan',
    contactEmail: 'juan@acme.com',
    plan: 'Growth',
    billingPeriod: 'monthly',
    setupFeeMxn: 1000,
    monthlyFeeMxn: 500,
    monthlySavingsMxn: 200,
    amortizationDays: 10,
    selectedFeatures: [],
    expiresAt: '2026-12-01',
  };

  it('accepts a valid quote + email', () => {
    const result = sendQuoteSchema.safeParse({ quote: validQuote, emailTo: 'cliente@empresa.com' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid destination email', () => {
    const result = sendQuoteSchema.safeParse({ quote: validQuote, emailTo: 'no-es-un-correo' });
    expect(result.success).toBe(false);
  });

  it('rejects a plan outside the allowed enum', () => {
    const result = sendQuoteSchema.safeParse({
      quote: { ...validQuote, plan: 'Free' },
      emailTo: 'cliente@empresa.com',
    });
    expect(result.success).toBe(false);
  });

  it('keeps unlisted fields via passthrough instead of stripping them', () => {
    const result = sendQuoteSchema.safeParse({
      quote: { ...validQuote, currentStaffCount: 3, notes: 'nota interna' },
      emailTo: 'cliente@empresa.com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data.quote as any).currentStaffCount).toBe(3);
      expect((result.data.quote as any).notes).toBe('nota interna');
    }
  });
});

describe('knowledgeCreateSchema / knowledgeUpdateSchema', () => {
  it('requires titulo, contenido y categoria on create', () => {
    expect(knowledgeCreateSchema.safeParse({ titulo: 'x', contenido: 'y' }).success).toBe(false);
    expect(
      knowledgeCreateSchema.safeParse({ titulo: 'x', contenido: 'y', categoria: 'z' }).success
    ).toBe(true);
  });

  it('rejects an empty patch on update', () => {
    expect(knowledgeUpdateSchema.safeParse({}).success).toBe(false);
  });

  it('allows a partial patch with a single field on update', () => {
    expect(knowledgeUpdateSchema.safeParse({ titulo: 'nuevo título' }).success).toBe(true);
  });
});

describe('createUserSchema', () => {
  it('rejects a temp password shorter than 8 characters', () => {
    const result = createUserSchema.safeParse({
      email: 'a@b.com',
      fullName: 'A B',
      role: 'tenant_admin',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown role', () => {
    const result = createUserSchema.safeParse({
      email: 'a@b.com',
      fullName: 'A B',
      role: 'god_mode',
      password: 'validPassword123',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a well-formed user', () => {
    const result = createUserSchema.safeParse({
      email: 'a@b.com',
      fullName: 'A B',
      role: 'tenant_admin',
      tenantId: 'tenant-x',
      password: 'validPassword123',
    });
    expect(result.success).toBe(true);
  });
});

describe('userPatchSchema', () => {
  it('rejects an empty patch (nothing to update)', () => {
    expect(userPatchSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a single valid field', () => {
    expect(userPatchSchema.safeParse({ status: 'suspended' }).success).toBe(true);
  });

  it('rejects an invalid status value', () => {
    expect(userPatchSchema.safeParse({ status: 'banned' }).success).toBe(false);
  });
});

describe('tenantCreateSchema', () => {
  it('requires id, slug and name', () => {
    expect(tenantCreateSchema.safeParse({ id: 'tenant-x' }).success).toBe(false);
    expect(
      tenantCreateSchema.safeParse({ id: 'tenant-x', slug: 'x', name: 'X Corp' }).success
    ).toBe(true);
  });
});
