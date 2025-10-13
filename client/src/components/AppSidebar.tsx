import { Home, Users, Building2, FileText, ClipboardList, Network, BarChart3, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    titleKey: "navigation.dashboard",
    url: "/",
    icon: Home,
  },
  {
    titleKey: "navigation.employees",
    url: "/funcionarias",
    icon: Users,
  },
  {
    titleKey: "navigation.houses",
    url: "/casas",
    icon: Building2,
  },
  {
    titleKey: "navigation.tests",
    url: "/testes",
    icon: FileText,
  },
  {
    titleKey: "navigation.assessments",
    url: "/avaliacoes",
    icon: ClipboardList,
  },
  {
    titleKey: "navigation.sociometry",
    url: "/sociometria",
    icon: Network,
  },
  {
    titleKey: "navigation.reports",
    url: "/relatorios",
    icon: BarChart3,
  },
] as const;

export function AppSidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { userName, role, signOut } = useSession();

  const roleLabel =
    role === "admin"
      ? t("session.roles.admin", { defaultValue: "Administrador" })
      : t("session.roles.user", { defaultValue: "Empresa" });
  const displayName =
    userName && userName.trim().length > 0
      ? userName
      : t("session.userPlaceholder", { defaultValue: "Usuario" });

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Network className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">{t("app.name")}</h2>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation.label")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.titleKey.split(".").pop()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-4">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/10 p-4">
          <p className="text-sm font-semibold" data-testid="sidebar-user-name">
            {displayName}
          </p>
          <p className="text-xs text-muted-foreground" data-testid="sidebar-user-role">
            {roleLabel}
          </p>
        </div>
        <Button
          variant="outline"
          className="mt-3 w-full justify-start gap-2"
          onClick={handleSignOut}
          data-testid="button-sign-out"
        >
          <LogOut className="h-4 w-4" />
          {t("actions.signOut", { defaultValue: "Sair" })}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
