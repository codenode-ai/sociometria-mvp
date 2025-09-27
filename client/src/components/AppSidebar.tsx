import { Home, Users, Building2, FileText, Network, BarChart3 } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";

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
    </Sidebar>
  );
}

