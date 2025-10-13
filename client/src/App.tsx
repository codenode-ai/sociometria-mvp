import type { CSSProperties } from "react";
import { Switch, Route, useRoute, Redirect, type RouteComponentProps } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { SessionProvider, useSession } from "@/hooks/useSession";
import { TestsProvider } from "@/hooks/useTests";
import { SociometryProvider } from "@/hooks/useSociometry";

import Dashboard from "@/pages/Dashboard";
import Funcionarias from "@/pages/Funcionarias";
import Casas from "@/pages/Casas";
import Testes from "@/pages/Testes";
import TestEditor from "@/pages/TestEditor";
import TestView from "@/pages/TestView";
import Avaliacoes from "@/pages/Avaliacoes";
import AssessmentPortal from "@/pages/AssessmentPortal";
import Sociometria from "@/pages/Sociometria";
import Relatorios from "@/pages/Relatorios";
import SociometriaPortal from "@/pages/SociometriaPortal";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/funcionarias" component={Funcionarias} />
      <Route path="/casas" component={Casas} />
      <Route path="/testes/novo" component={ProtectedTestEditor} />
      <Route path="/testes/:id/editar" component={ProtectedTestEditor} />
      <Route path="/testes/:id" component={TestView} />
      <Route path="/testes" component={Testes} />
      <Route path="/avaliacoes/:code" component={AssessmentPortal} />
      <Route path="/avaliacoes" component={Avaliacoes} />
      <Route path="/sociometria" component={Sociometria} />
      <Route path="/sociometria/link/:code" component={SociometriaPortal} />
      <Route path="/relatorios" component={Relatorios} />
      <Route path="/login" component={Login} />
      <Route path="/cadastro" component={Register} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAssessmentPortal] = useRoute("/avaliacoes/:code");
  const [isSociometryPortal] = useRoute("/sociometria/link/:code");
  const isPortalRoute = isAssessmentPortal || isSociometryPortal;
  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  } as CSSProperties;

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <TestsProvider>
          <SociometryProvider>
            <TooltipProvider>
              {isPortalRoute ? (
                <Router />
              ) : (
                <SidebarProvider style={sidebarStyle}>
                  <div className="flex h-screen w-full">
                    <AppSidebar />
                    <div className="flex flex-col flex-1">
                      <header className="flex items-center justify-between p-4 border-b bg-background">
                        <SidebarTrigger data-testid="button-sidebar-toggle" />
                        <div className="flex items-center gap-2">
                          <LanguageToggle />
                          <ThemeToggle />
                        </div>
                      </header>
                      <main className="flex-1 overflow-hidden">
                        <div className="h-full overflow-auto">
                          <Router />
                        </div>
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              )}
              <Toaster />
            </TooltipProvider>
          </SociometryProvider>
        </TestsProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

function ProtectedTestEditor(props: RouteComponentProps<Record<string, string>>) {
  const { currentUser } = useSession();
  if (currentUser.role !== "psychologist") {
    return <Redirect to="/testes" />;
  }
  return <TestEditor {...props} />;
}

export default App;
