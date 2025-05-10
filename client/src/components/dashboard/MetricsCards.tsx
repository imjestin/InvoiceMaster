import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface DashboardStats {
  totalRevenue: number;
  pendingAmount: number;
  pendingCount: number;
  overdueAmount: number;
  overdueCount: number;
  paidAmount: number;
  paidCount: number;
}

interface MetricsCardsProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

export default function MetricsCards({ stats, isLoading }: MetricsCardsProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Calculate percentage change (for demo purposes, showing a static value)
  const percentChange = 12;
  
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Revenue Card */}
      <Card className="overflow-hidden shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-500 rounded-md p-3">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <div className="flex items-baseline">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="ml-2 h-4 w-12" />
                  </div>
                </>
              ) : (
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats?.totalRevenue || 0)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="sr-only">Increased by</span>
                      {percentChange}%
                    </div>
                  </dd>
                </dl>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Pending Card */}
      <Card className="overflow-hidden shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-amber-500 rounded-md p-3">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <div className="flex items-baseline">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="ml-2 h-4 w-12" />
                  </div>
                </>
              ) : (
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Invoices</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats?.pendingAmount || 0)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-amber-600">
                      <span className="sr-only">Invoices pending</span>
                      {stats?.pendingCount || 0} invoice{stats?.pendingCount !== 1 ? 's' : ''}
                    </div>
                  </dd>
                </dl>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Overdue Card */}
      <Card className="overflow-hidden shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <div className="flex items-baseline">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="ml-2 h-4 w-12" />
                  </div>
                </>
              ) : (
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Overdue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats?.overdueAmount || 0)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                      <span className="sr-only">Invoices overdue</span>
                      {stats?.overdueCount || 0} invoice{stats?.overdueCount !== 1 ? 's' : ''}
                    </div>
                  </dd>
                </dl>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Paid Card */}
      <Card className="overflow-hidden shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <div className="flex items-baseline">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="ml-2 h-4 w-12" />
                  </div>
                </>
              ) : (
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Paid Invoices</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats?.paidAmount || 0)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <span className="sr-only">Invoices paid</span>
                      {stats?.paidCount || 0} invoice{stats?.paidCount !== 1 ? 's' : ''}
                    </div>
                  </dd>
                </dl>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
