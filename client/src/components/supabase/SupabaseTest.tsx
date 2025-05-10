import { useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function SupabaseTest() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionMessage, setConnectionMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[] | null>(null);

  // Test the connection to Supabase
  const testConnection = async () => {
    setIsLoading(true);
    try {
      // Create a new client inside the function
      const supabaseUrl = "https://znpzfkwjxnylysxvrptv.supabase.co";
      const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpucHpma3dqeG55bHlzeHZycHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4OTE5MTMsImV4cCI6MjA2MjQ2NzkxM30.B_Nvu2EtLoPiPZWwA5noa7UVpJVXVZ2AJjHC-fbpzEs";
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Simple query to verify connection
      const { data, error } = await supabase.from('users').select('*').limit(1);
      
      if (error) {
        console.error("Supabase connection error:", error);
        setIsConnected(false);
        setConnectionMessage(`Error connecting to Supabase: ${error.message}`);
      } else {
        setIsConnected(true);
        setConnectionMessage("Successfully connected to Supabase!");
        setData(data);
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      setIsConnected(false);
      setConnectionMessage(`Unexpected error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test the server-side App Router pattern
  const testServerConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/supabase-test');
      const result = await response.json();
      
      if (response.ok) {
        setData(result);
        setIsConnected(true);
        setConnectionMessage("Successfully connected to Supabase via server (App Router pattern)!");
      } else {
        setIsConnected(false);
        setConnectionMessage(`Error connecting via server: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      setIsConnected(false);
      setConnectionMessage(`Unexpected error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
        <CardDescription>Test the connection to your Supabase instance using the App Router pattern</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Client Connection
            </Button>
            
            <Button 
              onClick={testServerConnection} 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Server Connection
            </Button>
          </div>
          
          {connectionMessage && (
            <div className={`mt-4 p-3 rounded ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {connectionMessage}
            </div>
          )}
          
          {data && (
            <div className="mt-4 p-3 rounded bg-gray-100">
              <h3 className="font-semibold mb-2">Data Preview:</h3>
              <pre className="text-sm overflow-auto max-h-48">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}