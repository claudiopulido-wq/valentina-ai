import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://xrheyqhigeutkzqigvmg.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyaGV5cWhpZ2V1dGt6cWlndm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NzQxNzgsImV4cCI6MjEwNDU1MDE3OH0.Z9erYcsz3HRFPb1N5w-Eg_Oj8hdU736OExB94goQVBg';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
