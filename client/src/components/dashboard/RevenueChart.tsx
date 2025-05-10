import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";

// Sample data for the chart
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface ChartData {
  name: string;
  amount: number;
}

interface RevenueChartProps {
  isLoading: boolean;
}

export default function RevenueChart({ isLoading }: RevenueChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  
  // Generate sample data for the chart
  useEffect(() => {
    if (!isLoading) {
      const currentMonth = new Date().getMonth();
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const monthIndex = (currentMonth - 5 + i) % 12;
        return {
          name: months[monthIndex >= 0 ? monthIndex : monthIndex + 12],
          amount: Math.floor(Math.random() * 20000) + 5000
        };
      });
      
      setData(last6Months);
    }
  }, [isLoading]);
  
  // Format currency for the tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  return (
    <Card className="mt-8 shadow">
      <CardHeader className="border-b border-gray-200 px-6 py-4">
        <CardTitle className="text-lg font-medium">Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent className="p-6 h-80">
        {isLoading ? (
          <div className="h-full flex flex-col justify-center items-center">
            <Skeleton className="h-full w-full rounded" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="hsl(var(--primary))" 
                fill="hsla(var(--primary), 0.2)" 
                activeDot={{ r: 6 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
