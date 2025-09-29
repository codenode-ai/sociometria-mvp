import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { InsertHouse } from "@shared/schema";

type CleaningType = InsertHouse["cleaningType"];
type HouseSize = InsertHouse["size"];

interface AddHouseModalProps {
  onAdd: (house: InsertHouse) => void;
  trigger?: React.ReactNode;
}

const CLEANING_OPTIONS: CleaningType[] = ["quick", "standard", "meticulous"];
const SIZE_OPTIONS: HouseSize[] = ["small", "medium", "large"];

export default function AddHouseModal({ onAdd, trigger }: AddHouseModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<InsertHouse>({
    name: "",
    cleaningType: "standard",
    size: "medium",
    address: "",
  });

  const resetForm = () =>
    setFormData({
      name: "",
      cleaningType: "standard",
      size: "medium",
      address: "",
    });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = formData.name.trim();
    if (!name) {
      return;
    }

    onAdd({
      ...formData,
      name,
      address: formData.address?.trim() ? formData.address.trim() : undefined,
    });
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      setOpen(value);
      if (!value) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-add-house">
            <Plus className="w-4 h-4 mr-2" />
            {t("actions.addHouse")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent data-testid="modal-add-house">
        <DialogHeader>
          <DialogTitle>{t("houses.addModal.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="houseName">{t("houses.addModal.nameLabel")}</Label>
            <Input
              id="houseName"
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={t("houses.addModal.namePlaceholder")}
              data-testid="input-house-name"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="houseCleaning">{t("houses.addModal.cleaningTypeLabel")}</Label>
              <Select
                value={formData.cleaningType}
                onValueChange={(value: CleaningType) =>
                  setFormData((prev) => ({ ...prev, cleaningType: value }))
                }
              >
                <SelectTrigger id="houseCleaning" data-testid="select-house-cleaning">
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
              <Label htmlFor="houseSize">{t("houses.addModal.sizeLabel")}</Label>
              <Select
                value={formData.size}
                onValueChange={(value: HouseSize) =>
                  setFormData((prev) => ({ ...prev, size: value }))
                }
              >
                <SelectTrigger id="houseSize" data-testid="select-house-size">
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
            <Label htmlFor="address">{t("houses.addModal.addressLabel")}</Label>
            <Input
              id="address"
              value={formData.address ?? ""}
              onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))}
              placeholder={t("houses.addModal.addressPlaceholder")}
              data-testid="input-house-address"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" data-testid="button-submit-house">
              {t("houses.addModal.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
