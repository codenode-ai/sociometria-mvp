import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTests, type LikertQuestionDraft } from "@/hooks/useTests";
import { LANGUAGE_OPTIONS } from "@/lib/constants";
import { createDefaultInterpretationBands, getLikertLabels } from "@/lib/tests";
import type { PsychologicalTest, SupportedLanguage } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

const QUESTION_COUNT = 10;

const STATUS_OPTIONS: Array<{
  value: Exclude<PsychologicalTest["status"], undefined>;
  labelKey: string;
}> = [
  { value: "draft", labelKey: "tests.status.draft" },
  { value: "published", labelKey: "tests.status.published" },
  { value: "archived", labelKey: "tests.status.archived" },
];

type QuestionState = {
  id?: string;
  prompt: string;
  dimension: string;
  helpText: string;
};

type FormErrors = {
  title?: string;
  description?: string;
  estimatedDuration?: string;
  historyNote?: string;
  questions?: boolean[];
};

interface TestEditorProps {
  params?: {
    id?: string;
  };
}

function createEmptyQuestion(): QuestionState {
  return {
    prompt: "",
    dimension: "",
    helpText: "",
  };
}

function ensureQuestionArray(base: QuestionState[]): QuestionState[] {
  const next = [...base];
  if (next.length > QUESTION_COUNT) {
    return next.slice(0, QUESTION_COUNT);
  }
  while (next.length < QUESTION_COUNT) {
    next.push(createEmptyQuestion());
  }
  return next;
}

export default function TestEditor({ params }: TestEditorProps) {
  const { t, i18n } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { createTest, updateTest, getTestById, isLoading } = useTests();

  const testId = params?.id;
  const isEditMode = Boolean(testId);
  const existingTest = testId ? getTestById(testId) : undefined;

  useEffect(() => {
    if (!isEditMode) {
      return;
    }
    if (!existingTest) {
      navigate("/testes");
    }
  }, [existingTest, isEditMode, navigate]);

  const initialLanguage = (i18n.language as SupportedLanguage) ?? "pt";

  const [form, setForm] = useState(() => ({
    title: "",
    description: "",
    language: initialLanguage,
    estimatedDuration: "10",
    tags: "",
    status: "draft" as Exclude<PsychologicalTest["status"], undefined>,
    historyNote: "",
    questions: ensureQuestionArray(Array.from({ length: QUESTION_COUNT }, createEmptyQuestion)),
  }));
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isEditMode || !existingTest) {
      return;
    }

    setForm({
      title: existingTest.title,
      description: existingTest.description,
      language: existingTest.language,
      estimatedDuration: existingTest.estimatedDurationMinutes?.toString() ?? "",
      tags: existingTest.tags?.join(", ") ?? "",
      status: existingTest.status ?? "draft",
      historyNote: "",
      questions: ensureQuestionArray(
        existingTest.questions.map<QuestionState>((question) => ({
          id: question.id,
          prompt: question.prompt,
          dimension: question.dimension ?? "",
          helpText: question.helpText ?? "",
        })),
      ),
    });
    setErrors({});
  }, [existingTest, isEditMode]);

  const fixedT = useMemo(() => i18n.getFixedT(form.language), [form.language, i18n]);
  const likertLabels = useMemo(() => getLikertLabels(fixedT), [fixedT]);
  const interpretationBands = useMemo(() => createDefaultInterpretationBands(fixedT), [fixedT]);

  const handleFieldChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuestionChange = (index: number, field: keyof QuestionState, value: string) => {
    setForm((prev) => {
      const nextQuestions = prev.questions.slice();
      nextQuestions[index] = {
        ...nextQuestions[index],
        [field]: value,
      };
      return {
        ...prev,
        questions: nextQuestions,
      };
    });
  };

  const parseTags = (raw: string): string[] | undefined => {
    const cleaned = raw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    return cleaned.length > 0 ? cleaned : undefined;
  };

  const buildQuestionDrafts = (): LikertQuestionDraft[] =>
    form.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      dimension: question.dimension || undefined,
      helpText: question.helpText || undefined,
      labels: { ...likertLabels },
    }));

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = t("tests.builder.errors.title");
    }
    if (!form.description.trim()) {
      nextErrors.description = t("tests.builder.errors.description");
    }

    if (form.estimatedDuration) {
      const minutes = Number(form.estimatedDuration);
      if (Number.isNaN(minutes) || minutes <= 0) {
        nextErrors.estimatedDuration = t("tests.builder.errors.estimatedDuration");
      }
    }

    if (isEditMode && !form.historyNote.trim()) {
      nextErrors.historyNote = t("tests.builder.errors.historyNote");
    }

    const questionErrors = form.questions.map((question) => question.prompt.trim().length === 0);
    if (questionErrors.some(Boolean)) {
      nextErrors.questions = questionErrors;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast({
        variant: "destructive",
        title: t("tests.builder.errors.formTitle"),
        description: t("tests.builder.errors.formDescription"),
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      language: form.language,
      tags: parseTags(form.tags),
      availableLanguages: [form.language],
      estimatedDurationMinutes: form.estimatedDuration ? Number(form.estimatedDuration) : undefined,
      questions: buildQuestionDrafts(),
      interpretationBands,
      status: form.status,
      historyNote: form.historyNote.trim() || undefined,
    };

    if (isEditMode && existingTest) {
      await updateTest(existingTest.id, payload);
      toast({
        title: t("tests.builder.toastUpdated.title"),
        description: t("tests.builder.toastUpdated.description"),
      });
      navigate("/testes");
      return;
    }

    createTest(payload);
    toast({
      title: t("tests.builder.toastCreated.title"),
      description: t("tests.builder.toastCreated.description"),
    });
    navigate("/testes");
  };

  const pageTitle = isEditMode
    ? t("tests.builder.pageTitleEdit", { title: existingTest?.title ?? "" })
    : t("tests.builder.pageTitleCreate");
  const pageSubtitle = isEditMode
    ? t("tests.builder.pageSubtitleEdit")
    : t("tests.builder.pageSubtitleCreate");

  return (
    <form className="p-6 space-y-6" onSubmit={handleSubmit} data-testid="page-test-editor">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/testes">{t("actions.back")}</Link>
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <span>{t("navigation.tests")}</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{pageTitle}</h1>
            <p className="text-muted-foreground">{pageSubtitle}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/testes")}>
            {t("actions.cancel")}
          </Button>
          <Button type="submit" data-testid="button-save-test">
            {isEditMode ? t("tests.builder.actions.save") : t("tests.builder.actions.create")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("tests.builder.sections.metadata")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="test-title">{t("tests.builder.fields.title")}</Label>
              <Input
                id="test-title"
                value={form.title}
                onChange={(event) => handleFieldChange("title", event.target.value)}
                placeholder={t("tests.builder.placeholders.title")}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-language">{t("tests.builder.fields.language")}</Label>
              <Select
                value={form.language}
                onValueChange={(value: SupportedLanguage) => handleFieldChange("language", value)}
              >
                <SelectTrigger id="test-language">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-description">{t("tests.builder.fields.description")}</Label>
            <Textarea
              id="test-description"
              rows={5}
              value={form.description}
              onChange={(event) => handleFieldChange("description", event.target.value)}
              placeholder={t("tests.builder.placeholders.description")}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="test-duration">{t("tests.builder.fields.estimatedDuration")}</Label>
              <Input
                id="test-duration"
                type="number"
                min={1}
                value={form.estimatedDuration}
                onChange={(event) => handleFieldChange("estimatedDuration", event.target.value)}
                placeholder={t("tests.builder.placeholders.estimatedDuration")}
              />
              {errors.estimatedDuration && <p className="text-sm text-destructive">{errors.estimatedDuration}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-tags">{t("tests.builder.fields.tags")}</Label>
              <Input
                id="test-tags"
                value={form.tags}
                onChange={(event) => handleFieldChange("tags", event.target.value)}
                placeholder={t("tests.builder.placeholders.tags")}
              />
              <p className="text-xs text-muted-foreground">{t("tests.builder.helpers.tags")}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="test-status">{t("tests.builder.fields.status")}</Label>
              <Select
                value={form.status}
                onValueChange={(value: Exclude<PsychologicalTest["status"], undefined>) =>
                  handleFieldChange("status", value)
                }
              >
                <SelectTrigger id="test-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {t(status.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                {t("tests.builder.helpers.status")}
              </div>
            </div>
            {isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="test-history-note">{t("tests.builder.fields.historyNote")}</Label>
                <Input
                  id="test-history-note"
                  value={form.historyNote}
                  onChange={(event) => handleFieldChange("historyNote", event.target.value)}
                  placeholder={t("tests.builder.placeholders.historyNote")}
                />
                {errors.historyNote && <p className="text-sm text-destructive">{errors.historyNote}</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("tests.builder.sections.questions")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Badge variant="outline">Likert 1-5</Badge>
            <span>{t("tests.builder.helpers.questionsIntro")}</span>
          </p>
          <div className="grid gap-6">
            {form.questions.map((question, index) => (
              <div key={question.id ?? index} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{t("tests.builder.questionTitle", { index: index + 1 })}</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`question-${index}-prompt`}>
                    {t("tests.builder.fields.questionPrompt")}
                  </Label>
                  <Textarea
                    id={`question-${index}-prompt`}
                    rows={3}
                    value={question.prompt}
                    onChange={(event) => handleQuestionChange(index, "prompt", event.target.value)}
                    placeholder={t("tests.builder.placeholders.questionPrompt")}
                  />
                  {errors.questions?.[index] && (
                    <p className="text-sm text-destructive">
                      {t("tests.builder.errors.questionPrompt", { index: index + 1 })}
                    </p>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`question-${index}-dimension`}>
                      {t("tests.builder.fields.questionDimension")}
                    </Label>
                    <Input
                      id={`question-${index}-dimension`}
                      value={question.dimension}
                      onChange={(event) => handleQuestionChange(index, "dimension", event.target.value)}
                      placeholder={t("tests.builder.placeholders.questionDimension")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`question-${index}-help`}>
                      {t("tests.builder.fields.questionHelp")}
                    </Label>
                    <Input
                      id={`question-${index}-help`}
                      value={question.helpText}
                      onChange={(event) => handleQuestionChange(index, "helpText", event.target.value)}
                      placeholder={t("tests.builder.placeholders.questionHelp")}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}


