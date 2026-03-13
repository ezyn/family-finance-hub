import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FinanceProvider } from "@/lib/finance-context";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Members from "./pages/Members";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <FinanceProvider>
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-background dark:from-[hsl(270,40%,8%)] dark:via-[hsl(275,35%,12%)] dark:to-[hsl(265,30%,10%)]">
              <AppSidebar />
              <div className="flex-1 flex flex-col">
                <header className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4">
                  <div className="flex items-center">
                    <SidebarTrigger />
                    <h2 className="ml-3 text-sm font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                      Family Finance Dashboard
                    </h2>
                  </div>
                  <ThemeToggle />
                </header>
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/despesas" element={<Expenses />} />
                    <Route path="/membros" element={<Members />} />
                    <Route path="/configuracoes" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </FinanceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
