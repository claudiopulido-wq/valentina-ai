import { describe, it, expect } from 'vitest';
import { RateLimiter } from './rateLimiter';

describe('RateLimiter', () => {
  it('allows requests under the limit', () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 3 });
    const now = 1_000_000;
    expect(limiter.hit('ip1', now)).toBe(false);
    expect(limiter.hit('ip1', now + 1)).toBe(false);
    expect(limiter.hit('ip1', now + 2)).toBe(false);
  });

  it('blocks once a key exceeds maxRequests within the window', () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 2 });
    const now = 1_000_000;
    expect(limiter.hit('ip1', now)).toBe(false);
    expect(limiter.hit('ip1', now + 1)).toBe(false);
    expect(limiter.hit('ip1', now + 2)).toBe(true); // 3rd hit exceeds limit of 2
  });

  it('tracks different keys independently (e.g. different IPs)', () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 1 });
    const now = 1_000_000;
    expect(limiter.hit('ip1', now)).toBe(false);
    expect(limiter.hit('ip2', now)).toBe(false); // distinta IP, no comparte contador
    expect(limiter.hit('ip1', now + 1)).toBe(true); // ip1 ya excedió su propio límite
  });

  it('forgets hits older than the window (sliding window)', () => {
    const limiter = new RateLimiter({ windowMs: 1_000, maxRequests: 1 });
    const now = 1_000_000;
    expect(limiter.hit('ip1', now)).toBe(false);
    expect(limiter.hit('ip1', now + 500)).toBe(true); // dentro de la ventana, excede
    expect(limiter.hit('ip1', now + 2_000)).toBe(false); // fuera de la ventana, se olvida
  });

  it('clears all tracked keys once trackedKeyCount exceeds maxTrackedKeys', () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 100, maxTrackedKeys: 2 });
    limiter.hit('a', 1);
    limiter.hit('b', 1);
    limiter.hit('c', 1); // size pasa a 3 (> 2), pero la poda se evalúa ANTES de insertar
    expect(limiter.trackedKeyCount).toBe(3);
    limiter.hit('d', 1); // ahora sí: al entrar, size(3) > maxTrackedKeys(2) -> se limpia todo antes de agregar 'd'
    expect(limiter.trackedKeyCount).toBe(1);
  });
});
