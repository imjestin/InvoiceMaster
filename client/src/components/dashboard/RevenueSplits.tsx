import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ProjectSplitSummary } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface RevenueSplitsProps {
  limit?: number;
}

export default function RevenueSplits({ limit = 3 }: RevenueSplitsProps) {
  const { data: splitSummaries, isLoading } = useQuery<ProjectSplitSummary[]>({
    queryKey: ["/api/project-split-summaries"]
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
  
  return (
    <Card className="shadow">
      <CardHeader className="border-b border-gray-200 p-4 flex justify-between items-center">
        <CardTitle className="text-lg font-medium">Recent Revenue Splits</CardTitle>
        <Link href="/revenue">
          <a className="text-sm font-medium text-primary-600 hover:text-primary-700">View all</a>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <ul role="list" className="divide-y divide-gray-200">
          {isLoading ? (
            Array.from({ length: limit }).map((_, index) => (
              <li key={index} className="px-4 py-4 sm:px-6">
                <div className="mb-2 flex justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="mt-2">
                  <div className="mb-1 flex justify-between">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="mb-1 flex justify-between">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </li>
            ))
          ) : (
            splitSummaries?.slice(0, limit).map((summary) => (
              <li key={summary.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-900">
                    Project Split #{summary.id}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(summary.totalAmount)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Created {format(new Date(summary.createdAt), "MMM d, yyyy")}
                  </div>
                  <Link href={`/revenue/view?id=${summary.id}`}>
                    <a className="text-xs text-primary-600 hover:text-primary-700">View details</a>
                  </Link>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Team Members ({((Number(summary.teamTotal) / Number(summary.totalAmount)) * 100).toFixed(0)}%)</span>
                    <span>{formatCurrency(summary.teamTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Agent Commission ({((Number(summary.commission) / Number(summary.totalAmount)) * 100).toFixed(0)}%)</span>
                    <span>{formatCurrency(summary.commission)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Company Profit ({((Number(summary.companyProfit) / Number(summary.totalAmount)) * 100).toFixed(0)}%)</span>
                    <span>{formatCurrency(summary.companyProfit)}</span>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
