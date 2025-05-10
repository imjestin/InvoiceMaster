import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for client-side operations
const supabaseUrl = import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a singleton instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);