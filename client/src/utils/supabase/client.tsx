import { createClient } from '@supabase/supabase-js';

// For client-side usage
export const createBrowserClient = () => {
  // Access environment variables using Vite's import.meta.env
  // If using TypeScript, make sure vite-env.d.ts is properly set up
  const supabaseUrl = import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Export a singleton instance for convenience
export const supabase = createBrowserClient();