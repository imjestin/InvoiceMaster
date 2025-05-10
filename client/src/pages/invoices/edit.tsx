import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditInvoice() {
  const [location] = useLocation();
  const [invoiceId, setInvoiceId] = useState<number | null>(null);

  // Extract invoice ID from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const id = params.get("id");
    setInvoiceId(id ? parseInt(id) : null);
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
              <CardTitle>Edit Invoice</CardTitle>
              <CardDescription>
                Update invoice details, line items, and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoiceId ? (
                <InvoiceForm invoiceId={invoiceId} />
              ) : (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
