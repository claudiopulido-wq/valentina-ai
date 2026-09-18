interface CachedResult<T> {
  timestamp: number;
  result: T;
}

const store = new Map<string, CachedResult<unknown>>();
const MAX_TRACKED_KEYS = 2_000;

/**
 * Deduplicación best-effort en memoria de proceso: si `key` ya se procesó
 * dentro de `windowMs`, devuelve el resultado cacheado en vez de repetir la
 * acción (reenviar un WhatsApp, despachar un correo, etc.).
 *
 * Igual que el rate limiter de `proxy.ts`, esto NO es una cola distribuida:
 * en Vercel serverless multi-instancia cada instancia tiene su propio Map.
 * Aun así cubre el caso más común de "sin idempotencia" en una UI real:
 * doble clic del operador o un reintento automático del navegador mientras
 * la misma instancia sigue tibia. Para garantías distribuidas exactas se
 * necesitaría una tabla con `UNIQUE(event_id)` o Redis (ver auditoría, 3.2).
 */
export async function withIdempotency<T>(
  key: string,
  windowMs: number,
  action: () => Promise<T>
): Promise<{ result: T; deduped: boolean }> {
  const now = Date.now();
  const cached = store.get(key);
  if (cached && now - cached.timestamp < windowMs) {
    return { result: cached.result as T, deduped: true };
  }

  if (store.size > MAX_TRACKED_KEYS) {
    store.clear();
  }

  const result = await action();
  store.set(key, { timestamp: now, result });
  return { result, deduped: false };
}
