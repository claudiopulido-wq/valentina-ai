import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase con privilegios de administrador (service_role).
 *
 * ADVERTENCIA: este cliente ignora Row Level Security. NUNCA debe importarse
 * desde un archivo 'use client' ni exponerse al navegador. Solo se usa dentro
 * de Route Handlers de Next.js (`app/api/**\/route.ts`), que se ejecutan
 * exclusivamente en el servidor.
 *
 * Requiere la variable de entorno `SUPABASE_SERVICE_ROLE_KEY` (Supabase
 * Dashboard → Project Settings → API → service_role secret). Nunca debe
 * llevar el prefijo NEXT_PUBLIC_ ni comitearse a git.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseAdminConfigured = Boolean(supabaseUrl && serviceRoleKey);

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
