import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  LikertBand,
  LikertQuestion,
  PsychologicalTest,
  SupportedLanguage,
  TestVersionMeta,
} from "@shared/schema";
import { mockTests } from "@/lib/mock/test-data";
import { slugify } from "@/lib/utils";

const DEFAULT_LIKERT_LABELS: Record<number, string> = {
  1: "Discordo totalmente",
  2: "Discordo parcialmente",
  3: "Neutro",
  4: "Concordo parcialmente",
  5: "Concordo totalmente",
};

export interface LikertQuestionDraft {
  id?: string;
  prompt: string;
  dimension?: string;
  helpText?: string;
  weight?: number;
  labels?: Record<number, string>;
}

export interface CreateTestInput {
  title: string;
  description: string;
  language: SupportedLanguage;
  tags?: string[];
  availableLanguages?: SupportedLanguage[];
  estimatedDurationMinutes?: number;
  questions: LikertQuestionDraft[];
  interpretationBands: LikertBand[];
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

function cloneQuestion(question: LikertQuestion): LikertQuestion {
  return {
    ...question,
    labels: { ...question.labels },
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

function normalizeBands(bands: LikertBand[]): LikertBand[] {
  return bands.map((band) => ({
    ...band,
    label: band.label.trim(),
    description: band.description?.trim(),
  }));
}

function normalizeQuestions(
  drafts: LikertQuestionDraft[],
  options: { slug: string; preserveIds?: boolean },
): LikertQuestion[] {
  if (drafts.length !== 10) {
    throw new Error("A psychological test must contain exactly 10 questions.");
  }

  return drafts.map((draft, index) => {
    const prompt = draft.prompt.trim();
    if (!prompt) {
      throw new Error(`Question ${index + 1} must have a prompt.`);
    }

    return {
      id: options.preserveIds && draft.id ? draft.id : `${options.slug}-q${index + 1}`,
      prompt,
      dimension: draft.dimension?.trim() || undefined,
      helpText: draft.helpText?.trim() || undefined,
      scaleMin: 1,
      scaleMax: 5,
      labels: draft.labels ? { ...draft.labels } : { ...DEFAULT_LIKERT_LABELS },
      weight: typeof draft.weight === "number" ? draft.weight : undefined,
    };
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
