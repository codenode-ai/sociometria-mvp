import { useMemo } from "react";
import type {
  SociometryForm,
  SociometryLink,
  SociometryResponse,
  SociometrySnapshot,
} from "@shared/schema";
import {
  mockSociometryForm,
  mockSociometryLinks,
  mockSociometryResponses,
  mockSociometrySnapshot,
} from "@/lib/mock/sociometry-data";

export interface SociometryData {
  form: SociometryForm;
  links: SociometryLink[];
  responses: SociometryResponse[];
  snapshot: SociometrySnapshot;
}

export function useSociometryMocks(): SociometryData {
  return useMemo(
    () => ({
      form: structuredClone(mockSociometryForm),
      links: mockSociometryLinks.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
        completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
        lastReminderAt: item.lastReminderAt ? new Date(item.lastReminderAt) : undefined,
      })),
      responses: mockSociometryResponses.map((response) => ({
        ...response,
        createdAt: new Date(response.createdAt),
        selections: response.selections.map((selection) => ({ ...selection })),
      })),
      snapshot: {
        ...mockSociometrySnapshot,
        generatedAt: new Date(mockSociometrySnapshot.generatedAt),
        preferredEdges: mockSociometrySnapshot.preferredEdges.map((edge) => ({ ...edge })),
        avoidanceEdges: mockSociometrySnapshot.avoidanceEdges.map((edge) => ({ ...edge })),
        roleIndicators: mockSociometrySnapshot.roleIndicators.map((role) => ({ ...role })),
      },
    }),
    [],
  );
}
