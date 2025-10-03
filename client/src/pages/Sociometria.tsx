import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SociometryGraph from "@/components/SociometryGraph";
import { useSociometryMocks } from "@/hooks/useSociometry";
import { mockSociometryEmployees } from "@/lib/mock/sociometry-data";
import type { Employee, SociometryQuestionKey } from "@shared/schema";

const FILTER_OPTIONS = [
  { value: "all", label: "sociometry.filters.all" },
  { value: "onlyPending", label: "sociometry.filters.pending" },
  { value: "onlyCompleted", label: "sociometry.filters.completed" },
] as const;

type FilterValue = (typeof FILTER_OPTIONS)[number]["value"];

const FILTER_LABELS: Record<FilterValue, string> = {
  all: "Todas as colaboradoras",
  onlyPending: "Somente pendentes",
  onlyCompleted: "Somente concluídas",
};

function buildEdgeMap(edges: Array<{ fromEmployeeId: string; toEmployeeId: string }>) {
  const map: Record<string, string[]> = {};
  edges.forEach((edge) => {
    if (!map[edge.fromEmployeeId]) {
      map[edge.fromEmployeeId] = [];
    }
    if (!map[edge.fromEmployeeId].includes(edge.toEmployeeId)) {
      map[edge.fromEmployeeId].push(edge.toEmployeeId);
    }
  });
  return map;
}

export default function Sociometria() {
  const { t } = useTranslation();
  const { form, links, responses, snapshot } = useSociometryMocks();
  const [selectedFilter, setSelectedFilter] = useState<FilterValue>("all");

  const activeLinkIds = useMemo(() => {
    switch (selectedFilter) {
      case "onlyPending":
        return links.filter((link) => link.status === "pending").map((link) => link.id);
      case "onlyCompleted":
        return links.filter((link) => link.status === "completed").map((link) => link.id);
      default:
        return links.filter((link) => link.status !== "expired").map((link) => link.id);
    }
  }, [links, selectedFilter]);

  const filteredResponses = useMemo(
    () => responses.filter((response) => activeLinkIds.includes(response.linkId)),
    [responses, activeLinkIds],
  );

  const employeesForGraph: Employee[] = useMemo(
    () =>
      mockSociometryEmployees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        role: employee.role as Employee["role"],
        status: "active",
        traits: [],
      })),
    [],
  );

  const preferenceMap = useMemo(() => buildEdgeMap(snapshot.preferredEdges), [snapshot.preferredEdges]);
  const avoidanceMap = useMemo(() => buildEdgeMap(snapshot.avoidanceEdges), [snapshot.avoidanceEdges]);

  const topPreferred = useMemo(
    () =>
      [...snapshot.preferredEdges]
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5)
        .map((edge) => ({
          from: edge.fromEmployeeId,
          to: edge.toEmployeeId,
          weight: edge.weight,
        })),
    [snapshot.preferredEdges],
  );

  const topAvoidances = useMemo(
    () =>
      [...snapshot.avoidanceEdges]
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5)
        .map((edge) => ({
          from: edge.fromEmployeeId,
          to: edge.toEmployeeId,
          weight: edge.weight,
        })),
    [snapshot.avoidanceEdges],
  );

  const roleIndicators = useMemo(
    () =>
      [...snapshot.roleIndicators].sort((a, b) => b.count - a.count),
    [snapshot.roleIndicators],
  );

  const employeeName = (id: string) =>
    mockSociometryEmployees.find((employee) => employee.id === id)?.name ?? id;

  const filteredLinkSet = useMemo(() => new Set(activeLinkIds), [activeLinkIds]);
  const filteredLinks = useMemo(
    () => links.filter((link) => filteredLinkSet.has(link.id)),
    [links, filteredLinkSet],
  );

  const responsesByQuestion = useMemo(() => {
    const map: Record<SociometryQuestionKey, number> = {
      preferWorkWith: 0,
      avoidWorkWith: 0,
      problemSolver: 0,
      moodKeeper: 0,
      hardHouseFirstPick: 0,
    };
    filteredResponses.forEach((response) => {
      map[response.questionId] += 1;
    });
    return map;
  }, [filteredResponses]);

  const collaboratorsWithResponses = filteredResponses.reduce((set, response) => {
    set.add(response.collaboratorId);
    return set;
  }, new Set<string>());

  const pendingCount = links.filter((link) => link.status === "pending").length;
  const completedCount = links.filter((link) => link.status === "completed").length;

  return (
    <div className="p-6 space-y-6" data-testid="page-sociometria">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("sociometry.title")}</h1>
          <p className="text-muted-foreground">{t("sociometry.subtitle")}</p>
        </div>
        <Select value={selectedFilter} onValueChange={(value: FilterValue) => setSelectedFilter(value)}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder={t("sociometry.filters.placeholder", { defaultValue: "Filtrar convites" }) ?? "Filtrar convites"} />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.label, { defaultValue: FILTER_LABELS[option.value] })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="md:h-[620px]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base font-semibold">
              {t("sociometry.invites.title", { defaultValue: "Status dos convites" })}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("sociometry.invites.counter", { defaultValue: "{{total}} convites · {{pending}} pendentes · {{completed}} concluídos",
                total: links.length,
                pending: pendingCount,
                completed: completedCount,
              })}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("sociometry.invites.empty", { defaultValue: "Nenhum convite corresponde ao filtro selecionado." })}
              </p>
            ) : (
              filteredLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium leading-tight">{employeeName(link.collaboratorId)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("sociometry.invites.created", { defaultValue: "Enviado em {{date}}",
                        date: link.createdAt.toLocaleDateString(),
                      })}
                    </p>
                  </div>
                  <Badge variant={link.status === "completed" ? "secondary" : "outline"}>
                    {t(`sociometry.invites.status.${link.status}`, { defaultValue: link.status === "completed" ? "Concluído" : link.status === "pending" ? "Pendente" : "Expirado" })}
                  </Badge>
                </div>
              ))
            )}
            <div className="pt-3 text-xs text-muted-foreground">
              {t("sociometry.invites.responses", { defaultValue: "{{answered}} de {{total}} colaboradoras responderam",
                answered: collaboratorsWithResponses.size,
                total: links.length,
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="md:h-[620px]">
          <CardHeader>
            <CardTitle>{t("sociometry.graph.title", { defaultValue: "Rede sociométrica" })}</CardTitle>
          </CardHeader>
          <CardContent>
            <SociometryGraph
              employees={employeesForGraph}
              preferences={preferenceMap}
              avoidances={avoidanceMap}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">{t("sociometry.strongPairs.title", { defaultValue: "Pares preferenciais" })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPreferred.map((edge, index) => (
              <div key={`${edge.from}-${edge.to}`} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="font-medium">
                    {employeeName(edge.from)}
                    <span className="mx-1">?</span>
                    {employeeName(edge.to)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("sociometry.strongPairs.weight", { value: edge.weight, defaultValue: `${edge.weight} citações` })}
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  {t("sociometry.strongPairs.badge", { defaultValue: "Alta afinidade" })}
                </Badge>
              </div>
            ))}
            {topPreferred.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("sociometry.strongPairs.empty", { defaultValue: "Ainda não há dados de preferências." })}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">{t("sociometry.problemPairs.title", { defaultValue: "Pares a evitar" })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topAvoidances.map((edge) => (
              <div key={`${edge.from}-${edge.to}`} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="font-medium">
                    {employeeName(edge.from)}
                    <span className="mx-1">?</span>
                    {employeeName(edge.to)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("sociometry.problemPairs.weight", { value: edge.weight, defaultValue: `${edge.weight} citações negativas` })}
                  </p>
                </div>
                <Badge variant="outline" className="bg-red-100 text-red-700">
                  {t("sociometry.problemPairs.badge", { defaultValue: "Monitorar" })}
                </Badge>
              </div>
            ))}
            {topAvoidances.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("sociometry.problemPairs.empty", { defaultValue: "Nenhum conflito mapeado." })}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("sociometry.roles.title", { defaultValue: "Pessoas referência no time" })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {roleIndicators.map((indicator) => (
            <div key={`${indicator.employeeId}-${indicator.role}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <div>
                <p className="font-medium leading-tight">{employeeName(indicator.employeeId)}</p>
                <p className="text-xs text-muted-foreground">
                  {t(`sociometry.roles.labels.${indicator.role}`, { defaultValue: indicator.role === "problemSolver" ? "Resolve problemas" : indicator.role === "moodKeeper" ? "Mantém o clima" : "Primeira escolha" })}
                </p>
              </div>
              <Badge variant="secondary">{indicator.count}</Badge>
            </div>
          ))}
          {roleIndicators.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("sociometry.roles.empty", { defaultValue: "Nenhum destaque identificado ainda." })}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}


