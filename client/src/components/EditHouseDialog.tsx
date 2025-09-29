import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { House } from "@shared/schema";

type CleaningType = House["cleaningType"];
type HouseSize = House["size"];

interface EditHouseDialogProps {
  house: House | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (update: { id: string; name: string; cleaningType: CleaningType; size: HouseSize; address?: string }) => void;
}

const CLEANING_OPTIONS: CleaningType[] = ["quick", "standard", "meticulous"];
const SIZE_OPTIONS: HouseSize[] = ["small", "medium", "large"];

interface FormState {
  name: string;
  cleaningType: CleaningType;
  size: HouseSize;
  address: string;
}

export default function EditHouseDialog({ house, open, onOpenChange, onSave }: EditHouseDialogProps) {
  const { t } = useTranslation();
  const [formState, setFormState] = useState<FormState>({
    name: "",
    cleaningType: "standard",
    size: "medium",
    address: "",
  });

  useEffect(() => {
    if (house && open) {
      setFormState({
        name: house.name,
        cleaningType: house.cleaningType,
        size: house.size,
        address: house.address ?? "",
      });
    }
  }, [house, open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!house) return;

    onSave({
      id: house.id,
      name: formState.name,
      cleaningType: formState.cleaningType,
      size: formState.size,
      address: formState.address,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-edit-house">
        <DialogHeader>
          <DialogTitle>{t("houses.editModal.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-house-name">{t("houses.addModal.nameLabel")}</Label>
            <Input
              id="edit-house-name"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={t("houses.addModal.namePlaceholder")}
              data-testid="input-edit-house-name"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="edit-house-cleaning">{t("houses.addModal.cleaningTypeLabel")}</Label>
              <Select
                value={formState.cleaningType}
                onValueChange={(value: CleaningType) => setFormState((prev) => ({ ...prev, cleaningType: value }))}
              >
                <SelectTrigger id="edit-house-cleaning" data-testid="select-edit-house-cleaning">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLEANING_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`cleaningTypes.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-house-size">{t("houses.addModal.sizeLabel")}</Label>
              <Select
                value={formState.size}
                onValueChange={(value: HouseSize) => setFormState((prev) => ({ ...prev, size: value }))}
              >
                <SelectTrigger id="edit-house-size" data-testid="select-edit-house-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`houseSizes.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="edit-house-address">{t("houses.addModal.addressLabel")}</Label>
            <Input
              id="edit-house-address"
              value={formState.address}
              onChange={(event) => setFormState((prev) => ({ ...prev, address: event.target.value }))}
              placeholder={t("houses.addModal.addressPlaceholder")}
              data-testid="input-edit-house-address"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" data-testid="button-edit-house-submit">
              {t("houses.editModal.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
