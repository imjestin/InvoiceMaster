import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NewInvoice() {
  const [location] = useLocation();
  const [projectId, setProjectId] = useState<number | null>(null);

  // Extract project ID from URL query parameters if coming from a project
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const id = params.get("projectId");
    setProjectId(id ? parseInt(id) : null);
  }, [location]);

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-6">
            <Button variant="outline" asChild>
              <Link href="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Create New Invoice</CardTitle>
              <CardDescription>
                Create a new invoice with line items and payment details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
