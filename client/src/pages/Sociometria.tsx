import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import SociometryGraph from "@/components/SociometryGraph";
import { Employee } from "@shared/schema";

const employeesData: Employee[] = [
  { id: "1", name: "Ana Silva", role: "drive", status: "active", traits: ["organized", "leadership"] },
  { id: "2", name: "Maria Santos", role: "help", status: "active", traits: ["detailOriented", "collaborative"] },
  { id: "3", name: "Carla Oliveira", role: "drive", status: "active", traits: ["proactive", "communicative"] },
  { id: "4", name: "Júlia Costa", role: "help", status: "active", traits: ["patient", "meticulous"] },
  { id: "5", name: "Patricia Lima", role: "help", status: "active", traits: ["systematic", "punctual"] },
];

const basePreferences: Record<string, string[]> = {
  "1": ["2", "4"],
  "2": ["1", "5"],
  "3": ["4", "5"],
  "4": ["1", "2"],
  "5": ["2", "3"],
};

const baseAvoidances: Record<string, string[]> = {
  "1": ["3"],
  "3": ["1"],
  "5": ["1"],
};

const strongPairs = [
  { from: "Ana Silva", to: "Maria Santos", strengthKey: "sociometry.strongPairs.badge" },
  { from: "Carla Oliveira", to: "Júlia Costa", strengthKey: "sociometry.strongPairs.badge" },
];

const problemPairs = [
  { from: "Ana Silva", to: "Carla Oliveira", issueKey: "sociometry.problemPairs.conflict" },
];

export default function Sociometria() {
  const { t } = useTranslation();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [preferences, setPreferences] = useState<Record<string, string[]>>({});
  const [avoidances, setAvoidances] = useState<Record<string, string[]>>({});

  const combinedPreferences = useMemo(
    () => ({ ...basePreferences, ...preferences }),
    [preferences],
  );

  const combinedAvoidances = useMemo(
    () => ({ ...baseAvoidances, ...avoidances }),
    [avoidances],
  );

  const handlePreferenceChange = (targetId: string, checked: boolean) => {
    if (!selectedEmployee) return;

    setPreferences((prev) => {
      const current = prev[selectedEmployee] || [];
      if (checked) {
        return { ...prev, [selectedEmployee]: [...current, targetId] };
      }
      return { ...prev, [selectedEmployee]: current.filter((id) => id !== targetId) };
    });
  };

  const handleAvoidanceChange = (targetId: string, checked: boolean) => {
    if (!selectedEmployee) return;

    setAvoidances((prev) => {
      const current = prev[selectedEmployee] || [];
      if (checked) {
        return { ...prev, [selectedEmployee]: [...current, targetId] };
      }
      return { ...prev, [selectedEmployee]: current.filter((id) => id !== targetId) };
    });
  };

  const saveRelationships = () => {
    console.log("Saving relationships for employee:", selectedEmployee);
    console.log("Preferences:", combinedPreferences[selectedEmployee] || []);
    console.log("Avoidances:", combinedAvoidances[selectedEmployee] || []);
  };

  const selectableEmployees = employeesData.filter((emp) => emp.id !== selectedEmployee);

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
                  {employeesData.map((employee) => (
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
                          onCheckedChange={(checked) =>
                            handlePreferenceChange(employee.id, Boolean(checked))
                          }
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
                          onCheckedChange={(checked) =>
                            handleAvoidanceChange(employee.id, Boolean(checked))
                          }
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

                <Button onClick={saveRelationships} className="w-full" data-testid="button-save-relationships">
                  {t("actions.saveRelationships")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <SociometryGraph employees={employeesData} preferences={combinedPreferences} avoidances={combinedAvoidances} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">{t("sociometry.strongPairs.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strongPairs.map((pair, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">{pair.from}<span className="mx-1">-&gt;</span>{pair.to}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    {t(pair.strengthKey)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">{t("sociometry.problemPairs.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {problemPairs.map((pair, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">{pair.from}<span className="mx-1">-&gt;</span>{pair.to}</p>
                    <p className="text-sm text-muted-foreground">{t(pair.issueKey)}</p>
                  </div>
                  <Badge variant="outline" className="bg-red-100 text-red-700">
                    {t("sociometry.problemPairs.badge")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


