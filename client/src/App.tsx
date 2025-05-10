import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from 'next-themes';

// Layout
import MainLayout from "@/components/layout/MainLayout";

// Auth Pages
import Login from "@/pages/login";
import Register from "@/pages/register";

// Main Pages
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

// Client Pages
import ClientsIndex from "@/pages/clients/index";
import NewClient from "@/pages/clients/new";
import EditClient from "@/pages/clients/edit";

// Project Pages
import ProjectsIndex from "@/pages/projects/index";
import NewProject from "@/pages/projects/new";
import EditProject from "@/pages/projects/edit";

// Invoice Pages
import InvoicesIndex from "@/pages/invoices/index";
import NewInvoice from "@/pages/invoices/new";
import EditInvoice from "@/pages/invoices/edit";
import ViewInvoice from "@/pages/invoices/view";

// Recurring Invoice Pages
import RecurringIndex from "@/pages/recurring/index";
import NewRecurring from "@/pages/recurring/new";
import EditRecurring from "@/pages/recurring/edit";

// Revenue Sharing Pages
import RevenueIndex from "@/pages/revenue/index";
import ViewRevenueSplit from "@/pages/revenue/view";

// Settings Page
import Settings from "@/pages/settings";

// Test Pages
import SupabaseTestPage from "@/pages/supabase-test";

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Dashboard */}
      <Route path="/dashboard">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>

      {/* Client Routes */}
      <Route path="/clients">
        <MainLayout>
          <ClientsIndex />
        </MainLayout>
      </Route>
      <Route path="/clients/new">
        <MainLayout>
          <NewClient />
        </MainLayout>
      </Route>
      <Route path="/clients/edit">
        <MainLayout>
          <EditClient />
        </MainLayout>
      </Route>

      {/* Project Routes */}
      <Route path="/projects">
        <MainLayout>
          <ProjectsIndex />
        </MainLayout>
      </Route>
      <Route path="/projects/new">
        <MainLayout>
          <NewProject />
        </MainLayout>
      </Route>
      <Route path="/projects/edit">
        <MainLayout>
          <EditProject />
        </MainLayout>
      </Route>

      {/* Invoice Routes */}
      <Route path="/invoices">
        <MainLayout>
          <InvoicesIndex />
        </MainLayout>
      </Route>
      <Route path="/invoices/new">
        <MainLayout>
          <NewInvoice />
        </MainLayout>
      </Route>
      <Route path="/invoices/edit">
        <MainLayout>
          <EditInvoice />
        </MainLayout>
      </Route>
      <Route path="/invoices/view">
        <MainLayout>
          <ViewInvoice />
        </MainLayout>
      </Route>

      {/* Recurring Invoice Routes */}
      <Route path="/recurring">
        <MainLayout>
          <RecurringIndex />
        </MainLayout>
      </Route>
      <Route path="/recurring/new">
        <MainLayout>
          <NewRecurring />
        </MainLayout>
      </Route>
      <Route path="/recurring/edit">
        <MainLayout>
          <EditRecurring />
        </MainLayout>
      </Route>

      {/* Revenue Sharing Routes */}
      <Route path="/revenue">
        <MainLayout>
          <RevenueIndex />
        </MainLayout>
      </Route>
      <Route path="/revenue/view">
        <MainLayout>
          <ViewRevenueSplit />
        </MainLayout>
      </Route>

      {/* Settings */}
      <Route path="/settings">
        <MainLayout>
          <Settings />
        </MainLayout>
      </Route>
      
      {/* Supabase Test */}
      <Route path="/supabase-test">
        <MainLayout>
          <SupabaseTestPage />
        </MainLayout>
      </Route>

      {/* Home redirect to dashboard */}
      <Route path="/">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
