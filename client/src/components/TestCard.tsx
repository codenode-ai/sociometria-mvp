import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, Clock, FileText, ListChecks, PencilLine, Tags as TagsIcon, Trash2 } from "lucide-react";
import type { PsychologicalTest } from "@shared/schema";

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

const statusVariantMap: Record<Exclude<PsychologicalTest["status"], undefined>, "default" | "secondary" | "outline"> = {
  draft: "outline",
  published: "secondary",
  archived: "default",
};

export default function TestCard({ test, onEdit, onDelete, className }: TestCardProps) {
  const { t, i18n } = useTranslation();

  const formattedDate = useMemo(() => {
    const locale = localeMap[i18n.language] ?? "en-US";
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(test.updatedAt ?? test.createdAt);
  }, [i18n.language, test.updatedAt, test.createdAt]);

  const questionLabel = test.questions.length === 1
    ? t("tests.questionsCount_one", { count: test.questions.length })
    : t("tests.questionsCount_other", { count: test.questions.length });

  const languageLabel = t(`tests.languages.${test.language}`, { defaultValue: test.language.toUpperCase() });
  const statusLabel = test.status ? t(`tests.status.${test.status}`) : null;
  const statusVariant = test.status ? statusVariantMap[test.status] ?? "outline" : "outline";
  const displayTags = test.tags?.slice(0, 3) ?? [];
  const remainingTags = test.tags && test.tags.length > 3 ? test.tags.length - 3 : 0;

  return (
    <Card className={`hover-elevate flex h-full flex-col ${className ?? ""}`} data-testid={`card-test-${test.id}`}>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span data-testid={`text-test-title-${test.id}`}>{test.title}</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-test-description-${test.id}`}>
              {test.description}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {statusLabel && (
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            )}
            <Badge variant="secondary">{languageLabel}</Badge>
            <Badge variant="outline">v{test.version}</Badge>
          </div>
        </div>
        {displayTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <TagsIcon className="w-3 h-3" />
            {displayTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {remainingTags > 0 && <span>+{remainingTags}</span>}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            {questionLabel}
          </span>
          {typeof test.estimatedDurationMinutes === "number" && (
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t("tests.card.estimatedDuration", { minutes: test.estimatedDurationMinutes })}
            </span>
          )}
          <span className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            {t("tests.card.updatedAt", { date: formattedDate })}
          </span>
        </div>
      </CardContent>
      {(onEdit || onDelete) && (
        <CardFooter className="mt-auto flex items-center justify-between gap-3">
          {onEdit ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(test.id)}
              data-testid={`button-edit-test-${test.id}`}
            >
              <PencilLine className="w-4 h-4 mr-2" />
              {t("tests.card.actions.edit")}
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(test.id)}
              data-testid={`button-delete-test-${test.id}`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("tests.card.actions.delete")}
            </Button>
          ) : null}
        </CardFooter>
      )}
    </Card>
  );
}

