import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { InsertEmployee } from "@shared/schema";

interface AddEmployeeModalProps {
  onAdd: (employee: InsertEmployee) => void;
  trigger?: React.ReactNode;
}

const ROLE_OPTIONS: InsertEmployee["role"][] = ["help", "drive", "support"];

export default function AddEmployeeModal({ onAdd, trigger }: AddEmployeeModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<InsertEmployee>({
    name: "",
    role: "help",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onAdd(formData);
      setFormData({ name: "", role: "help" });
      setOpen(false);
      console.log("Employee added:", formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-add-employee">
            <Plus className="w-4 h-4 mr-2" />
            {t("actions.addEmployee")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent data-testid="modal-add-employee">
        <DialogHeader>
          <DialogTitle>{t("employees.addModal.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("employees.addModal.nameLabel")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t("employees.addModal.namePlaceholder")}
              data-testid="input-employee-name"
            />
          </div>
          <div>
            <Label htmlFor="role">{t("employees.addModal.roleLabel")}</Label>
            <Select
              value={formData.role}
              onValueChange={(value: InsertEmployee["role"]) => setFormData((prev) => ({ ...prev, role: value }))}
            >
              <SelectTrigger data-testid="select-employee-role">
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
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" data-testid="button-submit-employee">
              {t("employees.addModal.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
