import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, Users, Clock, Award } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useEmployees } from "@/hooks/useEmployees";
import { useTests } from "@/hooks/useTests";
import { useHouses } from "@/hooks/useHouses";
import type { Employee } from "@shared/schema";

type PerformanceDatum = {
  name: string;
  tasks: number;
  rating: number;
};

type CombinationDatum = {
  pairKey: string;
  pair: string;
  success: number;
  color: string;
};

type StatusSlice = {
  status: Employee["status"];
  value: number;
  color: string;
};

const COMBINATION_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];

function buildPerformanceDataset(employees: Employee[]): PerformanceDatum[] {
  return employees
    .map((employee) => {
      const interactions = (employee.preferences?.length ?? 0) + (employee.avoidances?.length ?? 0);
      const ratingBase = 4.2 + (employee.preferences?.length ?? 0) * 0.15 - (employee.avoidances?.length ?? 0) * 0.25;
      const rating = Math.min(5, Math.max(1, Number(ratingBase.toFixed(2))));
      return {
        name: employee.name,
        tasks: interactions,
        rating,
      };
    })
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 8);
}

function buildCombinationDataset(employees: Employee[]): CombinationDatum[] {
  const combinations: CombinationDatum[] = [];
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const seen = new Set<string>();

  employees.forEach((employee) => {
    const prefs = employee.preferences ?? [];
    prefs.forEach((targetId) => {
      const target = employeesById.get(targetId);
      if (!target) return;
      const key = [employee.id, target.id].sort().join("-");
      if (seen.has(key)) return;
      const mutual = (target.preferences ?? []).includes(employee.id);
      const avoidance = (employee.avoidances ?? []).includes(target.id) || (target.avoidances ?? []).includes(employee.id);
      let success = 70 + (prefs.length + (target.preferences ?? []).length) * 5;
      if (mutual) success += 10;
      if (avoidance) success -= 20;
      success = Math.min(98, Math.max(35, success));
      combinations.push({
        pairKey: key,
        pair: `${employee.name} & ${target.name}`,
        success: Math.round(success),
        color: COMBINATION_COLORS[combinations.length % COMBINATION_COLORS.length],
      });
      seen.add(key);
    });
  });

  return combinations.sort((a, b) => b.success - a.success).slice(0, 6);
}

function buildStatusDataset(employees: Employee[]): StatusSlice[] {
  const colors: Record<Employee["status"], string> = {
    active: "#10b981",
    leave: "#f59e0b",
    inactive: "#ef4444",
  };

  const counts = employees.reduce<Record<Employee["status"], number>>(
    (acc, employee) => {
      acc[employee.status] = (acc[employee.status] ?? 0) + 1;
      return acc;
    },
    { active: 0, leave: 0, inactive: 0 },
  );

  return (Object.entries(counts) as Array<[Employee["status"], number]>)
    .filter(([, value]) => value > 0)
    .map(([status, value]) => ({
      status,
      value,
      color: colors[status],
    }));
}

const reportCards = [
  {
    icon: Award,
    titleKey: "reports.cards.individualPerformance.title",
    descriptionKey: "reports.cards.individualPerformance.description",
    color: "text-blue-600",
  },
  {
    icon: Users,
    titleKey: "reports.cards.pairEfficiency.title",
    descriptionKey: "reports.cards.pairEfficiency.description",
    color: "text-green-600",
  },
  {
    icon: Clock,
    titleKey: "reports.cards.temporalAnalysis.title",
    descriptionKey: "reports.cards.temporalAnalysis.description",
    color: "text-purple-600",
  },
  {
    icon: TrendingUp,
    titleKey: "reports.cards.generalIndicators.title",
    descriptionKey: "reports.cards.generalIndicators.description",
    color: "text-orange-600",
  },
];

export default function Relatorios() {
  const { t } = useTranslation();
  const {
    employees,
    isLoading: employeesLoading,
    isError: employeesError,
  } = useEmployees();
  const {
    houses,
    isLoading: housesLoading,
    isError: housesError,
  } = useHouses();
  const { tests, isLoading: testsLoading, isError: testsError } = useTests();

  const isLoading = employeesLoading || housesLoading || testsLoading;
  const hasError = employeesError || housesError || testsError;

  const performanceData = useMemo(
    () => buildPerformanceDataset(employees),
    [employees],
  );
  const combinationData = useMemo(
    () => buildCombinationDataset(employees),
    [employees],
  );
  const statusDistribution = useMemo(
    () => buildStatusDataset(employees),
    [employees],
  );

  const localizedStatusData = useMemo(
    () =>
      statusDistribution.map((item) => ({
        ...item,
        name: t(`statuses.${item.status}`),
      })),
    [statusDistribution, t],
  );

  const localizedCombinations = useMemo(
    () =>
      combinationData.map((combo, index) => ({
        ...combo,
        label: combo.pair,
        index,
      })),
    [combinationData],
  );

  const handleExportPDF = (reportType: string) => {
    console.log("Exporting PDF for:", reportType);
  };

  const getBadgeLabel = (success: number) => {
    if (success >= 90) return t("reports.charts.badge.excellent");
    if (success >= 80) return t("reports.charts.badge.good");
    return t("reports.charts.badge.regular");
  };

  if (hasError) {
    return (
      <div className="p-6 space-y-4" data-testid="page-relatorios-error">
        <h1 className="text-3xl font-bold">{t("reports.title")}</h1>
        <p className="text-destructive">
          {t("reports.error", { defaultValue: "Nao foi possivel carregar os relatorios." })}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4" data-testid="page-relatorios-loading">
        <h1 className="text-3xl font-bold">{t("reports.title")}</h1>
        <p className="text-muted-foreground">
          {t("reports.loading", { defaultValue: "Carregando dados analiticos..." })}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-relatorios">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("reports.title")}</h1>
          <p className="text-muted-foreground">
            {t("reports.subtitle")}
          </p>
        </div>
        <Button onClick={() => handleExportPDF("general")} data-testid="button-export-general">
          <Download className="w-4 h-4 mr-2" />
          {t("reports.export")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((report) => (
          <Card key={report.titleKey} className="hover-elevate cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t(report.titleKey)}</CardTitle>
              <report.icon className={`h-4 w-4 ${report.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{t(report.descriptionKey)}</p>
              <div className="mt-3 text-xs text-muted-foreground">
                {t("reports.summary.employees", {
                  count: employees.length,
                  defaultValue: `Colaboradoras: ${employees.length}`,
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("reports.summary.houses", {
                  count: houses.length,
                  defaultValue: `Casas: ${houses.length}`,
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("reports.summary.tests", {
                  count: tests.length,
                  defaultValue: `Testes: ${tests.length}`,
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => handleExportPDF(report.titleKey)}
                data-testid={`button-export-${report.titleKey.split(".").pop()}`}
              >
                <Download className="w-3 h-3 mr-1" />
                {t("actions.export")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.charts.performance")}</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("reports.charts.emptyPerformance", {
                  defaultValue: "Ainda nao ha interacoes suficientes para montar este grafico.",
                })}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="tasks"
                    fill="hsl(var(--chart-1))"
                    name={t("reports.charts.performance")}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("reports.charts.statusDistribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            {localizedStatusData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("reports.charts.emptyStatus", {
                  defaultValue: "Cadastre colaboradoras para visualizar a distribuicao de status.",
                })}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={localizedStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {localizedStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.charts.topCombinations")}</CardTitle>
        </CardHeader>
        <CardContent>
          {localizedCombinations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("reports.charts.emptyCombinations", {
                defaultValue: "Registre preferencias entre colaboradoras para acompanhar combinacoes fortes.",
              })}
            </p>
          ) : (
            <div className="space-y-4">
              {localizedCombinations.map((combo) => (
                <div key={combo.pairKey} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: combo.color }} />
                    <div>
                      <p className="font-medium" data-testid={`text-combo-${combo.index}`}>
                        {combo.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("reports.charts.successRate", { rate: combo.success })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{getBadgeLabel(combo.success)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
