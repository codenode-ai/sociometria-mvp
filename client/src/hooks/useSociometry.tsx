import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  SociometryForm,
  SociometryLink,
  SociometryLinkStatus,
  SociometryResponse,
  SociometrySnapshot,
  SupportedLanguage,
} from "@shared/schema";
import {
  mockSociometryEmployees,
  mockSociometryForm,
  mockSociometryLinks,
  mockSociometryResponses,
  mockSociometrySnapshot,
} from "@/lib/mock/sociometry-data";

export interface SociometryContextValue {
  form: SociometryForm;
  links: SociometryLink[];
  responses: SociometryResponse[];
  snapshot: SociometrySnapshot;
  employees: typeof mockSociometryEmployees;
  generateLink: (collaboratorId: string, options?: { language?: SupportedLanguage }) => SociometryLink;
  markLinkStatus: (linkId: string, status: SociometryLinkStatus) => void;
}

const SociometryContext = createContext<SociometryContextValue | null>(null);

function cloneLink(link: SociometryLink): SociometryLink {
  return {
    ...link,
    createdAt: new Date(link.createdAt),
    expiresAt: link.expiresAt ? new Date(link.expiresAt) : undefined,
    completedAt: link.completedAt ? new Date(link.completedAt) : undefined,
    lastReminderAt: link.lastReminderAt ? new Date(link.lastReminderAt) : undefined,
  };
}

function cloneResponse(response: SociometryResponse): SociometryResponse {
  return {
    ...response,
    createdAt: new Date(response.createdAt),
    selections: response.selections.map((selection) => ({ ...selection })),
  };
}

function cloneSnapshot(snapshot: SociometrySnapshot): SociometrySnapshot {
  return {
    ...snapshot,
    generatedAt: new Date(snapshot.generatedAt),
    preferredEdges: snapshot.preferredEdges.map((edge) => ({ ...edge })),
    avoidanceEdges: snapshot.avoidanceEdges.map((edge) => ({ ...edge })),
    roleIndicators: snapshot.roleIndicators.map((role) => ({ ...role })),
  };
}

export function SociometryProvider({ children }: { children: ReactNode }) {
  const [links, setLinks] = useState(() => mockSociometryLinks.map(cloneLink));
  const [responses] = useState(() => mockSociometryResponses.map(cloneResponse));
  const [snapshot] = useState(() => cloneSnapshot(mockSociometrySnapshot));

  const generateLink: SociometryContextValue["generateLink"] = useCallback(
    (collaboratorId, options) => {
      const now = new Date();
      const codeBase = collaboratorId.split('-').pop()?.toUpperCase() ?? collaboratorId.toUpperCase();
      const code = `SOCIO-${codeBase}-${now.getTime().toString(36).toUpperCase()}`;

      const newLink: SociometryLink = {
        id: `socio-link-${now.getTime().toString(36)}`,
        formId: mockSociometryForm.id,
        collaboratorId,
        code,
        status: "pending",
        url: `https://app.sociometria.dev/sociometria/${code}`,
        language: options?.language ?? mockSociometryForm.defaultLanguage,
        createdAt: now,
      };

      setLinks((prev) => [newLink, ...prev]);
      return newLink;
    },
    [],
  );

  const markLinkStatus: SociometryContextValue["markLinkStatus"] = useCallback((linkId, status) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === linkId
          ? {
              ...link,
              status,
              completedAt: status === "completed" ? new Date() : link.completedAt,
            }
          : link,
      ),
    );
  }, []);

  const value = useMemo<SociometryContextValue>(() => ({
    form: mockSociometryForm,
    links,
    responses,
    snapshot,
    employees: mockSociometryEmployees,
    generateLink,
    markLinkStatus,
  }), [generateLink, links, markLinkStatus, responses, snapshot]);

  return <SociometryContext.Provider value={value}>{children}</SociometryContext.Provider>;
}

export function useSociometry(): SociometryContextValue {
  const context = useContext(SociometryContext);
  if (!context) {
    throw new Error("useSociometry must be used within a SociometryProvider");
  }
  return context;
}
