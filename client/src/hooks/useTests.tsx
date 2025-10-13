import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { apiRequest } from "@/lib/queryClient";
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
  questionKey?: string;
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
  author?: string;
  questions: LikertQuestionDraft[];
  interpretationBands: LikertBand[];
}

export type UpdateTestInput = CreateTestInput;

interface TestsContextValue {
  tests: PsychologicalTest[];
  isLoading: boolean;
  isError: boolean;
  createTest(input: CreateTestInput): Promise<PsychologicalTest>;
  updateTest(id: string, input: UpdateTestInput): Promise<PsychologicalTest>;
  deleteTest(id: string): Promise<void>;
  getTestById(id: string): PsychologicalTest | undefined;
}

const TestsContext = createContext<TestsContextValue | null>(null);

const TESTS_ENDPOINT = "/api/tests";

interface ApiOption {
  id: string;
  weight: number;
  label: string;
}

function cloneQuestion(question: WeightedQuestion): WeightedQuestion {
  return {
    ...question,
    options: question.options.map((option) => ({ ...option })),
  };
}

interface ApiBand {
  id: string;
  bandKey: string;
  label: string;
  description: string | null;
  color: string | null;
  min: number;
  max: number;
}

interface ApiHistoryEntry {
  version: number;
  note: string | null;
  author: string | null;
  createdAt: string;
}

interface ApiTest {
  id: string;
  slug: string;
  title: string;
  description: string;
  language: SupportedLanguage;
  availableLanguages: SupportedLanguage[];
  status: PsychologicalTest["status"] | undefined;
  tags: string[];
  estimatedDurationMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  history: ApiHistoryEntry[];
  questions: ApiQuestion[];
  interpretationBands: ApiBand[];
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

function mapApiHistory(entry: ApiHistoryEntry): TestVersionMeta {
  return {
    version: entry.version,
    note: entry.note ?? undefined,
    author: entry.author ?? undefined,
    createdAt: new Date(entry.createdAt),
  } satisfies TestVersionMeta;
}

function mapApiTest(test: ApiTest): PsychologicalTest {
  return {
    id: test.id,
    slug: test.slug,
    language: test.language,
    availableLanguages: test.availableLanguages,
    title: test.title,
    description: test.description,
    questions: test.questions.map(mapApiQuestion),
    interpretationBands: test.interpretationBands.map(mapApiBand),
    tags: test.tags ?? [],
    createdAt: new Date(test.createdAt),
    updatedAt: new Date(test.updatedAt),
    version: test.version,
    estimatedDurationMinutes: test.estimatedDurationMinutes ?? undefined,
    history: test.history.map(mapApiHistory),
    status: test.status,
  } satisfies PsychologicalTest;
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

  const interpretationBands = input.interpretationBands.map((band) => ({
    id: band.id,
    bandKey: band.id,
    label: band.label,
    description: band.description ?? null,
    color: band.color ?? null,
    min: band.min,
    max: band.max,
  }));

  return {
    title: input.title,
    description: input.description,
    language: input.language,
    availableLanguages: input.availableLanguages ?? [],
    tags: input.tags ?? [],
    estimatedDurationMinutes: input.estimatedDurationMinutes,
    status: input.status,
    historyNote: input.historyNote,
    author: input.author,
    questions,
    interpretationBands,
  };
}

export function TestsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { accessToken } = useSession();

  const testsQuery = useQuery<PsychologicalTest[]>({
    queryKey: ["tests"],
    queryFn: async () => {
      const res = await apiRequest("GET", TESTS_ENDPOINT, undefined, accessToken);
      const data = (await res.json()) as ApiTest[];
      return data.map(mapApiTest);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateTestInput) => {
      const payload = buildPayload(input);
      const res = await apiRequest("POST", TESTS_ENDPOINT, payload, accessToken);
      const data = (await res.json()) as ApiTest;
      return mapApiTest(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTestInput }) => {
      const payload = buildPayload(input);
      const res = await apiRequest("PUT", `${TESTS_ENDPOINT}/${id}`, payload, accessToken);
      const data = (await res.json()) as ApiTest;
      return mapApiTest(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `${TESTS_ENDPOINT}/${id}`, undefined, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });

  const value = useMemo<TestsContextValue>(() => ({
    tests: testsQuery.data ?? [],
    isLoading: testsQuery.isLoading,
    isError: testsQuery.isError,
    createTest: (input) => createMutation.mutateAsync(input),
    updateTest: (id, input) => updateMutation.mutateAsync({ id, input }),
    deleteTest: (id) => deleteMutation.mutateAsync(id),
    getTestById: (id) => (testsQuery.data ?? []).find((test) => test.id === id),
  }), [testsQuery.data, testsQuery.isLoading, testsQuery.isError, createMutation, updateMutation, deleteMutation]);

  return <TestsContext.Provider value={value}>{children}</TestsContext.Provider>;
}

export function useTests(): TestsContextValue {
  const context = useContext(TestsContext);
  if (!context) {
    throw new Error("useTests must be used within a TestsProvider");
  }
  return context;
}


