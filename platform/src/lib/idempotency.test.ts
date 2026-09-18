import { describe, it, expect, vi } from 'vitest';
import { withIdempotency } from './idempotency';

describe('withIdempotency', () => {
  it('runs the action on the first call and reports deduped: false', async () => {
    const action = vi.fn().mockResolvedValue('result-1');
    const key = `test-key-${Math.random()}`;

    const { result, deduped } = await withIdempotency(key, 10_000, action);

    expect(result).toBe('result-1');
    expect(deduped).toBe(false);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('returns the cached result without re-running the action within the window', async () => {
    const action = vi.fn().mockResolvedValue('result-2');
    const key = `test-key-${Math.random()}`;

    const first = await withIdempotency(key, 10_000, action);
    const second = await withIdempotency(key, 10_000, action);

    expect(first.deduped).toBe(false);
    expect(second.deduped).toBe(true);
    expect(second.result).toBe('result-2');
    // La acción real (enviar el WhatsApp/correo) solo se ejecuta una vez.
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('re-runs the action again once the window has elapsed', async () => {
    const action = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    const key = `test-key-${Math.random()}`;

    const first = await withIdempotency(key, 20, action);
    await new Promise((resolve) => setTimeout(resolve, 40));
    const second = await withIdempotency(key, 20, action);

    expect(first.result).toBe('first');
    expect(second.result).toBe('second');
    expect(second.deduped).toBe(false);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('treats different keys as independent operations', async () => {
    const action = vi.fn().mockResolvedValue('ok');
    const base = Math.random();

    const a = await withIdempotency(`key-a-${base}`, 10_000, action);
    const b = await withIdempotency(`key-b-${base}`, 10_000, action);

    expect(a.deduped).toBe(false);
    expect(b.deduped).toBe(false);
    expect(action).toHaveBeenCalledTimes(2);
  });
});
