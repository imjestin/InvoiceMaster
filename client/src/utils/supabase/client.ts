import { createClient } from '@supabase/supabase-js';

export const createSupabaseClient = () => {
  const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Create a singleton instance for client-side usage
export const supabase = createSupabaseClient();