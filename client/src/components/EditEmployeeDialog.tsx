import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Employee } from "@shared/schema";

interface EditEmployeeDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (update: { id: string; name: string; role: Employee["role"]; status: Employee["status"] }) => void;
}

const STATUS_OPTIONS: Employee["status"][] = ["active", "inactive", "leave"];
const ROLE_OPTIONS: Employee["role"][] = ["drive", "help", "support"];

interface FormState {
  name: string;
  role: Employee["role"];
  status: Employee["status"];
}

export default function EditEmployeeDialog({ employee, open, onOpenChange, onSave }: EditEmployeeDialogProps) {
  const { t } = useTranslation();
  const [formState, setFormState] = useState<FormState>({ name: "", role: "help", status: "active" });

  useEffect(() => {
    if (employee && open) {
      setFormState({ name: employee.name, role: employee.role, status: employee.status });
    }
  }, [employee, open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!employee) return;
    onSave({ id: employee.id, ...formState });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-edit-employee">
        <DialogHeader>
          <DialogTitle>{t("employees.editModal.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="employee-name">{t("employees.addModal.nameLabel")}</Label>
            <Input
              id="employee-name"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={t("employees.addModal.namePlaceholder")}
              data-testid="input-edit-employee-name"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee-role">{t("employees.addModal.roleLabel")}</Label>
              <Select
                value={formState.role}
                onValueChange={(value: Employee["role"]) => setFormState((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger id="employee-role" data-testid="select-edit-employee-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`roles.${role}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="employee-status">{t("employees.editModal.statusLabel")}</Label>
              <Select
                value={formState.status}
                onValueChange={(value: Employee["status"]) => setFormState((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="employee-status" data-testid="select-edit-employee-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`statuses.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" data-testid="button-edit-employee-submit">
              {t("employees.editModal.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
