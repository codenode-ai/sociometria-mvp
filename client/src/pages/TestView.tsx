import { Link, useLocation, useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTests } from "@/hooks/useTests";
import type { PsychologicalTest } from "@shared/schema";

export default function TestView() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ id: string }>("/testes/:id");
  const { getTestById } = useTests();

  const test = match && params.id ? getTestById(params.id) : undefined;

  if (!test) {
    return (
      <div className="p-6 space-y-4" data-testid="page-test-view">
        <Card>
          <CardHeader>
            <CardTitle>{t("tests.view.notFoundTitle", { defaultValue: "Instrumento nao encontrado" })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("tests.view.notFoundDescription", { defaultValue: "Nao encontramos o instrumento solicitado. Retorne a lista e tente novamente." })}</p>
            <Button variant="outline" onClick={() => navigate("/testes")}>{t("actions.back")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typedTest = test as PsychologicalTest & { labels?: Record<string, string> };

  return (
    <div className="p-6 space-y-6" data-testid="page-test-view">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{typedTest.title}</h1>
          <p className="text-muted-foreground">{typedTest.description}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/testes">{t("actions.back")}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("tests.view.metaTitle", { defaultValue: "Metadados" })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <span className="font-medium">{t("tests.card.updatedAt", { date: new Intl.DateTimeFormat().format(typedTest.updatedAt ?? typedTest.createdAt) })}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t(`tests.languages.${typedTest.language}`, { defaultValue: typedTest.language.toUpperCase() })}</Badge>
            <Badge variant="outline">v{typedTest.version}</Badge>
            {typedTest.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("tests.view.questionsTitle", { defaultValue: "Questoes" })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {typedTest.questions.map((question, index) => {
            const labels = (question as { labels?: Record<string, string> }).labels;
            return (
              <div key={question.id} className="space-y-3">
                <div>
                  <h2 className="font-semibold">{t("tests.view.questionLabel", { index: index + 1, defaultValue: `Questao ${index + 1}` })}</h2>
                  <p className="text-sm text-muted-foreground">{question.prompt}</p>
                  {question.dimension ? (
                    <p className="text-xs text-muted-foreground">{t("tests.builder.fields.questionDimension")}: {question.dimension}</p>
                  ) : null}
                  {question.helpText ? (
                    <p className="text-xs text-muted-foreground">{t("tests.builder.fields.questionHelp")}: {question.helpText}</p>
                  ) : null}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Array.isArray((question as { options?: { id: string; label: string; weight: number }[] }).options) ? (
                    (question as { options: { id: string; label: string; weight: number }[] }).options.map((option) => (
                      <div key={option.id} className="rounded border p-3 text-sm">
                        <p className="font-medium">{t("tests.view.weightLabel", { weight: option.weight, defaultValue: `Peso ${option.weight}` })}</p>
                        <p className="text-muted-foreground">{option.label}</p>
                      </div>
                    ))
                  ) : labels ? (
                    Object.entries(labels).map(([weight, label]) => (
                      <div key={weight} className="rounded border p-3 text-sm">
                        <p className="font-medium">{t("tests.view.weightLabel", { weight, defaultValue: `Peso ${weight}` })}</p>
                        <p className="text-muted-foreground">{label}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("tests.view.noOptions", { defaultValue: "Sem alternativas cadastradas." })}</p>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
