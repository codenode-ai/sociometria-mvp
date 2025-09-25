import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { InsertHouse } from "@shared/schema";

interface AddHouseModalProps {
  onAdd: (house: InsertHouse) => void;
  trigger?: React.ReactNode;
}

const difficultyOptions = [
  { value: "1", labelKey: "difficulty.option1" },
  { value: "2", labelKey: "difficulty.option2" },
  { value: "3", labelKey: "difficulty.option3" },
  { value: "4", labelKey: "difficulty.option4" },
  { value: "5", labelKey: "difficulty.option5" },
];

export default function AddHouseModal({ onAdd, trigger }: AddHouseModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<InsertHouse>({
    name: "",
    type: "standard",
    difficulty: 3,
    address: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onAdd(formData);
      setFormData({ name: "", type: "standard", difficulty: 3, address: "" });
      setOpen(false);
      console.log("House added:", formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t("houses.addModal.namePlaceholder")}
              data-testid="input-house-name"
            />
          </div>
          <div>
            <Label htmlFor="houseType">{t("houses.addModal.typeLabel")}</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "dynamic" | "standard" | "detailed") =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger data-testid="select-house-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">{t("houseTypes.standard")}</SelectItem>
                <SelectItem value="dynamic">{t("houseTypes.dynamic")}</SelectItem>
                <SelectItem value="detailed">{t("houseTypes.detailed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="difficulty">{t("houses.addModal.difficultyLabel")}</Label>
            <Select
              value={formData.difficulty.toString()}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  difficulty: parseInt(value, 10) as 1 | 2 | 3 | 4 | 5,
                }))
              }
            >
              <SelectTrigger data-testid="select-house-difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficultyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="address">{t("houses.addModal.addressLabel")}</Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
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
