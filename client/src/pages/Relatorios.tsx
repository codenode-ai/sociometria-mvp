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

const performanceData = [
  { name: "Ana Silva", tasks: 45, rating: 4.8 },
  { name: "Maria Santos", tasks: 38, rating: 4.6 },
  { name: "Carla Oliveira", tasks: 32, rating: 4.2 },
  { name: "Julia Costa", tasks: 41, rating: 4.7 },
  { name: "Patricia Lima", tasks: 35, rating: 4.4 },
];

const combinationData = [
  { pairKey: "anaMaria", pair: "Ana & Maria", success: 95, color: "#10b981" },
  { pairKey: "carlaJulia", pair: "Carla & Julia", success: 88, color: "#3b82f6" },
  { pairKey: "anaJulia", pair: "Ana & Julia", success: 82, color: "#8b5cf6" },
  { pairKey: "mariaPatricia", pair: "Maria & Patricia", success: 79, color: "#f59e0b" },
];

const statusDistribution = [
  { status: "active", value: 20, color: "#10b981" },
  { status: "leave", value: 3, color: "#f59e0b" },
  { status: "inactive", value: 1, color: "#ef4444" },
];

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

  const localizedStatusData = useMemo(
    () =>
      statusDistribution.map((item) => ({
        ...item,
        name: t(`statuses.${item.status}`),
      })),
    [t],
  );

  const localizedCombinations = useMemo(
    () =>
      combinationData.map((combo, index) => ({
        ...combo,
        label: t(`reports.combinations.${combo.pairKey}`, { defaultValue: combo.pair }),
        index,
      })),
    [t],
  );

  const handleExportPDF = (reportType: string) => {
    console.log("Exporting PDF for:", reportType);
  };

  const getBadgeLabel = (success: number) => {
    if (success >= 90) return t("reports.charts.badge.excellent");
    if (success >= 80) return t("reports.charts.badge.good");
    return t("reports.charts.badge.regular");
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-relatorios">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("reports.title")}</h1>
          <p className="text-muted-foreground">{t("reports.subtitle")}</p>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasks" fill="hsl(var(--chart-1))" name={t("reports.charts.performance")}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("reports.charts.statusDistribution")}</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.charts.topCombinations")}</CardTitle>
        </CardHeader>
        <CardContent>
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
                <Badge
                  variant="secondary"
                  className={
                    combo.success >= 90
                      ? "bg-green-100 text-green-700"
                      : combo.success >= 80
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }
                >
                  {getBadgeLabel(combo.success)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}