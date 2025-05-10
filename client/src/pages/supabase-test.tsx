import MainLayout from "@/components/layout/MainLayout";
import { SupabaseTest } from "@/components/supabase/SupabaseTest";

export default function SupabaseTestPage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Supabase Connection Testing</h1>
        <p className="mb-8 text-gray-600">
          This page helps you verify that your Supabase connection is working properly using the App Router pattern.
        </p>
        
        <SupabaseTest />
      </div>
    </MainLayout>
  );
}