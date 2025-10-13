import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import SociometryGraph from "@/components/SociometryGraph";
import { useEmployees } from "@/hooks/useEmployees";
import { useToast } from "@/hooks/use-toast";
import type { Employee } from "@shared/schema";

type RelationshipsState = Record<string, string[]>;

function buildBaseMap(employees: Employee[], key: "preferences" | "avoidances"): RelationshipsState {
  return employees.reduce<RelationshipsState>((acc, employee) => {
    acc[employee.id] = [...(employee[key] ?? [])];
    return acc;
  }, {});
}

export default function Sociometria() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const {
    employees,
    isLoading,
    isError,
    updateEmployee,
  } = useEmployees();

  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [editedPreferences, setEditedPreferences] = useState<RelationshipsState>({});
  const [editedAvoidances, setEditedAvoidances] = useState<RelationshipsState>({});
  const [isSaving, setIsSaving] = useState(false);

  const basePreferences = useMemo(
    () => buildBaseMap(employees, "preferences"),
    [employees],
  );
  const baseAvoidances = useMemo(
    () => buildBaseMap(employees, "avoidances"),
    [employees],
  );

  const combinedPreferences = useMemo(() => {
    const merged: RelationshipsState = { ...basePreferences };
    Object.entries(editedPreferences).forEach(([key, value]) => {
      merged[key] = value;
    });
    return merged;
  }, [basePreferences, editedPreferences]);

  const combinedAvoidances = useMemo(() => {
    const merged: RelationshipsState = { ...baseAvoidances };
    Object.entries(editedAvoidances).forEach(([key, value]) => {
      merged[key] = value;
    });
    return merged;
  }, [baseAvoidances, editedAvoidances]);

  const employeesById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees],
  );

  const strongPairs = useMemo(() => {
    const pairs: { from: string; to: string }[] = [];
    const seen = new Set<string>();

    Object.entries(combinedPreferences).forEach(([employeeId, prefs]) => {
      prefs.forEach((targetId) => {
        if (combinedPreferences[targetId]?.includes(employeeId)) {
          const [a, b] = [employeeId, targetId].sort();
          const key = `${a}-${b}`;
          if (seen.has(key)) return;
          const from = employeesById.get(employeeId);
          const to = employeesById.get(targetId);
          if (from && to) {
            pairs.push({ from: from.name, to: to.name });
            seen.add(key);
          }
        }
      });
    });

    return pairs;
  }, [combinedPreferences, employeesById]);

  const problemPairs = useMemo(() => {
    const pairs: { from: string; to: string }[] = [];

    Object.entries(combinedAvoidances).forEach(([employeeId, avoids]) => {
      const from = employeesById.get(employeeId);
      if (!from) return;
      avoids.forEach((targetId) => {
        const to = employeesById.get(targetId);
        if (to) {
          pairs.push({ from: from.name, to: to.name });
        }
      });
    });

    return pairs;
  }, [combinedAvoidances, employeesById]);

  const selectableEmployees = useMemo(
    () => employees.filter((employee) => employee.id !== selectedEmployee),
    [employees, selectedEmployee],
  );

  const handlePreferenceChange = (targetId: string, checked: boolean) => {
    if (!selectedEmployee) return;
    setEditedPreferences((prev) => {
      const current = prev[selectedEmployee] ?? combinedPreferences[selectedEmployee] ?? [];
      const next = checked
        ? current.includes(targetId)
          ? current
          : [...current, targetId]
        : current.filter((id) => id !== targetId);
      return { ...prev, [selectedEmployee]: next };
    });
  };

  const handleAvoidanceChange = (targetId: string, checked: boolean) => {
    if (!selectedEmployee) return;
    setEditedAvoidances((prev) => {
      const current = prev[selectedEmployee] ?? combinedAvoidances[selectedEmployee] ?? [];
      const next = checked
        ? current.includes(targetId)
          ? current
          : [...current, targetId]
        : current.filter((id) => id !== targetId);
      return { ...prev, [selectedEmployee]: next };
    });
  };

  const saveRelationships = async () => {
    if (!selectedEmployee) return;
    setIsSaving(true);
    try {
      await updateEmployee({
        id: selectedEmployee,
        preferences: combinedPreferences[selectedEmployee] ?? [],
        avoidances: combinedAvoidances[selectedEmployee] ?? [],
      });
      toast({
        title: t("sociometry.saveSuccessTitle", { defaultValue: "Preferencias salvas" }),
        description: t("sociometry.saveSuccessDescription", {
          defaultValue: "As relacoes foram atualizadas com sucesso.",
        }),
      });
      setEditedPreferences((prev) => {
        const next = { ...prev };
        delete next[selectedEmployee];
        return next;
      });
      setEditedAvoidances((prev) => {
        const next = { ...prev };
        delete next[selectedEmployee];
        return next;
      });
    } catch (error) {
      toast({
        title: t("errors.genericTitle", { defaultValue: "Algo deu errado" }),
        description:
          error instanceof Error
            ? error.message
            : t("sociometry.saveErrorDescription", {
                defaultValue: "Nao foi possivel atualizar as relacoes.",
              }),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isError) {
    return (
      <div className="p-6" data-testid="page-sociometria-error">
        <p className="text-destructive">
          {t("sociometry.error", {
            defaultValue: "Nao foi possivel carregar os dados de sociometria.",
          })}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6" data-testid="page-sociometria-loading">
        <p className="text-muted-foreground">
          {t("sociometry.loading", { defaultValue: "Carregando colaboradores..." })}
        </p>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="p-6 space-y-4" data-testid="page-sociometria-empty">
        <h1 className="text-3xl font-bold">{t("sociometry.title")}</h1>
        <p className="text-muted-foreground">
          {t("sociometry.emptyState", {
            defaultValue: "Cadastre colaboradoras para visualizar as relacoes sociometricas.",
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-sociometria">
      <div>
        <h1 className="text-3xl font-bold">{t("sociometry.title")}</h1>
        <p className="text-muted-foreground">{t("sociometry.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("sociometry.configureCard.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employee-select">{t("sociometry.configureCard.employeeLabel")}</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder={t("sociometry.configureCard.employeePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({t(`roles.${employee.role}`)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEmployee && (
              <>
                <div>
                  <Label className="text-sm font-medium text-green-600">
                    {t("sociometry.configureCard.prefersLabel")}
                  </Label>
                  <div className="mt-2 space-y-2">
                    {selectableEmployees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`pref-${employee.id}`}
                          checked={(combinedPreferences[selectedEmployee] || []).includes(employee.id)}
                          onCheckedChange={(checked) => handlePreferenceChange(employee.id, Boolean(checked))}
                        />
                        <Label htmlFor={`pref-${employee.id}`} className="text-sm">
                          {employee.name}
                          <Badge variant="outline" className="ml-2">
                            {t(`roles.${employee.role}`)}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-red-600">
                    {t("sociometry.configureCard.avoidsLabel")}
                  </Label>
                  <div className="mt-2 space-y-2">
                    {selectableEmployees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`avoid-${employee.id}`}
                          checked={(combinedAvoidances[selectedEmployee] || []).includes(employee.id)}
                          onCheckedChange={(checked) => handleAvoidanceChange(employee.id, Boolean(checked))}
                        />
                        <Label htmlFor={`avoid-${employee.id}`} className="text-sm">
                          {employee.name}
                          <Badge variant="outline" className="ml-2">
                            {t(`roles.${employee.role}`)}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={saveRelationships}
                  className="w-full"
                  data-testid="button-save-relationships"
                  disabled={isSaving}
                >
                  {isSaving
                    ? t("sociometry.saving", { defaultValue: "Salvando..." })
                    : t("actions.saveRelationships")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <SociometryGraph
          employees={employees}
          preferences={combinedPreferences}
          avoidances={combinedAvoidances}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">{t("sociometry.strongPairs.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {strongPairs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("sociometry.strongPairs.empty", {
                  defaultValue: "Nao ha pares com preferencia mutua registrados.",
                })}
              </p>
            ) : (
              <div className="space-y-3">
                {strongPairs.map((pair, index) => (
                  <div key={`${pair.from}-${pair.to}-${index}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {pair.from}
                        <span className="mx-1">-&gt;</span>
                        {pair.to}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      {t("sociometry.strongPairs.badge")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">{t("sociometry.problemPairs.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {problemPairs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("sociometry.problemPairs.empty", {
                  defaultValue: "Nao ha conflitos registrados entre colaboradoras.",
                })}
              </p>
            ) : (
              <div className="space-y-3">
                {problemPairs.map((pair, index) => (
                  <div key={`${pair.from}-${pair.to}-${index}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {pair.from}
                        <span className="mx-1">-&gt;</span>
                        {pair.to}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-red-100 text-red-700">
                      {t("sociometry.problemPairs.conflict")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
