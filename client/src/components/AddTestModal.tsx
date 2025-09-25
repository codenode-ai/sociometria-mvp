import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { InsertTest } from "@shared/schema";

interface AddTestModalProps {
  onAdd: (test: InsertTest) => void;
  trigger?: React.ReactNode;
}

export default function AddTestModal({ onAdd, trigger }: AddTestModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<InsertTest>({
    title: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formData.description.trim()) {
      onAdd(formData);
      setFormData({ title: "", description: "" });
      setOpen(false);
      console.log("Test created:", formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-add-test">
            <Plus className="w-4 h-4 mr-2" />
            {t("actions.addTest")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent data-testid="modal-add-test">
        <DialogHeader>
          <DialogTitle>{t("tests.addModal.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t("tests.addModal.nameLabel")}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder={t("tests.addModal.namePlaceholder")}
              data-testid="input-test-title"
            />
          </div>
          <div>
            <Label htmlFor="description">{t("tests.addModal.descriptionLabel")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t("tests.addModal.descriptionPlaceholder")}
              rows={4}
              data-testid="textarea-test-description"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" data-testid="button-submit-test">
              {t("actions.createTest")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
