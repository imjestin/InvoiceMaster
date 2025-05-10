import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Invoice } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { format, isPast } from "date-fns";

interface RecentInvoicesProps {
  limit?: number;
}

export default function RecentInvoices({ limit = 4 }: RecentInvoicesProps) {
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"]
  });
  
  // Format currency
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };
  
  // Get status badge color
  const getStatusBadge = (status: string, dueDate?: Date | string) => {
    let color: "default" | "primary" | "secondary" | "destructive" | "outline" | null = null;
    
    switch (status) {
      case 'paid':
        color = "default";
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'sent':
        color = "primary";
        // Check if overdue
        if (dueDate && isPast(new Date(dueDate))) {
          return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
        }
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
      case 'overdue':
        color = "destructive";
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
      case 'draft':
        color = "secondary";
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
      default:
        return <Badge variant={color || "outline"}>{status}</Badge>;
    }
  };
  
  // Generate initials from name
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };
  
  return (
    <Card className="shadow">
      <CardHeader className="border-b border-gray-200 p-4 flex justify-between items-center">
        <CardTitle className="text-lg font-medium">Recent Invoices</CardTitle>
        <Link href="/invoices">
          <a className="text-sm font-medium text-primary-600 hover:text-primary-700">View all</a>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <ul role="list" className="divide-y divide-gray-200">
          {isLoading ? (
            Array.from({ length: limit }).map((_, index) => (
              <li key={index} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="ml-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-4 flex flex-col items-end">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </li>
            ))
          ) : (
            invoices?.slice(0, limit).map((invoice) => (
              <li key={invoice.id}>
                <Link href={`/invoices/view?id=${invoice.id}`}>
                  <a className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 font-medium">
                              {getInitials(invoice.invoiceNumber)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">Invoice #{invoice.invoiceNumber}</div>
                            <div className="text-sm text-gray-500">
                              Due {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-4 flex flex-col items-end">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(invoice.total)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {invoice.status === 'paid' 
                                ? `Paid ${invoice.paidDate ? format(new Date(invoice.paidDate), "MMM d, yyyy") : ''}`
                                : `Due ${format(new Date(invoice.dueDate), "MMM d, yyyy")}`
                              }
                            </div>
                          </div>
                          {getStatusBadge(invoice.status, invoice.dueDate)}
                        </div>
                      </div>
                    </div>
                  </a>
                </Link>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
