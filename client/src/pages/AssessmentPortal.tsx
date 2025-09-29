import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import type { AssessmentAssignment } from "@shared/schema";
import type { PortalTest } from "@/hooks/useAssessmentPortal";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Languages,
  ListChecks,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { cn } from "@/lib/utils";
import { useAssessmentPortal } from "@/hooks/useAssessmentPortal";

function formatTimer(ms: number | null): string {
  if (ms === null || Number.isNaN(ms)) {
    return "--:--";
  }
  const clamped = Math.max(0, ms);
  const minutes = Math.floor(clamped / 60000);
  const seconds = Math.floor((clamped % 60000) / 1000);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function getAssigneeName(metadata: AssessmentAssignment["metadata"] | undefined): string | undefined {
  if (!metadata) {
    return undefined;
  }
  const raw = (metadata as Record<string, unknown>).assigneeName;
  return typeof raw === "string" && raw.trim().length > 0 ? raw : undefined;
}


const DEFAULT_DURATION_MINUTES = 30;

export default function AssessmentPortal() {
  const [match, params] = useRoute<{ code: string }>("/avaliacoes/:code");
  const code = match ? params.code : undefined;
  const { t, i18n } = useTranslation();
  const { assessment, assignment, link, session, status, tests } = useAssessmentPortal(code);

  const participantName = getAssigneeName(assignment?.metadata) ?? t("assessmentPortal.participant.defaultName");
  const instructions = t("assessmentPortal.overview.instructions", { returnObjects: true }) as string[];

  const formatDateTime = useMemo(
    () => new Intl.DateTimeFormat(i18n.language ?? "pt", { dateStyle: "medium", timeStyle: "short" }),
    [i18n.language],
  );

  const dataReady = status === "ready" && assessment && tests.length > 0;

  const [mode, setMode] = useState<"landing" | "active" | "completed">("landing");
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, Record<string, number | null>>>({});
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);

  const totalQuestions = useMemo(() => {
    if (!dataReady) {
      return 0;
    }
    return tests.reduce((total, item) => total + item.test.questions.length, 0);
  }, [dataReady, tests]);

  const totalAnswered = useMemo(() => {
    if (!dataReady) {
      return 0;
    }
    return tests.reduce((total, item) => {
      const perQuestion = answers[item.test.id] ?? {};
      const answered = item.test.questions.filter((question) => perQuestion[question.id] != null).length;
      return total + answered;
    }, 0);
  }, [answers, dataReady, tests]);

  useEffect(() => {
    if (!dataReady) {
      return;
    }

    const initialAnswers: Record<string, Record<string, number | null>> = {};
    tests.forEach(({ test }) => {
      const seed: Record<string, number | null> = {};
      test.questions.forEach((question) => {
        const existing = session?.responses
          .find((response) => response.testId === test.id)
          ?.responses.find((response) => response.questionId === question.id)?.value;
        seed[question.id] = typeof existing === "number" ? existing : null;
      });
      initialAnswers[test.id] = seed;
    });

    setAnswers(initialAnswers);

    const firstIncompleteIndex = tests.findIndex(({ test }) =>
      test.questions.some((question) => initialAnswers[test.id]?.[question.id] == null),
    );
    const fallbackIndex = firstIncompleteIndex === -1 ? Math.max(tests.length - 1, 0) : firstIncompleteIndex;
    setCurrentTestIndex(fallbackIndex);

    const fallbackQuestionIndex = (() => {
      const referenceTest = tests[fallbackIndex];
      if (!referenceTest) {
        return 0;
      }
      const answerMap = initialAnswers[referenceTest.test.id];
      const idx = referenceTest.test.questions.findIndex((question) => answerMap?.[question.id] == null);
      return idx === -1 ? 0 : idx;
    })();
    setCurrentQuestionIndex(fallbackQuestionIndex);

    const fallbackMinutes =
      (assessment.metadata?.estimatedDurationMinutes ??
        tests.reduce((minutes, item) => minutes + (item.test.estimatedDurationMinutes ?? 0), 0)) ||
      DEFAULT_DURATION_MINUTES;
    const initialTimer =
      assignment?.progress?.remainingTimeMs ?? session?.timerMs ?? fallbackMinutes * 60 * 1000;
    setTimeLeft(initialTimer);

    const completed = tests.every(({ test }) =>
      test.questions.every((question) => initialAnswers[test.id]?.[question.id] != null),
    );
    setMode(completed ? "completed" : "landing");
    setIsPaused(false);
    setIsSaving(false);
    setLastSavedAt(session?.lastSavedAt ?? assignment?.lastActivityAt ?? null);
  }, [assignment?.lastActivityAt, assessment, dataReady, session, tests]);

  useEffect(() => {
    if (mode !== "active" || isPaused || timeLeft === null || timeLeft <= 0) {
      return;
    }
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isPaused, mode, timeLeft]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 0 && mode === "active") {
      setMode("completed");
      setIsPaused(false);
    }
  }, [mode, timeLeft]);

  useEffect(() => () => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  if (!match) {
    return null;
  }

  if (status === "idle") {
    return (
      <PortalLayout participantName={participantName} linkLanguageLabel={link ? t(`tests.languages.${link.language}`, { defaultValue: link.language.toUpperCase() }) : undefined}>
        <LandingCard>
          <div className="flex flex-col items-center gap-4 text-center">
            <Activity className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("assessmentPortal.loading")}</p>
          </div>
        </LandingCard>
      </PortalLayout>
    );
  }

  if (status === "not_found" || status === "missing" || !assessment) {
    return (
      <PortalLayout participantName={participantName} linkLanguageLabel={undefined}>
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {t("assessmentPortal.notFound.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("assessmentPortal.notFound.description")}</p>
            <Button variant="secondary" asChild>
              <a href="/">{t("assessmentPortal.notFound.goBack")}</a>
            </Button>
          </CardContent>
        </Card>
      </PortalLayout>
    );
  }

  const currentTest = tests[currentTestIndex];
  const currentQuestion = currentTest?.test.questions[currentQuestionIndex];
  const currentAnswers = currentTest ? answers[currentTest.test.id] ?? {} : {};
  const currentAnswer = currentQuestion ? currentAnswers[currentQuestion.id] ?? null : null;

  const progressPercent = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;
  const allAnswered = totalQuestions > 0 && totalAnswered === totalQuestions;

  const handleStart = () => {
    setMode("active");
    setIsPaused(false);
  };

  const handleTogglePause = () => {
    setIsPaused((previous) => !previous);
  };

  const scheduleAutosave = () => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    setIsSaving(true);
    saveTimeoutRef.current = window.setTimeout(() => {
      setIsSaving(false);
      setLastSavedAt(new Date());
    }, 600);
  };

  const handleAnswerChange = (value: string) => {
    if (!currentTest || !currentQuestion) {
      return;
    }
    const numericValue = Number(value);
    setAnswers((previous) => ({
      ...previous,
      [currentTest.test.id]: {
        ...(previous[currentTest.test.id] ?? {}),
        [currentQuestion.id]: Number.isFinite(numericValue) ? numericValue : null,
      },
    }));
    scheduleAutosave();
  };

  const goToQuestion = (nextTestIndex: number, nextQuestionIndex: number) => {
    setCurrentTestIndex(nextTestIndex);
    setCurrentQuestionIndex(nextQuestionIndex);
  };

  const goToNextQuestion = () => {
    if (!currentTest) {
      return;
    }
    if (currentQuestionIndex < currentTest.test.questions.length - 1) {
      goToQuestion(currentTestIndex, currentQuestionIndex + 1);
      return;
    }
    if (currentTestIndex < tests.length - 1) {
      const nextIndex = currentTestIndex + 1;
      const nextTest = tests[nextIndex];
      if (nextTest) {
        const nextAnswers = answers[nextTest.test.id] ?? {};
        const unansweredIndex = nextTest.test.questions.findIndex((question) => nextAnswers[question.id] == null);
        goToQuestion(nextIndex, unansweredIndex === -1 ? 0 : unansweredIndex);
      }
      return;
    }
    if (allAnswered) {
      setMode("completed");
      setIsPaused(false);
      setTimeLeft((previous) => (previous === null ? null : Math.max(0, previous)));
    }
  };

  const goToPreviousQuestion = () => {
    if (!currentTest) {
      return;
    }
    if (currentQuestionIndex > 0) {
      goToQuestion(currentTestIndex, currentQuestionIndex - 1);
      return;
    }
    if (currentTestIndex > 0) {
      const prevIndex = currentTestIndex - 1;
      const prevTest = tests[prevIndex];
      goToQuestion(prevIndex, Math.max(prevTest.test.questions.length - 1, 0));
    }
  };

  const handleFinish = () => {
    if (!allAnswered) {
      return;
    }
    setMode("completed");
    setIsPaused(false);
    setTimeLeft((previous) => (previous === null ? null : Math.max(0, previous)));
  };

  return (
    <PortalLayout
      participantName={participantName}
      linkLanguageLabel={link ? t("assessmentPortal.languageBadge", {
        language: t(`tests.languages.${link.language}`, {
          defaultValue: link.language.toUpperCase(),
        }),
      }) : undefined}
    >
      {mode === "landing" ? (
        <LandingCard>
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("assessmentPortal.overview.subtitle", { name: participantName })}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">{assessment.name}</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="gap-1">
                  <ListChecks className="h-3.5 w-3.5" />
                  {t("assessmentPortal.overview.testsLabel", { count: tests.length })}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {t("assessmentPortal.overview.durationLabel", {
                    minutes:
                      (assessment.metadata?.estimatedDurationMinutes ??
                        tests.reduce((minutes, item) => minutes + (item.test.estimatedDurationMinutes ?? 0), 0)) ||
                      DEFAULT_DURATION_MINUTES,
                  })}
                </Badge>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {instructions.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={handleStart}>
                {totalAnswered > 0
                  ? t("assessmentPortal.overview.resumeButton")
                  : t("assessmentPortal.overview.startButton")}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t("assessmentPortal.overview.autosaveHint")}
              </p>
            </div>
          </div>
        </LandingCard>
      ) : null}

      {mode === "active" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {t("assessmentPortal.timer.label")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className={cn("text-3xl font-semibold", isPaused && "text-muted-foreground")}>{formatTimer(timeLeft)}</span>
                <Button variant="ghost" size="sm" onClick={handleTogglePause}>
                  {isPaused ? (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      {t("assessmentPortal.timer.resume")}
                    </>
                  ) : (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      {t("assessmentPortal.timer.pause")}
                    </>
                  )}
                </Button>
              </CardContent>
              {isPaused ? (
                <CardFooter>
                  <p className="text-xs text-muted-foreground">
                    {t("assessmentPortal.timer.pausedHint")}
                  </p>
                </CardFooter>
              ) : null}
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  {t("assessmentPortal.progress.label")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("assessmentPortal.progress.counter", {
                      answered: totalAnswered,
                      total: totalQuestions,
                    })}
                  </span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} />
                <p className="text-xs text-muted-foreground">
                  {isSaving
                    ? t("assessmentPortal.progress.saving")
                    : lastSavedAt
                        ? t("assessmentPortal.progress.savedAt", { time: formatDateTime.format(lastSavedAt) })
                        : t("assessmentPortal.progress.autosave")}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    {t("assessmentPortal.testsList.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tests.map(({ test }, index) => {
                    const answersForTest = answers[test.id] ?? {};
                    const answeredQuestions = test.questions.filter((question) => answersForTest[question.id] != null).length;
                    const completed = answeredQuestions === test.questions.length;
                    const isCurrent = index === currentTestIndex;
                    const statusLabel = completed
                      ? t("assessmentPortal.testsList.completed")
                      : isCurrent
                        ? t("assessmentPortal.testsList.inProgress")
                        : answeredQuestions > 0
                          ? t("assessmentPortal.testsList.partial")
                          : t("assessmentPortal.testsList.pending");

                    return (
                      <button
                        key={test.id}
                        type="button"
                        onClick={() => goToQuestion(index, 0)}
                        className={cn(
                          "w-full rounded-md border px-3 py-2 text-left transition",
                          isCurrent ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium leading-tight">{test.title}</p>
                            <p className="text-xs text-muted-foreground">{statusLabel}</p>
                          </div>
                          <Badge variant={completed ? "default" : "outline"} className="gap-1 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {answeredQuestions}/{test.questions.length}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </aside>

            <section>
              <Card>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg font-semibold">
                    {currentTest?.test.title ?? ""}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {t("assessmentPortal.questions.counter", {
                        current:
                          totalQuestions === 0
                            ? 0
                            : currentTest
                                ? testOffset(tests, currentTestIndex, currentQuestionIndex) + 1
                                : 0,
                        total: totalQuestions,
                      })}
                    </span>
                    {currentTest ? (
                      <Badge variant="outline" className="gap-1">
                        <Languages className="h-3.5 w-3.5" />
                        {t(`tests.languages.${currentTest.test.language}`, {
                          defaultValue: currentTest.test.language.toUpperCase(),
                        })}
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-base font-medium leading-snug text-foreground">
                      {currentQuestion?.prompt ?? ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("assessmentPortal.questions.hint")}
                    </p>
                  </div>
                  {currentQuestion ? (
                    <RadioGroup
                      value={currentAnswer != null ? String(currentAnswer) : ""}
                      onValueChange={handleAnswerChange}
                      className="grid gap-3 sm:grid-cols-5"
                    >
                      {Object.entries(currentQuestion.scaleLabels)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([value, label]) => (
                          <Label
                            key={value}
                            htmlFor={`${currentQuestion.id}-${value}`}
                            className={cn(
                              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border p-4 text-center transition",
                              currentAnswer === Number(value)
                                ? "border-primary bg-primary/10"
                                : "border-border hover:bg-muted",
                            )}
                          >
                            <RadioGroupItem value={value} id={`${currentQuestion.id}-${value}`} className="sr-only" />
                            <span className="text-2xl font-semibold text-primary">{value}</span>
                            <span className="text-sm text-muted-foreground">{label}</span>
                          </Label>
                        ))}
                    </RadioGroup>
                  ) : null}
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                  <Button variant="outline" onClick={goToPreviousQuestion} disabled={currentTestIndex === 0 && currentQuestionIndex === 0}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t("assessmentPortal.questions.previous")}
                  </Button>
                  <div className="flex items-center gap-2">
                    {currentTestIndex < tests.length - 1 && currentQuestionIndex === currentTest.test.questions.length - 1 ? (
                      <Button onClick={goToNextQuestion} disabled={!allAnsweredForTest(currentTest.test.id, answers)}>
                        {t("assessmentPortal.questions.nextTest")}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : currentTestIndex === tests.length - 1 && currentQuestionIndex === currentTest.test.questions.length - 1 ? (
                      <Button onClick={handleFinish} disabled={!allAnswered}>
                        {t("assessmentPortal.questions.finish")}
                        <CheckCircle2 className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button onClick={goToNextQuestion} disabled={currentAnswer == null}>
                        {t("assessmentPortal.questions.next")}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </section>
          </div>
        </div>
      ) : null}

      {mode === "completed" ? (
        <LandingCard>
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">{t("assessmentPortal.completion.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("assessmentPortal.completion.description")}</p>
              <p className="text-xs text-muted-foreground">{t("assessmentPortal.completion.note")}</p>
            </div>
            <div className="flex justify-center">
              <Button variant="secondary" asChild>
                <a href="/">{t("assessmentPortal.completion.cta")}</a>
              </Button>
            </div>
          </div>
        </LandingCard>
      ) : null}
    </PortalLayout>
  );
}

function PortalLayout({
  children,
  participantName,
  linkLanguageLabel,
}: {
  children: ReactNode;
  participantName: string;
  linkLanguageLabel?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-muted/20 text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-10">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-primary">{t("assessmentPortal.header.brand")}</p>
            <h1 className="text-2xl font-semibold">
              {t("assessmentPortal.header.greeting", { name: participantName })}
            </h1>
            {linkLanguageLabel ? <p className="text-xs text-muted-foreground">{linkLanguageLabel}</p> : null}
          </div>
          <div className="flex items-center gap-2 self-start">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1">
          <div className="space-y-8 pb-16">{children}</div>
        </main>
      </div>
    </div>
  );
}

function LandingCard({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl space-y-6">{children}</div>
      </CardContent>
    </Card>
  );
}

function testOffset(tests: PortalTest[], testIndex: number, questionIndex: number) {
  let offset = 0;
  for (let index = 0; index < tests.length; index += 1) {
    const test = tests[index];
    if (!test) {
      continue;
    }
    if (index === testIndex) {
      offset += questionIndex;
      break;
    }
    offset += test.test.questions.length;
  }
  return offset;
}

function allAnsweredForTest(testId: string, answers: Record<string, Record<string, number | null>>) {
  const perQuestion = answers[testId];
  if (!perQuestion) {
    return false;
  }
  return Object.values(perQuestion).every((value) => value != null);
}

