import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { apiRequest } from "@/lib/queryClient";
import type {
  LikertBand,
  LikertQuestion,
  PsychologicalTest,
  SupportedLanguage,
  TestVersionMeta,
} from "@shared/schema";

export interface LikertQuestionDraft {
  id?: string;
  questionKey?: string;
  prompt: string;
  dimension?: string;
  helpText?: string;
  labels?: Record<number, string>;
  weight?: number;
}

export interface CreateTestInput {
  title: string;
  description: string;
  language: SupportedLanguage;
  tags?: string[];
  availableLanguages?: SupportedLanguage[];
  estimatedDurationMinutes?: number;
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

interface ApiQuestion {
  id: string;
  questionKey: string;
  prompt: string;
  dimension: string | null;
  helpText: string | null;
  position: number;
  options: ApiOption[];
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

function mapApiQuestion(question: ApiQuestion): LikertQuestion {
  const labels: Record<number, string> = {};
  question.options.forEach((option) => {
    labels[option.weight] = option.label;
  });

  return {
    id: question.id,
    prompt: question.prompt,
    dimension: question.dimension ?? undefined,
    helpText: question.helpText ?? undefined,
    scaleMin: 1,
    scaleMax: 4,
    labels,
  } satisfies LikertQuestion;
}

function mapApiBand(band: ApiBand): LikertBand {
  return {
    id: band.id,
    label: band.label,
    min: band.min,
    max: band.max,
    description: band.description ?? undefined,
    color: band.color ?? undefined,
  } satisfies LikertBand;
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

function buildPayload(input: CreateTestInput) {
  const questions = input.questions.map((question, index) => {
    const labels = question.labels ?? {};
    return {
      id: question.id,
      questionKey: question.questionKey,
      prompt: question.prompt,
      dimension: question.dimension,
      helpText: question.helpText,
      options: [1, 2, 3, 4].map((weight) => ({
        weight,
        label: labels[weight] ?? '',
      })),
    };
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


