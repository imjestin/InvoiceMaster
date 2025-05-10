import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create a Supabase client for client-side operations
const supabaseUrl = "https://znpzfkwjxnylysxvrptv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpucHpma3dqeG55bHlzeHZycHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4OTE5MTMsImV4cCI6MjA2MjQ2NzkxM30.B_Nvu2EtLoPiPZWwA5noa7UVpJVXVZ2AJjHC-fbpzEs";

// Simple direct client creation
export const supabase = createClient(supabaseUrl, supabaseAnonKey);