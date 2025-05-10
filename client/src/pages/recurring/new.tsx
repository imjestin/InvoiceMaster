import RecurringForm from "@/components/recurring/RecurringForm";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NewRecurring() {
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
              <CardTitle>Create Recurring Invoice</CardTitle>
              <CardDescription>
                Set up an invoice to be generated automatically on a schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecurringForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
