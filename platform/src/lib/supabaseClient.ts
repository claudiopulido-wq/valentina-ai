import { createClient } from '@supabase/supabase-js';

// Nunca se hardcodea la URL/clave real como fallback (ver auditoría de
// seguridad): si la variable de entorno falta, el cliente usa un placeholder
// inerte en vez de una credencial real embebida en el código fuente. Si esto
// causa un fallo de build en Vercel, la causa real es que las env vars
// NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY no están
// configuradas ahí para el entorno correspondiente — eso se corrige en
// Vercel → Project Settings → Environment Variables, no reintroduciendo el
// valor en el código.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
