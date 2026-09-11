import { createClient } from '@supabase/supabase-js';

const ugesBotUrl =
  process.env.NEXT_PUBLIC_UGES_BOT_SUPABASE_URL ||
  'https://jzlqwkfclrejblwayqef.supabase.co';

const ugesBotAnonKey =
  process.env.NEXT_PUBLIC_UGES_BOT_SUPABASE_ANON_KEY ||
  'sb_publishable_vbJQaQcMILT4QVUAj5Jouw_X9Kkmsbi';

/**
 * Cliente Supabase de solo lectura hacia la base de datos operativa
 * del Chatbot WhatsApp de la Universidad (UGES).
 * Garantía: Las consultas son de solo lectura ('select') para auditoría y visualización.
 */
export const ugesBotSupabase = createClient(ugesBotUrl, ugesBotAnonKey, {
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
});
