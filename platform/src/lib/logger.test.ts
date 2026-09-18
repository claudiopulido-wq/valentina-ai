import { describe, it, expect } from 'vitest';
import { maskPii } from './logger';

describe('maskPii', () => {
  it('masks an email address', () => {
    expect(maskPii('claudio.pulido@valentina-ai.mx')).toBe('cl***@***');
  });

  it('masks a phone number but keeps a few boundary digits', () => {
    const masked = maskPii('+52 442 123 4567');
    expect(masked).not.toContain('442 123');
    expect(masked.startsWith('+52')).toBe(true);
  });

  it('redacts a Bearer token entirely', () => {
    expect(maskPii('Authorization: Bearer abc123.def456')).toContain('Bearer [REDACTED]');
    expect(maskPii('Bearer abc123.def456')).not.toContain('abc123');
  });

  it('redacts password/secret/token fields in objects without masking (full removal)', () => {
    const masked = maskPii({
      email: 'usuario@empresa.com',
      password: 'hunter2',
      apiKey: 'sk-123',
    }) as Record<string, unknown>;
    expect(masked.password).toBe('[REDACTED]');
    expect(masked.apiKey).toBe('[REDACTED]');
    expect(masked.email).toBe('us***@***');
  });

  it('recurses into nested objects and arrays', () => {
    const masked = maskPii({
      user: { email: 'nested@empresa.com', notes: ['contacto: otro@empresa.com'] },
    }) as any;
    expect(masked.user.email).toBe('ne***@***');
    expect(masked.user.notes[0]).toContain('***@***');
  });

  it('leaves non-PII values untouched', () => {
    expect(maskPii(42)).toBe(42);
    expect(maskPii(true)).toBe(true);
    expect(maskPii('hola mundo')).toBe('hola mundo');
  });
});
