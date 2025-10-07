import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  OptionWeight,
  PsychologicalTest,
  QuestionOption,
  ScoreBand,
  SupportedLanguage,
  TestVersionMeta,
  WeightedQuestion,
} from "@shared/schema";
import { mockTests } from "@/lib/mock/test-data";
import { slugify } from "@/lib/utils";

const QUESTION_COUNT = 10;
const OPTION_WEIGHTS: OptionWeight[] = [1, 2, 3, 4];

const DEFAULT_OPTION_LABELS: Record<OptionWeight, string> = {
  1: "Quase nunca descreve minha atuacao",
  2: "As vezes descreve minha atuacao",
  3: "Frequentemente descreve minha atuacao",
  4: "Quase sempre descreve minha atuacao",
};

export interface QuestionOptionDraft {
  id?: string;
  label?: string;
  weight: OptionWeight;
}

export interface LikertQuestionDraft {
  id?: string;
  prompt: string;
  dimension?: string;
  helpText?: string;
  labels?: Record<number, string>;
  options?: QuestionOptionDraft[];
}

export interface CreateTestInput {
  title: string;
  description: string;
  language: SupportedLanguage;
  tags?: string[];
  availableLanguages?: SupportedLanguage[];
  estimatedDurationMinutes?: number;
  questions: LikertQuestionDraft[];
  interpretationBands: ScoreBand[];
  status?: PsychologicalTest["status"];
  historyNote?: string;
}

export type UpdateTestInput = CreateTestInput;

interface TestsContextValue {
  tests: PsychologicalTest[];
  createTest(input: CreateTestInput): PsychologicalTest;
  updateTest(id: string, input: UpdateTestInput): PsychologicalTest | null;
  deleteTest(id: string): void;
  getTestById(id: string): PsychologicalTest | undefined;
}

const TestsContext = createContext<TestsContextValue | null>(null);

function cloneHistory(history: TestVersionMeta[]): TestVersionMeta[] {
  return history.map((entry) => ({
    ...entry,
    createdAt: new Date(entry.createdAt),
  }));
}

function cloneQuestion(question: WeightedQuestion): WeightedQuestion {
  return {
    ...question,
    options: question.options.map((option) => ({ ...option })),
  };
}

function cloneTest(test: PsychologicalTest): PsychologicalTest {
  return {
    ...test,
    questions: test.questions.map(cloneQuestion),
    interpretationBands: test.interpretationBands.map((band) => ({ ...band })),
    availableLanguages: [...test.availableLanguages],
    tags: test.tags ? [...test.tags] : undefined,
    history: cloneHistory(test.history),
    createdAt: new Date(test.createdAt),
    updatedAt: new Date(test.updatedAt),
  };
}

function ensureTags(tags?: string[]): string[] | undefined {
  if (!tags) {
    return undefined;
  }

  const cleaned = tags.map((tag) => tag.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : undefined;
}

function normalizeBands(bands: ScoreBand[]): ScoreBand[] {
  return bands.map((band) => ({
    ...band,
    label: band.label.trim(),
    description: band.description?.trim(),
  }));
}

function resolveOptionLabel(options: QuestionOptionDraft[] | undefined, labels: Record<number, string> | undefined, weight: OptionWeight): string {
  const candidates: Array<string | undefined> = [];
  if (options) {
    const option = options.find((item) => item.weight === weight);
    candidates.push(option?.label);
  }
  if (labels) {
    const labelFromMap = labels[weight];
    if (typeof labelFromMap === "string") {
      candidates.push(labelFromMap);
    }
  }
  candidates.push(DEFAULT_OPTION_LABELS[weight]);

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return DEFAULT_OPTION_LABELS[weight];
}

function normalizeOptions(
  draft: LikertQuestionDraft,
  context: { questionId: string; questionIndex: number; preserveIds?: boolean },
): QuestionOption[] {
  const normalized: QuestionOption[] = [];
  const usedWeights = new Set<OptionWeight>();
  const sourceOptions = draft.options ?? [];

  sourceOptions.slice(0, OPTION_WEIGHTS.length).forEach((option, optionIndex) => {
    if (!OPTION_WEIGHTS.includes(option.weight)) {
      throw new Error(`Question ${context.questionIndex + 1} contains an option with an invalid weight.`);
    }
    if (usedWeights.has(option.weight)) {
      throw new Error(`Question ${context.questionIndex + 1} has duplicate weight ${option.weight}.`);
    }

    const label = (option.label ?? "").trim() || resolveOptionLabel(draft.options, draft.labels, option.weight);
    if (!label) {
      throw new Error(`Question ${context.questionIndex + 1} option with weight ${option.weight} must have a label.`);
    }

    const id =
      context.preserveIds && option.id ? option.id : `${context.questionId}-opt${optionIndex + 1}`;

    normalized.push({
      id,
      label,
      weight: option.weight,
    });
    usedWeights.add(option.weight);
  });

  if (usedWeights.size !== OPTION_WEIGHTS.length) {
    throw new Error(`Question ${context.questionIndex + 1} must include weights ${OPTION_WEIGHTS.join(", ")}.`);
  }

  return normalized;
}

function normalizeQuestions(
  drafts: LikertQuestionDraft[],
  options: { slug: string; preserveIds?: boolean },
): WeightedQuestion[] {
  if (drafts.length !== QUESTION_COUNT) {
    throw new Error(`A psychological test must contain exactly ${QUESTION_COUNT} questions.`);
  }

  return drafts.map((draft, index) => {
    const prompt = draft.prompt.trim();
    if (!prompt) {
      throw new Error(`Question ${index + 1} must have a prompt.`);
    }

    const questionId = options.preserveIds && draft.id ? draft.id : `${options.slug}-q${index + 1}`;
    const optionsNormalized = normalizeOptions(draft, {
      questionId,
      questionIndex: index,
      preserveIds: options.preserveIds,
    });

    return {
      id: questionId,
      prompt,
      dimension: draft.dimension?.trim() || undefined,
      helpText: draft.helpText?.trim() || undefined,
      options: optionsNormalized,
    } satisfies WeightedQuestion;
  });
}

export function TestsProvider({ children }: { children: ReactNode }) {
  const [tests, setTests] = useState<PsychologicalTest[]>(() => mockTests.map(cloneTest));

  const createTest = useCallback((input: CreateTestInput) => {
    const now = new Date();
    const baseSlug = slugify(input.title).trim() || `custom-test-${now.getTime()}`;
    const uniqueSuffix = now.getTime().toString(36);

    const questions = normalizeQuestions(input.questions, {
      slug: `${baseSlug}-${uniqueSuffix}`,
      preserveIds: false,
    });

    const interpretationBands = normalizeBands(input.interpretationBands);

    const historyEntry: TestVersionMeta = {
      version: 1,
      createdAt: now,
      note: input.historyNote ?? "Manual creation",
    };

    const availableLanguages = input.availableLanguages?.length
      ? Array.from(new Set([input.language, ...input.availableLanguages]))
      : [input.language];

    const tags = ensureTags(input.tags);

    const newTest: PsychologicalTest = {
      id: `${baseSlug}-${uniqueSuffix}`,
      slug: baseSlug,
      language: input.language,
      availableLanguages,
      title: input.title.trim(),
      description: input.description.trim(),
      questions,
      interpretationBands,
      tags,
      createdAt: now,
      updatedAt: now,
      version: 1,
      estimatedDurationMinutes: input.estimatedDurationMinutes,
      history: [historyEntry],
      status: input.status ?? "draft",
    };

    setTests((prev) => [newTest, ...prev]);
    return newTest;
  }, []);

  const updateTest = useCallback(
    (id: string, input: UpdateTestInput) => {
      let updatedTest: PsychologicalTest | null = null;

      setTests((prev) =>
        prev.map((test) => {
          if (test.id !== id) {
            return test;
          }

          const now = new Date();
          const nextSlug = slugify(input.title).trim() || test.slug;
          const questions = normalizeQuestions(input.questions, {
            slug: test.id,
            preserveIds: true,
          });
          const interpretationBands = normalizeBands(input.interpretationBands);
          const availableLanguages = input.availableLanguages?.length
            ? Array.from(new Set([input.language, ...input.availableLanguages]))
            : [input.language];
          const nextVersion = test.version + 1;

          const historyEntry: TestVersionMeta = {
            version: nextVersion,
            createdAt: now,
            note: input.historyNote ?? "Manual update",
          };

          updatedTest = {
            ...test,
            slug: nextSlug,
            language: input.language,
            availableLanguages,
            title: input.title.trim(),
            description: input.description.trim(),
            questions,
            interpretationBands,
            tags: ensureTags(input.tags),
            updatedAt: now,
            estimatedDurationMinutes: input.estimatedDurationMinutes,
            version: nextVersion,
            history: [...test.history, historyEntry],
            status: input.status ?? test.status ?? "draft",
          };

          return updatedTest;
        }),
      );

      return updatedTest;
    },
    [],
  );

  const deleteTest = useCallback((id: string) => {
    setTests((prev) => prev.filter((test) => test.id !== id));
  }, []);

  const getTestById = useCallback(
    (id: string) => tests.find((test) => test.id === id),
    [tests],
  );

  const value = useMemo(
    () => ({ tests, createTest, updateTest, deleteTest, getTestById }),
    [tests, createTest, updateTest, deleteTest, getTestById],
  );

  return <TestsContext.Provider value={value}>{children}</TestsContext.Provider>;
}

export function useTests(): TestsContextValue {
  const context = useContext(TestsContext);
  if (!context) {
    throw new Error("useTests must be used within a TestsProvider");
  }
  return context;
}
