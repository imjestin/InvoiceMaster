import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { format } from "date-fns";
import { generateInvoicePDF, downloadPDF } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Edit,
  Send,
  FileText,
  Building,
  Calendar,
  Clock,
} from "lucide-react";

export default function ViewInvoice() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [invoiceId, setInvoiceId] = useState<number | null>(null);

  // Extract invoice ID from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const id = params.get("id");
    setInvoiceId(id ? parseInt(id) : null);
  }, [location]);

  // Fetch invoice data
  const { data: invoice, isLoading: isLoadingInvoice } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
  });

  // Fetch line items
  const { data: lineItems, isLoading: isLoadingLineItems } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}/line-items`],
    enabled: !!invoiceId,
  });

  // Fetch project info
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: [`/api/projects/${invoice?.projectId}`],
    enabled: !!invoice?.projectId,
  });

  // Fetch client info
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: [`/api/clients/${project?.clientId}`],
    enabled: !!project?.clientId,
  });

  // Format currency
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "sent":
        return <Badge variant="primary">Sent</Badge>;
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Download invoice as PDF
  const handleDownloadPDF = async () => {
    if (!invoice || !client || !project || !lineItems) return;

    try {
      const pdfBlob = await generateInvoicePDF(invoice, client, project, lineItems);
      downloadPDF(pdfBlob, `Invoice-${invoice.invoiceNumber}.pdf`);

      toast({
        title: "Success",
        description: "Invoice PDF generated and downloaded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  // Send invoice by email (placeholder)
  const handleSendEmail = () => {
    toast({
      title: "Not Implemented",
      description: "Email functionality is not implemented in this demo",
    });
  };

  const isLoading =
    isLoadingInvoice || isLoadingLineItems || isLoadingProject || isLoadingClient;

  if (!invoiceId) {
    return (
      <MainLayout>
        <div className="py-6">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Invoice ID not provided</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/invoices">Back to Invoices</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="outline" asChild>
              <Link href="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
              </Link>
            </Button>

            {!isLoading && invoice && (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleSendEmail}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
                <Button variant="outline" onClick={handleDownloadPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button asChild>
                  <Link href={`/invoices/edit?id=${invoice.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : invoice && client && project ? (
            <>
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      Invoice #{invoice.invoiceNumber}
                    </CardTitle>
                    <CardDescription>
                      {project.name} - {client.name}
                    </CardDescription>
                  </div>
                  <div>{getStatusBadge(invoice.status)}</div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Bill To:</h3>
                        <div className="mt-1">
                          <p className="font-medium">{client.name}</p>
                          {client.company && <p>{client.company}</p>}
                          <p>{client.email}</p>
                          {client.phone && <p>{client.phone}</p>}
                          {client.address && <p>{client.address}</p>}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Project:</h3>
                        <div className="mt-1">
                          <p className="font-medium">{project.name}</p>
                          {project.description && <p>{project.description}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Issue Date:</p>
                          <p className="font-medium">
                            {format(new Date(invoice.issueDate), "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Due Date:</p>
                          <p className="font-medium">
                            {format(new Date(invoice.dueDate), "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      {invoice.status === "paid" && invoice.paidDate && (
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-green-500" />
                          <div>
                            <p className="text-sm text-gray-500">Paid On:</p>
                            <p className="font-medium">
                              {format(new Date(invoice.paidDate), "MMMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center">
                        <Building className="h-5 w-5 mr-2 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">From:</p>
                          <p className="font-medium">SkillyVoice</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tax (%)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {lineItems?.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(item.rate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.tax || "0"}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Summary</h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Subtotal:</span>
                      <span className="font-medium">
                        {formatCurrency(invoice.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Tax:</span>
                      <span className="font-medium">
                        {formatCurrency(invoice.tax)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(invoice.total)}</span>
                    </div>
                  </div>

                  {invoice.notes && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Notes:</h4>
                      <p className="text-gray-700">{invoice.notes}</p>
                    </div>
                  )}

                  {invoice.status !== "paid" && (
                    <div className="mt-6 flex justify-end">
                      <Button className="w-full sm:w-auto">
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Mark as Paid
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Invoice not found</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/invoices">Back to Invoices</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
