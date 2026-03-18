import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FinanceProvider } from "@/lib/finance-context";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Members from "./pages/Members";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const { signOut, user } = useAuth();

  return (
    <FinanceProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-primary/5 via-background to-accent/5 dark:from-[hsl(270,40%,8%)] dark:via-[hsl(275,35%,12%)] dark:to-[hsl(265,30%,10%)]">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4">
              <div className="flex items-center">
                <SidebarTrigger />
                <h2 className="ml-3 text-sm font-bold text-primary" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  Family Finance
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
                <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
                  <LogOut className="h-4 w-4" />
                </Button>
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 p-4 md:p-6 overflow-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/despesas" element={<Expenses />} />
                <Route path="/membros" element={<Members />} />
                <Route path="/configuracoes" element={<Settings />} />
                <Route path="/auth" element={<Navigate to="/" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </FinanceProvider>
  );
}

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          {user ? (
            <AuthenticatedApp />
          ) : (
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
