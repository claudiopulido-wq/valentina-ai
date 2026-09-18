/**
 * Rate limiting en memoria por clave (típicamente IP+ruta).
 *
 * Es "best-effort": en un despliegue serverless/edge multi-instancia (Vercel)
 * este Map no se comparte entre instancias, así que no es un límite global
 * exacto. Aun así frena abuso básico (spam de formularios, scraping, fuerza
 * bruta simple) sin depender de infraestructura externa. Para un límite
 * distribuido real, migrar a Upstash Redis / Vercel KV.
 *
 * Extraído de `proxy.ts` a su propio módulo puro para poder probarlo con
 * tests unitarios sin necesidad de simular un `NextRequest` completo.
 */
export class RateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly maxTrackedKeys: number;
  private readonly hits = new Map<string, number[]>();

  constructor(options: { windowMs: number; maxRequests: number; maxTrackedKeys?: number }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.maxTrackedKeys = options.maxTrackedKeys ?? 5_000;
  }

  /** Registra una solicitud para `key` y dice si excede el límite. */
  hit(key: string, now: number = Date.now()): boolean {
    // Poda simple para evitar crecimiento indefinido de memoria en instancias longevas.
    if (this.hits.size > this.maxTrackedKeys) {
      this.hits.clear();
    }

    const timestamps = (this.hits.get(key) || []).filter((t) => now - t < this.windowMs);
    timestamps.push(now);
    this.hits.set(key, timestamps);

    return timestamps.length > this.maxRequests;
  }

  /** Solo para tests: cuántas claves distintas se están rastreando ahora mismo. */
  get trackedKeyCount(): number {
    return this.hits.size;
  }

  /** Solo para tests: vaciar el estado entre casos. */
  reset(): void {
    this.hits.clear();
  }
}
