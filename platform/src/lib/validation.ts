import { z } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Respuesta 400 uniforme para cualquier payload que no pase su esquema Zod.
 * Antes, cada Route Handler validaba manualmente con `if (!campo)`, sin
 * verificar tipos, formatos (email, longitud) ni rechazar campos con forma
 * incorrecta — solo ausencia total del campo.
 */
export function validationErrorResponse(error: z.ZodError) {
  return NextResponse.json(
    {
      error: 'Los datos enviados no son válidos.',
      code: 'VALIDATION_ERROR',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    },
    { status: 400 }
  );
}

const ROLE_VALUES = ['superadmin', 'tenant_admin', 'advisor', 'evaluator'] as const;
const LEVEL_VALUES = ['director', 'coordinador', 'vendedor', 'asesor', 'evaluador', 'soporte'] as const;
const TENANT_STATUS_VALUES = ['active', 'trial', 'suspended'] as const;
const TENANT_PLAN_VALUES = ['Growth', 'Enterprise', 'Scale'] as const;
const USER_STATUS_VALUES = ['active', 'suspended', 'pending'] as const;

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1).max(200),
  recipient: z.string().min(5).max(40),
  message: z.string().min(1).max(4096),
  senderName: z.string().max(150).optional(),
  channel: z.string().max(30).optional(),
  phoneNumberId: z.string().max(60).optional(),
  wabaId: z.string().max(60).optional(),
  tenantSlug: z.string().max(60).optional(),
});

// El objeto CommercialQuote completo tiene más campos numéricos/opcionales
// (ver types/platform.ts); aquí se validan estrictamente los críticos para
// el envío (destinatario, montos, identidad) y se deja pasar el resto tal
// cual con `.passthrough()` en vez de duplicar todo el tipo.
export const sendQuoteSchema = z.object({
  quote: z
    .object({
      id: z.string().min(1),
      folio: z.string().min(1).max(60),
      companyName: z.string().min(1).max(200),
      contactName: z.string().min(1).max(200),
      contactEmail: z.string().email(),
      plan: z.enum(TENANT_PLAN_VALUES),
      billingPeriod: z.enum(['monthly', 'annual']),
      setupFeeMxn: z.number().nonnegative(),
      monthlyFeeMxn: z.number().nonnegative(),
      monthlySavingsMxn: z.number(),
      amortizationDays: z.number().nonnegative(),
      selectedFeatures: z.array(z.string()).default([]),
      expiresAt: z.string().min(1),
    })
    .passthrough(),
  emailTo: z.string().email(),
  personalNote: z.string().max(1000).optional(),
});

export const knowledgeCreateSchema = z.object({
  titulo: z.string().min(1).max(200),
  contenido: z.string().min(1).max(20000),
  categoria: z.string().min(1).max(100),
});

export const knowledgeUpdateSchema = knowledgeCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debes enviar al menos un campo (titulo, contenido o categoria) para actualizar.' }
);

export const tenantCreateSchema = z
  .object({
    id: z.string().min(1).max(100),
    slug: z.string().min(1).max(100),
    name: z.string().min(1).max(200),
    status: z.enum(TENANT_STATUS_VALUES).optional(),
    plan: z.enum(TENANT_PLAN_VALUES).optional(),
    railwayTenantId: z.number().int().positive().optional(),
  })
  .passthrough();

export const tenantPatchSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    status: z.enum(TENANT_STATUS_VALUES).optional(),
    plan: z.enum(TENANT_PLAN_VALUES).optional(),
    railwayTenantId: z.number().int().positive().optional(),
  })
  .passthrough();

export const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(200),
  tenantId: z.string().nullable().optional(),
  role: z.enum(ROLE_VALUES),
  level: z.enum(LEVEL_VALUES).optional(),
  jobTitle: z.string().max(150).optional(),
  notes: z.string().max(1000).optional(),
  password: z.string().min(8).max(200),
});

export const userPatchSchema = z
  .object({
    status: z.enum(USER_STATUS_VALUES).optional(),
    role: z.enum(ROLE_VALUES).optional(),
    level: z.enum(LEVEL_VALUES).optional(),
    tenantId: z.string().nullable().optional(),
    jobTitle: z.string().max(150).optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo válido para actualizar.',
  });
