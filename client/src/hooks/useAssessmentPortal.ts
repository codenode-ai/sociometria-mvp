import { useMemo } from "react";
import type {
  Assessment,
  AssessmentAssignment,
  AssessmentLink,
  AssessmentSession,
  AssessmentTestRef,
  PsychologicalTest,
} from "@shared/schema";
import {
  mockAssessments,
  mockAssessmentAssignments,
  mockAssessmentLinks,
  mockAssessmentSessions,
  mockTests,
} from "@/lib/mock/test-data";

export interface PortalTest {
  ref: AssessmentTestRef;
  test: PsychologicalTest;
}

interface AssessmentPortalData {
  status: "idle" | "not_found" | "ready" | "missing";
  link?: AssessmentLink;
  assessment?: Assessment;
  assignment?: AssessmentAssignment;
  session?: AssessmentSession;
  tests: PortalTest[];
}

export function useAssessmentPortal(code: string | undefined): AssessmentPortalData {
  return useMemo(() => {
    if (!code) {
      return { status: "idle", tests: [] } satisfies AssessmentPortalData;
    }

    const link = mockAssessmentLinks.find((item) => item.code === code);
    if (!link) {
      return { status: "not_found", tests: [] } satisfies AssessmentPortalData;
    }

    const assessment = mockAssessments.find((item) => item.id === link.assessmentId);
    const assignments = mockAssessmentAssignments.filter((item) => item.linkId === link.id);
    const assignment =
      assignments.find((item) => item.status === "in_progress") ??
      assignments.find((item) => item.status === "pending") ??
      assignments[0];
    const session = assignment
      ? mockAssessmentSessions.find((item) => item.assignmentId === assignment.id)
      : undefined;

    const orderedTests: PortalTest[] = assessment
      ? assessment.tests
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((ref) => {
            const test = mockTests.find((item) => item.id === ref.testId);
            return test ? ({ ref, test } as PortalTest) : null;
          })
          .filter((value): value is PortalTest => Boolean(value))
      : [];

    if (!assessment || orderedTests.length === 0) {
      return {
        status: "missing",
        link,
        assessment,
        assignment,
        session,
        tests: orderedTests,
      } satisfies AssessmentPortalData;
    }

    return {
      status: "ready",
      link,
      assessment,
      assignment,
      session,
      tests: orderedTests,
    } satisfies AssessmentPortalData;
  }, [code]);
}
