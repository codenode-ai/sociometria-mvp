import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import EmployeeCard from "@/components/EmployeeCard";
import AddEmployeeModal from "@/components/AddEmployeeModal";
import type { Employee, InsertEmployee } from "@shared/schema";

const employeesData: Employee[] = [
  {
    id: "1",
    name: "Ana Silva",
    role: "drive",
    status: "active",
    traits: ["organized", "leadership", "communicative", "proactive"],
    preferences: ["2", "4"],
    avoidances: ["3"],
  },
  {
    id: "2",
    name: "Maria Santos",
    role: "help",
    status: "active",
    traits: ["detailOriented", "collaborative", "patient", "trustworthy"],
  },
  {
    id: "3",
    name: "Carla Oliveira",
    role: "drive",
    status: "leave",
    traits: ["energetic", "creative", "flexible"],
  },
  {
    id: "4",
    name: "Júlia Costa",
    role: "help",
    status: "active",
    traits: ["meticulous", "responsible", "analytical"],
  },
  {
    id: "5",
    name: "Patricia Lima",
    role: "help",
    status: "inactive",
    traits: ["systematic", "punctual", "discreet"],
  },
  {
    id: "6",
    name: "Lívia Rocha",
    role: "support",
    status: "active",
    traits: ["trustworthy", "patient", "collaborative"],
  },
];

export default function Funcionarias() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState<Employee[]>(employeesData);

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return employees;
    }

    return employees.filter((emp) => {
      const nameMatch = emp.name.toLowerCase().includes(term);
      const roleMatch = t(`roles.${emp.role}`).toLowerCase().includes(term);
      const statusMatch = t(`statuses.${emp.status}`).toLowerCase().includes(term);
      const traitMatch = emp.traits.some((trait) => t(`traits.${trait}`).toLowerCase().includes(term));
      return nameMatch || roleMatch || statusMatch || traitMatch;
    });
  }, [employees, searchTerm, t]);

  const handleAddEmployee = (newEmployee: InsertEmployee) => {
    const defaultTraits: string[] = (() => {
      switch (newEmployee.role) {
        case "drive":
          return ["leadership", "communicative"];
        case "support":
          return ["trustworthy", "collaborative"];
        default:
          return ["collaborative", "trustworthy"];
      }
    })();

    const employee: Employee = {
      id: Date.now().toString(),
      ...newEmployee,
      status: "active",
      traits: defaultTraits,
    };
    setEmployees((prev) => [...prev, employee]);
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    console.log("Employee deleted:", id);
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-funcionarias">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("employees.title")}</h1>
          <p className="text-muted-foreground">{t("employees.subtitle")}</p>
        </div>
        <AddEmployeeModal onAdd={handleAddEmployee} />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t("employees.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-employees"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {t("employees.counter", { filtered: filteredEmployees.length, total: employees.length })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <EmployeeCard key={employee.id} employee={employee} onDelete={handleDeleteEmployee} />
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("employees.empty")}</p>
        </div>
      )}
    </div>
  );
}
