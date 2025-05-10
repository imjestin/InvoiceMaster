import ClientForm from "@/components/clients/ClientForm";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NewClient() {
  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-6">
            <Button variant="outline" asChild>
              <Link href="/clients">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Create New Client</CardTitle>
              <CardDescription>
                Add a new client to your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
