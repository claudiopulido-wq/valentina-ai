import { createClient } from '@supabase/supabase-js';

const ugesBotUrl = process.env.NEXT_PUBLIC_UGES_BOT_SUPABASE_URL || '';
const ugesBotAnonKey = process.env.NEXT_PUBLIC_UGES_BOT_SUPABASE_ANON_KEY || '';

/**
 * Indica si las variables de entorno de la base de datos espejo de UGES
 * están configuradas. Nunca se usa una clave embebida en el código como
 * respaldo: si faltan, el cliente queda inutilizable de forma explícita.
 */
export const isUgesBotConfigured = Boolean(ugesBotUrl && ugesBotAnonKey);

/**
 * Cliente Supabase de solo lectura hacia la base de datos operativa
 * del Chatbot WhatsApp de la Universidad (UGES).
 * Garantía: Las consultas son de solo lectura ('select') para auditoría y visualización.
 */
export const ugesBotSupabase = createClient(
  ugesBotUrl || 'https://placeholder.supabase.co',
  ugesBotAnonKey || 'placeholder',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-application-name': 'valentina-platform-uges-dashboard-readonly',
      },
    },
  }
);
