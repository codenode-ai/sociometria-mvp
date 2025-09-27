import { useCallback, useMemo, useState } from "react";
import type {
  Assessment,
  AssessmentAssignment,
  AssessmentAssignmentStatus,
  AssessmentLink,
  AssessmentResponseSet,
  AssessmentSession,
  AssessmentTestRef,
  PsychologicalTest,
  SupportedLanguage,
  TestVersionMeta,
} from "@shared/schema";
import {
  mockAssessments,
  mockAssessmentAssignments,
  mockAssessmentLinks,
  mockAssessmentSessions,
  mockTests,
} from "@/lib/mock/test-data";
import { slugify } from "@/lib/utils";

const generateId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const cloneHistory = (history: TestVersionMeta[]): TestVersionMeta[] =>
  history.map((entry) => ({
    ...entry,
    createdAt: new Date(entry.createdAt),
  }));

const cloneTestRefs = (tests: AssessmentTestRef[]): AssessmentTestRef[] =>
  tests.map((test) => ({ ...test }));

const cloneAssessment = (assessment: Assessment): Assessment => ({
  ...assessment,
  tests: cloneTestRefs(assessment.tests),
  createdAt: new Date(assessment.createdAt),
  updatedAt: new Date(assessment.updatedAt),
  history: cloneHistory(assessment.history),
  metadata: assessment.metadata
    ? {
        ...assessment.metadata,
        tags: assessment.metadata.tags ? [...assessment.metadata.tags] : undefined,
      }
    : undefined,
});

const cloneLink = (link: AssessmentLink): AssessmentLink => ({
  ...link,
  createdAt: new Date(link.createdAt),
  expiresAt: link.expiresAt ? new Date(link.expiresAt) : undefined,
});

const cloneResponseSet = (responses: AssessmentResponseSet[]): AssessmentResponseSet[] =>
  responses.map((set) => ({
    ...set,
    startedAt: new Date(set.startedAt),
    submittedAt: set.submittedAt ? new Date(set.submittedAt) : undefined,
  }));

const cloneSession = (session: AssessmentSession): AssessmentSession => ({
  ...session,
  startedAt: new Date(session.startedAt),
  pausedAt: session.pausedAt ? new Date(session.pausedAt) : undefined,
  completedAt: session.completedAt ? new Date(session.completedAt) : undefined,
  lastSavedAt: new Date(session.lastSavedAt),
  responses: cloneResponseSet(session.responses),
});

const cloneAssignment = (assignment: AssessmentAssignment): AssessmentAssignment => ({
  ...assignment,
  startedAt: assignment.startedAt ? new Date(assignment.startedAt) : undefined,
  completedAt: assignment.completedAt ? new Date(assignment.completedAt) : undefined,
  lastActivityAt: assignment.lastActivityAt ? new Date(assignment.lastActivityAt) : undefined,
  progress: {
    ...assignment.progress,
    completedTests: [...assignment.progress.completedTests],
    remainingTimeMs: assignment.progress.remainingTimeMs,
  },
  metadata: assignment.metadata ? { ...assignment.metadata } : undefined,
});

const cloneTest = (test: PsychologicalTest): PsychologicalTest => ({
  ...test,
  questions: test.questions.map((question) => ({ ...question })),
  interpretationBands: test.interpretationBands.map((band) => ({ ...band })),
  history: cloneHistory(test.history),
  createdAt: new Date(test.createdAt),
  updatedAt: new Date(test.updatedAt),
  availableLanguages: [...test.availableLanguages],
  tags: test.tags ? [...test.tags] : undefined,
});

type CreateAssessmentInput = {
  name: string;
  description?: string;
  defaultLanguage: SupportedLanguage;
  testIds: string[];
  tags?: string[];
  estimatedDurationMinutes?: number;
  status?: Assessment["status"];
};

type DuplicateAssessmentOptions = {
  suffix?: string;
};

type GenerateLinkInput = {
  assessmentId: string;
  language: SupportedLanguage;
  expiresAt?: Date | null;
  baseUrl?: string;
};

type AddAssignmentInput = {
  assessmentId: string;
  assigneeId: string;
  assigneeName: string;
  language: SupportedLanguage;
  linkId: string;
};

type UpdateAssignmentStatusInput = {
  assignmentId: string;
  status: AssessmentAssignmentStatus;
  progressPercentage?: number;
};

export function useAssessmentsData() {
  const [assessments, setAssessments] = useState<Assessment[]>(() =>
    mockAssessments.map(cloneAssessment),
  );
  const [links, setLinks] = useState<AssessmentLink[]>(() =>
    mockAssessmentLinks.map(cloneLink),
  );
  const [assignments, setAssignments] = useState<AssessmentAssignment[]>(() =>
    mockAssessmentAssignments.map(cloneAssignment),
  );
  const [sessions] = useState<AssessmentSession[]>(() =>
    mockAssessmentSessions.map(cloneSession),
  );

  const tests = useMemo(() => mockTests.map(cloneTest), []);

  const getAssessment = useCallback(
    (assessmentId: string) => assessments.find((item) => item.id === assessmentId),
    [assessments],
  );

  const createAssessment = useCallback(
    (input: CreateAssessmentInput) => {
      const name = input.name.trim();
      const now = new Date();
      const id = generateId("assessment");
      const slugBase = slugify(name) || "avaliacao";

      const testsRefs: AssessmentTestRef[] = input.testIds.map((testId, index) => {
        const related = tests.find((test) => test.id === testId);
        return {
          testId,
          testVersion: related?.version ?? 1,
          order: index + 1,
        };
      });

      const cleanedTags = input.tags
        ?.map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const metadata = {
        estimatedDurationMinutes: input.estimatedDurationMinutes,
        tags: cleanedTags,
      } as Assessment["metadata"];

      const hasMetadata = Boolean(
        metadata.estimatedDurationMinutes || (metadata.tags && metadata.tags.length > 0),
      );

      const newAssessment: Assessment = {
        id,
        name,
        slug: `${slugBase}-${Date.now().toString(36)}`,
        description: input.description?.trim() || undefined,
        tests: testsRefs,
        defaultLanguage: input.defaultLanguage,
        createdAt: now,
        updatedAt: now,
        version: 1,
        status: input.status ?? "draft",
        history: [
          {
            version: 1,
            createdAt: now,
            note: "Criada manualmente",
          },
        ],
        metadata: hasMetadata ? metadata : undefined,
      };

      setAssessments((prev) => [newAssessment, ...prev]);
      return newAssessment;
    },
    [tests],
  );

  const duplicateAssessment = useCallback(
    (assessmentId: string, options?: DuplicateAssessmentOptions) => {
      const source = getAssessment(assessmentId);
      if (!source) {
        return null;
      }

      const now = new Date();
      const id = generateId("assessment");
      const suffix = options?.suffix?.trim() || "copia";
      const copiedName = `${source.name} (${suffix})`;
      const copiedSlug = slugify(`${source.slug}-${suffix}`) || `${source.slug}-${Date.now().toString(36)}`;

      const duplicate: Assessment = {
        ...cloneAssessment(source),
        id,
        name: copiedName,
        slug: copiedSlug,
        createdAt: now,
        updatedAt: now,
        version: 1,
        status: "draft",
        history: [
          {
            version: 1,
            createdAt: now,
            note: `Copiada de ${source.name}`,
          },
        ],
      };

      setAssessments((prev) => [duplicate, ...prev]);
      return duplicate;
    },
    [getAssessment],
  );

  const updateAssessmentStatus = useCallback(
    (assessmentId: string, status: Assessment["status"]) => {
      setAssessments((prev) =>
        prev.map((assessment) =>
          assessment.id === assessmentId
            ? { ...assessment, status, updatedAt: new Date() }
            : assessment,
        ),
      );
    },
    [],
  );

  const generateLink = useCallback(
    ({ assessmentId, language, expiresAt, baseUrl }: GenerateLinkInput) => {
      const now = new Date();
      const assessment = getAssessment(assessmentId);
      const code = `${assessment?.slug ?? assessmentId}-${Math.random().toString(36).slice(2, 6)}`;
      const urlBase = (baseUrl ?? "http://localhost:5173").replace(/\/$/, "");

      const newLink: AssessmentLink = {
        id: generateId("link"),
        assessmentId,
        code,
        language,
        url: `${urlBase}/avaliacoes/${code}`,
        createdAt: now,
        expiresAt: expiresAt ?? undefined,
      };

      setLinks((prev) => [newLink, ...prev]);
      return newLink;
    },
    [getAssessment],
  );

  const addAssignment = useCallback(
    ({ assessmentId, assigneeId, assigneeName, language, linkId }: AddAssignmentInput) => {
      const now = new Date();
      const fallbackId = assigneeId.trim() || slugify(assigneeName) || `colab-${Date.now().toString(36)}`;

      const newAssignment: AssessmentAssignment = {
        id: generateId("assignment"),
        assessmentId,
        assigneeId: fallbackId,
        linkId,
        language,
        status: "pending",
        progress: {
          currentTestId: undefined,
          currentQuestionId: undefined,
          completedTests: [],
          percentage: 0,
        },
        attempt: 1,
        metadata: {
          assigneeName,
        },
        startedAt: undefined,
        completedAt: undefined,
        lastActivityAt: now,
      };

      setAssignments((prev) => [newAssignment, ...prev]);
      return newAssignment;
    },
    [],
  );

  const updateAssignmentStatus = useCallback(
    ({ assignmentId, status, progressPercentage }: UpdateAssignmentStatusInput) => {
      setAssignments((prev) =>
        prev.map((assignment) => {
          if (assignment.id !== assignmentId) {
            return assignment;
          }

          const now = new Date();
          const percentage =
            typeof progressPercentage === "number"
              ? Math.min(100, Math.max(0, progressPercentage))
              : assignment.progress.percentage;

          return {
            ...assignment,
            status,
            progress: {
              ...assignment.progress,
              percentage,
            },
            startedAt: assignment.startedAt ?? (status === "in_progress" ? now : assignment.startedAt),
            completedAt: status === "completed" ? now : assignment.completedAt,
            lastActivityAt: now,
          };
        }),
      );
    },
    [],
  );

  const removeLink = useCallback((linkId: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== linkId));
  }, []);

  const removeAssignment = useCallback((assignmentId: string) => {
    setAssignments((prev) => prev.filter((assignment) => assignment.id !== assignmentId));
  }, []);

  return {
    assessments,
    tests,
    links,
    assignments,
    sessions,
    createAssessment,
    duplicateAssessment,
    updateAssessmentStatus,
    generateLink,
    addAssignment,
    updateAssignmentStatus,
    removeLink,
    removeAssignment,
  };
}
