import { Request, Response } from 'express';
import { createServerClient } from '../utils/supabase';

export const supabaseTestHandler = async (req: Request, res: Response) => {
  try {
    // Get cookies (or any auth header) from request
    const cookieHeader = req.headers.cookie;
    
    // Create a Supabase client using the App Router pattern
    const supabase = createServerClient(cookieHeader);
    
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