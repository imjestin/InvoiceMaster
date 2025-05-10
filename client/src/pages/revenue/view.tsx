import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import RevenueSplitDetail from "@/components/revenue/RevenueSplitDetail";
import MainLayout from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function ViewRevenueSplit() {
  const [location] = useLocation();
  const [splitId, setSplitId] = useState<number | null>(null);

  // Extract split ID from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const id = params.get("id");
    setSplitId(id ? parseInt(id) : null);
  }, [location]);

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {splitId ? (
            <RevenueSplitDetail splitId={splitId} />
          ) : (
            <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
