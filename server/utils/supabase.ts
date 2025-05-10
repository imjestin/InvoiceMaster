import { createClient } from '@supabase/supabase-js';
import { config } from '../../shared/config';

// This simulates the createClient pattern you'd use in Next.js App Router
// but adapted for our Express backend
export function createSupabaseServer() {
  if (!config.supabase.url || !config.supabase.anonKey) {
    throw new Error("Supabase credentials are not set in .env.local");
  }
  
  return createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      auth: {
        persistSession: false,
      }
    }
  );
}

// Create a function that mimics the Next.js App Router pattern
export function createServerClient(cookieHeader?: string) {
  const supabase = createSupabaseServer();
  
  // If we had cookies, we would set them here
  if (cookieHeader) {
    // In a real Next.js App Router implementation, we would use cookies here
    // supabase.auth.setSession({ access_token, refresh_token })
  }
  
  return supabase;
}