import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Edit, Trash2 } from "lucide-react";
import { PsychologicalTest } from "@shared/schema";

interface TestCardProps {
  test: PsychologicalTest;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const localeMap: Record<string, string> = {
  pt: "pt-BR",
  es: "es-ES",
  en: "en-US",
};

export default function TestCard({ test, onEdit, onDelete, className }: TestCardProps) {
  const { t, i18n } = useTranslation();

  const formattedDate = useMemo(() => {
    const locale = localeMap[i18n.language] ?? "en-US";
    return test.createdAt.toLocaleDateString(locale);
  }, [i18n.language, test.createdAt]);

  const questionLabel = test.questions.length === 1
    ? t("tests.questionsCount_one", { count: test.questions.length })
    : t("tests.questionsCount_other", { count: test.questions.length });

  const languageLabel = t(`tests.languages.${test.language}`, { defaultValue: test.language.toUpperCase() });

  return (
    <Card className={`hover-elevate ${className ?? ""}`} data-testid={`card-test-${test.id}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-start justify-between gap-4 w-full">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span data-testid={`text-test-title-${test.id}`}>{test.title}</span>
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary">{languageLabel}</Badge>
            <Badge variant="outline">v{test.version}</Badge>
          </div>
        </div>
        <div className="flex gap-1 self-start">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(test.id)}
              data-testid={`button-edit-test-${test.id}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(test.id)}
              className="text-destructive hover:text-destructive"
              data-testid={`button-delete-test-${test.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground" data-testid={`text-test-description-${test.id}`}>
          {test.description}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">{questionLabel}</span>
          <div className="flex items-center gap-3 text-muted-foreground">
            {test.estimatedDurationMinutes && (
              <span>{t("tests.estimatedDuration", { minutes: test.estimatedDurationMinutes })}</span>
            )}
            <span>{t("tests.createdAt")} {formattedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
