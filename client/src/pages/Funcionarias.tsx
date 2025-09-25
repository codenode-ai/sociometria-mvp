import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, LayoutGrid, List as ListIcon, Pencil, Trash2 } from "lucide-react";
import EmployeeCard from "@/components/EmployeeCard";
import AddEmployeeModal from "@/components/AddEmployeeModal";
import EditEmployeeDialog from "@/components/EditEmployeeDialog";
import { employeeRoleClassMap, employeeStatusClassMap } from "@/lib/employee-styles";
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

const normalizeText = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

type ViewMode = "cards" | "list";

export default function Funcionarias() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState<Employee[]>(employeesData);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim();
    if (!term) {
      return employees;
    }

    const normalizedTerm = normalizeText(term);
    return employees.filter((emp) => normalizeText(emp.name).includes(normalizedTerm));
  }, [employees, searchTerm]);

  const handleAddEmployee = (newEmployee: InsertEmployee) => {
    const employee: Employee = {
      id: Date.now().toString(),
      ...newEmployee,
      status: "active",
      traits: [],
    };
    setEmployees((prev) => [employee, ...prev]);
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  };

  const handleEditRequest = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditOpen(true);
  };

  const handleEditSave = (update: { id: string; name: string; role: Employee["role"]; status: Employee["status"] }) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === update.id
          ? {
              ...emp,
              name: update.name.trim(),
              role: update.role,
              status: update.status,
            }
          : emp,
      ),
    );
    setIsEditOpen(false);
    setEditingEmployee(null);
  };

  const handleEditOpenChange = (open: boolean) => {
    setIsEditOpen(open);
    if (!open) {
      setEditingEmployee(null);
    }
  };

  const handleViewModeChange = (mode: ViewMode | "") => {
    if (!mode) {
      return;
    }
    setViewMode(mode);
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

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder={t("employees.searchPlaceholder")}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
              data-testid="input-search-employees"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {t("employees.counter", { filtered: filteredEmployees.length, total: employees.length })}
          </div>
        </div>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={handleViewModeChange}
          variant="outline"
          size="sm"
          aria-label={t("employees.viewModes.aria")}
        >
          <ToggleGroupItem
            value="cards"
            aria-label={t("employees.viewModes.cards")}
            data-testid="toggle-view-cards"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">{t("employees.viewModes.cards")}</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            aria-label={t("employees.viewModes.list")}
            data-testid="toggle-view-list"
          >
            <ListIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t("employees.viewModes.list")}</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onDelete={handleDeleteEmployee}
              onEdit={handleEditRequest}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("employees.list.headers.name")}</TableHead>
                <TableHead>{t("employees.list.headers.role")}</TableHead>
                <TableHead>{t("employees.list.headers.status")}</TableHead>
                <TableHead>{t("employees.list.headers.traits")}</TableHead>
                <TableHead className="text-right">{t("employees.list.headers.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => {
                const hasTraits = employee.traits.length > 0;

                return (
                  <TableRow key={employee.id} data-testid={`row-employee-${employee.id}`}>
                    <TableCell>
                      <div className="font-semibold">{employee.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={employeeRoleClassMap[employee.role]}>
                        {t(`roles.${employee.role}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={employeeStatusClassMap[employee.status]}>
                        {t(`statuses.${employee.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {hasTraits ? (
                        <div className="flex flex-wrap gap-1">
                          {employee.traits.map((trait) => (
                            <Badge key={trait} variant="outline" className="text-xs">
                              {t(`traits.${trait}`)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm italic text-muted-foreground">
                            {t("employees.profilePending")}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            data-testid={`button-evaluate-employee-${employee.id}`}
                          >
                            <Link href="/testes">{t("employees.evaluateNow")}</Link>
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditRequest(employee)}
                          data-testid={`button-edit-employee-${employee.id}`}
                        >
                          <span className="sr-only">{t("employees.editModal.title")}</span>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteEmployee(employee.id)}
                          data-testid={`button-delete-employee-${employee.id}`}
                        >
                          <span className="sr-only">{t("actions.delete")}</span>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {filteredEmployees.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">{t("employees.empty")}</p>
        </div>
      )}

      <EditEmployeeDialog
        employee={editingEmployee}
        open={isEditOpen}
        onOpenChange={handleEditOpenChange}
        onSave={handleEditSave}
      />
    </div>
  );
}

