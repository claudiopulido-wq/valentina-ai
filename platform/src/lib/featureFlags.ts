/**
 * Feature flags mínimos para probar funciones nuevas directamente en
 * producción sin un entorno de staging — el propio `AGENTS.md` del proyecto
 * establece una "Política Cero-Localhost" que prohíbe entornos de prueba
 * fuera de `https://portal.valentina-ai.mx`, así que la validación de una
 * función nueva tiene que ocurrir ahí, pero limitada a quien la está
 * probando, no expuesta de una vez a todos los clientes.
 *
 * Un flag se activa de dos formas, sin necesitar una base de datos:
 * 1. Globalmente, con una variable de entorno (`envVar === 'true' | '1'`).
 * 2. Solo para una lista de correos "beta" (normalmente el propio SuperAdmin),
 *    mientras el flag global sigue apagado para todos los demás.
 *
 * Ejemplo de uso real:
 *
 * ```ts
 * const NUEVO_FLUJO_ONBOARDING: FeatureFlagDefinition = {
 *   envVar: 'FEATURE_ONBOARDING_V2',
 *   betaEmails: ['contacto@valentina-ai.mx'],
 * };
 *
 * if (isFeatureEnabled(NUEVO_FLUJO_ONBOARDING, currentUser?.email)) {
 *   // Solo Claudio ve el flujo nuevo hasta que se confirme y se active
 *   // FEATURE_ONBOARDING_V2=true en Vercel para todos.
 * }
 * ```
 */
export interface FeatureFlagDefinition {
  /** Nombre de la variable de entorno que activa el flag globalmente. */
  envVar: string;
  /** Correos (case-insensitive) que ven la función aunque el flag global esté apagado. */
  betaEmails?: string[];
}

export function isFeatureEnabled(
  flag: FeatureFlagDefinition,
  userEmail?: string | null
): boolean {
  const globalValue = process.env[flag.envVar];
  if (globalValue === 'true' || globalValue === '1') {
    return true;
  }

  if (userEmail && flag.betaEmails?.length) {
    const normalized = userEmail.toLowerCase();
    return flag.betaEmails.some((email) => email.toLowerCase() === normalized);
  }

  return false;
}
