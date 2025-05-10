import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import { useIsAuthenticated } from "@/lib/auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MainLayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export default function MainLayout({ children, requireAuth = true }: MainLayoutProps) {
  const { isAuthenticated, isLoading, user } = useIsAuthenticated();
  const isMobile = useMobile();
  const [_, setLocation] = useLocation();
  
  // If authentication is required and user is not authenticated, redirect to login
  if (requireAuth && !isLoading && !isAuthenticated) {
    setLocation("/login");
    return null;
  }
  
  // Show loading state
  if (requireAuth && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="py-10 flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <h1 className="text-xl font-semibold text-gray-900">Loading...</h1>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Mobile layout with sheet
  if (isMobile) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="flex flex-col w-full">
          <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex items-center justify-between shadow h-16">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 inline-flex items-center justify-center rounded-md">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <Sidebar user={user} mobile={true} />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center px-6">
              <h1 className="text-xl font-bold text-primary">
                <span className="mr-2">📄</span>SkillyVoice
              </h1>
            </div>
            
            <div className="h-12 w-12 inline-flex rounded-full items-center justify-center">
              {user && (
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          
          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            {children}
          </main>
        </div>
      </div>
    );
  }
  
  // Desktop layout
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
