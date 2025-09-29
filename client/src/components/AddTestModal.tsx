import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { InsertTest, SupportedLanguage } from "@shared/schema";
import { LANGUAGE_OPTIONS } from "@/lib/constants";

interface AddTestModalProps {
  onAdd: (test: InsertTest) => void;
  trigger?: React.ReactNode;
}

export default function AddTestModal({ onAdd, trigger }: AddTestModalProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const initialLanguage = (i18n.language as SupportedLanguage) ?? "pt";
  const [formData, setFormData] = useState<InsertTest>({
    title: "",
    description: "",
    language: initialLanguage,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const title = formData.title.trim();
    const description = formData.description.trim();

    if (!title || !description) {
      return;
    }

    onAdd({
      ...formData,
      title,
      description,
    });

    setFormData({ title: "", description: "", language: initialLanguage });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      setOpen(value);
      if (!value) {
        setFormData({ title: "", description: "", language: initialLanguage });
      }
    }}>
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
            <Label htmlFor="test-title">{t("tests.addModal.nameLabel")}</Label>
            <Input
              id="test-title"
              value={formData.title}
              onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
              placeholder={t("tests.addModal.namePlaceholder")}
              data-testid="input-test-title"
            />
          </div>
          <div>
            <Label htmlFor="test-description">{t("tests.addModal.descriptionLabel")}</Label>
            <Textarea
              id="test-description"
              value={formData.description}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              placeholder={t("tests.addModal.descriptionPlaceholder")}
              rows={4}
              data-testid="textarea-test-description"
            />
          </div>
          <div>
            <Label htmlFor="test-language">{t("tests.addModal.languageLabel")}</Label>
            <Select
              value={formData.language}
              onValueChange={(value: SupportedLanguage) =>
                setFormData((prev) => ({ ...prev, language: value }))
              }
            >
              <SelectTrigger id="test-language" data-testid="select-test-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

