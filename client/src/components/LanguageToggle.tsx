import { useEffect } from "react";
import { Check, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppLanguage } from "@/lib/i18n";

const LANGUAGE_STORAGE_KEY = "app-language";

const availableLanguages: { value: AppLanguage; labelKey: string }[] = [
  { value: "pt", labelKey: "language.portuguese" },
  { value: "es", labelKey: "language.spanish" },
  { value: "en", labelKey: "language.english" },
];

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();

  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as AppLanguage | null;
    if (stored && stored !== i18n.language) {
      void i18n.changeLanguage(stored);
    }
  }, [i18n]);

  const handleChange = async (value: AppLanguage) => {
    await i18n.changeLanguage(value);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
  };

  const resolved = i18n.resolvedLanguage ?? i18n.language;
  const currentLanguage = (availableLanguages.find((lang) => resolved.startsWith(lang.value))?.value ?? "pt") as AppLanguage;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-language-toggle">
          <span className="sr-only">{t("language.label")}</span>
          <Globe className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("language.label")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableLanguages.map((language) => {
          const isActive = language.value === currentLanguage;
          return (
            <DropdownMenuItem
              key={language.value}
              onClick={() => handleChange(language.value)}
              className="flex items-center justify-between"
              data-testid={`language-option-${language.value}`}
            >
              <span>{t(language.labelKey)}</span>
              {isActive && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

