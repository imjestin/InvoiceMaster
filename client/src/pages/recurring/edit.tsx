import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import RecurringForm from "@/components/recurring/RecurringForm";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditRecurring() {
  const [location] = useLocation();
  const [recurringId, setRecurringId] = useState<number | null>(null);

  // Extract recurring invoice ID from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const id = params.get("id");
    setRecurringId(id ? parseInt(id) : null);
  }, [location]);

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-6">
            <Button variant="outline" asChild>
              <Link href="/recurring">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Recurring Invoices
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Edit Recurring Invoice</CardTitle>
              <CardDescription>
                Update recurring invoice settings and schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recurringId ? (
                <RecurringForm recurringId={recurringId} />
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
