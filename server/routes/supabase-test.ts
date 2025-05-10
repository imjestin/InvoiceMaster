import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const supabaseTestHandler = async (req: Request, res: Response) => {
  try {
    // Create Supabase client directly in this handler
    const supabaseUrl = "https://znpzfkwjxnylysxvrptv.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpucHpma3dqeG55bHlzeHZycHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4OTE5MTMsImV4cCI6MjA2MjQ2NzkxM30.B_Nvu2EtLoPiPZWwA5noa7UVpJVXVZ2AJjHC-fbpzEs";
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test query
    const { data, error } = await supabase.from('users').select('*').limit(5);
    
    if (error) {
      console.error("Error fetching data from Supabase:", error);
      return res.status(500).json({ 
        error: error.message,
        success: false 
      });
    }
    
    return res.status(200).json({
      success: true,
      data: data,
      message: "Successfully connected to Supabase"
    });
  } catch (err: any) {
    console.error("Server error testing Supabase connection:", err);
    return res.status(500).json({ 
      error: err.message,
      success: false 
    });
  }
};