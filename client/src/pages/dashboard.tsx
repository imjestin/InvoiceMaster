import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import MetricsCards from "@/components/dashboard/MetricsCards";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RecentInvoices from "@/components/dashboard/RecentInvoices";
import RevenueSplits from "@/components/dashboard/RevenueSplits";
import { Button } from "@/components/ui/button";
import { File, Filter } from "lucide-react";

export default function Dashboard() {
  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <div className="flex space-x-3">
            <Button asChild>
              <Link href="/invoices/new">
                <File className="mr-2 h-4 w-4" />
                New Invoice
              </Link>
            </Button>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <MetricsCards stats={stats} isLoading={isLoading} />

        {/* Revenue Chart */}
        <RevenueChart isLoading={isLoading} />

        {/* Recent Invoices and Revenue Splits */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <RecentInvoices />
          <RevenueSplits />
        </div>
      </div>
    </div>
  );
}
