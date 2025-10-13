import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Trash2, Pencil } from "lucide-react";
import type { Employee, SociometryLinkStatus } from "@shared/schema";
import { employeeRoleClassMap, employeeStatusClassMap } from "@/lib/employee-styles";

interface EmployeeCardProps {
  employee: Employee;
  onDelete?: (id: string) => void;
  onEdit?: (employee: Employee) => void;
  onSendSociometry?: (employee: Employee) => void;
  sociometryStatus?: SociometryLinkStatus | null;
  className?: string;
}

function getSociometryStatusLabel(
  status: SociometryLinkStatus,
  translate: (key: string, options?: Record<string, unknown>) => string,
): string {
  switch (status) {
    case "completed":
      return translate("employees.sociometry.completed", { defaultValue: "Sociometria respondida" });
    case "pending":
      return translate("employees.sociometry.pending", { defaultValue: "Sociometria pendente" });
    case "expired":
      return translate("employees.sociometry.expired", { defaultValue: "Sociometria expirada" });
    default:
      return "";
  }
}

export default function EmployeeCard({
  employee,
  onDelete,
  onEdit,
  onSendSociometry,
  sociometryStatus,
  className,
}: EmployeeCardProps) {
  const { t } = useTranslation();
  const hasTraits = employee.traits.length > 0;

  return (
    <Card className={`hover-elevate ${className ?? ""}`} data-testid={`card-employee-${employee.id}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-muted-foreground" />
          <span data-testid={`text-employee-name-${employee.id}`}>{employee.name}</span>
        </CardTitle>
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(employee)}
              data-testid={`button-edit-employee-${employee.id}`}
            >
              <span className="sr-only">{t("employees.editModal.title")}</span>
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(employee.id)}
              className="text-destructive hover:text-destructive"
              data-testid={`button-delete-employee-${employee.id}`}
            >
              <span className="sr-only">{t("actions.delete")}</span>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge variant="outline" className={employeeRoleClassMap[employee.role]}>
            {t(`roles.${employee.role}`)}
          </Badge>
          <Badge variant="secondary" className={employeeStatusClassMap[employee.status]}>
            {t(`statuses.${employee.status}`)}
          </Badge>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {t("employees.traitsTitle")}
          </p>
          {hasTraits ? (
            <div className="flex flex-wrap gap-1">
              {employee.traits.map((trait) => (
                <Badge key={trait} variant="outline" className="text-xs">
                  {t(`traits.${trait}`)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              {t("employees.profilePending")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild data-testid={`button-evaluate-employee-${employee.id}`}>
            <Link href="/avaliacoes">{t("employees.evaluateNow")}</Link>
          </Button>
          {onSendSociometry ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendSociometry(employee)}
              data-testid={`button-send-sociometry-${employee.id}`}
            >
              {t("employees.sendSociometry", { defaultValue: "Enviar sociometria" })}
            </Button>
          ) : null}
        </div>

        {sociometryStatus ? (
          <p className="text-xs text-muted-foreground">
            {getSociometryStatusLabel(sociometryStatus, t)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
