/**
 * Logging estructurado en JSON con enmascarado automático de PII, siguiendo
 * las reglas del proyecto en `.agents/skills/enterprise-security-guardrails`
 * ("Mascarado en Logs") y `.agents/skills/enterprise-workflow-automation`
 * ("Registro estructurado con marcas de tiempo, origen, acción, estado").
 *
 * Antes, cada Route Handler usaba `console.warn`/`console.error` con texto
 * libre e interpolación directa de emails/teléfonos/tokens, sin estructura
 * consistente que un sistema de observabilidad (Vercel Logs, Datadog,
 * Sentry) pudiera indexar o filtrar de forma confiable.
 *
 * No sustituye un APM real: es la capa de estructura + higiene que hace que
 * conectar uno después (Sentry, Datadog) sea un cambio de una línea en vez
 * de reescribir cada `console.log` disperso en el código.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  route?: string;
  userId?: string;
  tenantId?: string | number | null;
  [key: string]: unknown;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(\+?\d[\d\s-]{7,}\d)/g;
const BEARER_RE = /Bearer\s+[A-Za-z0-9._-]+/gi;

/**
 * Enmascara emails, teléfonos y tokens Bearer dentro de strings antes de
 * escribirlos a logs. Se aplica recursivamente a objetos/arrays.
 */
export function maskPii<T>(value: T): T {
  if (typeof value === 'string') {
    return value
      .replace(BEARER_RE, 'Bearer [REDACTED]')
      .replace(EMAIL_RE, (m) => `${m.slice(0, 2)}***@***`)
      .replace(PHONE_RE, (m) => `${m.slice(0, 3)}***${m.slice(-2)}`) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => maskPii(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Nunca se registran contraseñas ni claves, ni siquiera enmascaradas.
      if (/password|secret|token|apikey|api_key/i.test(k)) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = maskPii(v);
      }
    }
    return out as T;
  }
  return value;
}

function write(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? maskPii(context) : {}),
  };

  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, context?: LogContext) => write('debug', message, context),
  info: (message: string, context?: LogContext) => write('info', message, context),
  warn: (message: string, context?: LogContext) => write('warn', message, context),
  error: (message: string, context?: LogContext) => write('error', message, context),
};
