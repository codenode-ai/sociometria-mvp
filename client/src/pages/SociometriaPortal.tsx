import { useMemo, useState } from "react";
import { useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  BadgeCheck,
  Loader2,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useSociometry, type SociometryContextValue } from "@/hooks/useSociometry";
import { cn } from "@/lib/utils";
import type {
  SociometryQuestion,
  SociometryQuestionKey,
  SociometrySelection,
} from "@shared/schema";

interface AnswerState {
  [key: string]: string[];
}

const introduction = [
  "O questionário a seguir ajuda a entender os vínculos interpessoais dentro da equipe.",
  "Escolha as pessoas com quem você já trabalhou e que conhece bem.",
  "Suas respostas são confidenciais e servirão apenas para melhorar alocações e rotinas.",
];

type SociometryEmployee = SociometryContextValue["employees"][number];

function getCollaboratorName(employees: SociometryEmployee[], id: string): string {
  return employees.find((employee) => employee.id === id)?.name ?? id;
}

export default function SociometriaPortal() {
  const { t } = useTranslation();
  const [match, params] = useRoute<{ code: string }>("/sociometria/link/:code");
  const { form, links, markLinkStatus, employees } = useSociometry();

  const link = useMemo(() => links.find((item) => item.code === params?.code), [links, params?.code]);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<AnswerState>(() => {
    const initial: AnswerState = {};
    form.questions.forEach((question) => {
      initial[question.id] = [];
    });
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const collaboratorName = link ? getCollaboratorName(employees, link.collaboratorId) : undefined;
  const availableEmployees = useMemo(
    () => employees.filter((employee) => employee.id !== link?.collaboratorId),
    [employees, link?.collaboratorId],
  );

  if (!match || !link) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <Card className="mx-auto max-w-xl border-destructive/50 bg-destructive/10">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Link não encontrado</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">
              O link de sociometria informado é inválido ou expirou. Solicite um novo convite ao seu gestor.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (link.status === "completed" || submitted) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <Card className="mx-auto max-w-xl border-primary/40">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <BadgeCheck className="h-5 w-5" />
              <CardTitle>Questionário concluído</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Obrigado por compartilhar sua percepção sobre a equipe.</p>
            <p>
              As respostas ajudam a montar duplas mais eficientes, identificar mentores e resolver possíveis conflitos de forma
              proativa.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleToggle = (question: SociometryQuestion, employeeId: string) => {
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      const exists = current.includes(employeeId);
      let next = current;

      if (question.maxSelections === 1) {
        next = exists ? [] : [employeeId];
      } else if (exists) {
        next = current.filter((id) => id !== employeeId);
      } else if (!question.maxSelections || current.length < question.maxSelections) {
        next = [...current, employeeId];
      }

      return { ...prev, [question.id]: next };
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string | null> = {};
    let isValid = true;

    form.questions.forEach((question) => {
      const current = answers[question.id] ?? [];
      const min = question.minSelections ?? 0;
      if (current.length < min) {
        nextErrors[question.id] = `Selecione pelo menos ${min} opção(ões).`;
        isValid = false;
      } else {
        nextErrors[question.id] = null;
      }
    });

    setErrors(nextErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const payload: Record<SociometryQuestionKey, SociometrySelection[]> = {} as any;
    form.questions.forEach((question) => {
      payload[question.id] = (answers[question.id] ?? []).map((targetId, index) => ({
        targetEmployeeId: targetId,
        weight: form.questions.some((q) => q.maxSelections && q.maxSelections > 1)
          ? (answers[question.id]!.length - index)
          : undefined,
      }));
    });

    console.info("Mock sociometry payload", {
      link: link.code,
      collaboratorId: link.collaboratorId,
      answers: payload,
    });

    markLinkStatus(link.id, "completed");
    setSubmitted(true);
  };

  const renderQuestion = (question: SociometryQuestion) => {
    const current = answers[question.id] ?? [];
    const isSingle = (question.maxSelections ?? 1) === 1;

    return (
      <Card key={question.id} className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {question.prompt}
          </CardTitle>
          {question.helperText ? (
            <p className="text-sm text-muted-foreground">{question.helperText}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {availableEmployees.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há colegas suficientes cadastrados para responder esta pergunta.
            </p>
          ) : isSingle ? (
            <RadioGroup value={current[0] ?? ""} onValueChange={(value) => handleToggle(question, value)}>
              {availableEmployees.map((employee) => (
                <Label
                  key={employee.id}
                  htmlFor={`${question.id}-${employee.id}`}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm transition",
                    current.includes(employee.id) ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={employee.id} id={`${question.id}-${employee.id}`} />
                    <div>
                      <p className="font-medium leading-none">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">{employee.role}</p>
                    </div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          ) : (
            <div className="space-y-2">
              {availableEmployees.map((employee) => (
                <Label
                  key={employee.id}
                  htmlFor={`${question.id}-${employee.id}`}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm transition",
                    current.includes(employee.id) ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
                    current.includes(employee.id) ? "ring-1 ring-primary/30" : undefined,
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`${question.id}-${employee.id}`}
                      checked={current.includes(employee.id)}
                      onCheckedChange={() => handleToggle(question, employee.id)}
                    />
                    <div>
                      <p className="font-medium leading-none">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">{employee.role}</p>
                    </div>
                  </div>
                  {current.includes(employee.id) && question.maxSelections && question.maxSelections > 1 ? (
                    <span className="text-xs text-muted-foreground">
                      #{current.indexOf(employee.id) + 1}
                    </span>
                  ) : null}
                </Label>
              ))}
            </div>
          )}

          {errors[question.id] ? <p className="text-xs text-destructive">{errors[question.id]}</p> : null}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <Card className="mx-auto max-w-4xl border-border/60">
        <CardHeader className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {link.language.toUpperCase()} · {form.title}
            </p>
            <CardTitle className="text-2xl font-semibold">
              Olá, {collaboratorName ?? "colaboradora"}
            </CardTitle>
          </div>
          <div className="rounded-md border border-dashed border-muted p-4 text-sm text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
              <Users className="h-4 w-4" />
              Sociometria da equipe
            </div>
            <ul className="list-disc space-y-1 pl-5">
              {introduction.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {availableEmployees.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Ainda estamos cadastrando as colegas da equipe. Volte mais tarde.
            </div>
          ) : (
            form.questions.map(renderQuestion)
          )}
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={availableEmployees.length === 0}>
              Enviar respostas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}






