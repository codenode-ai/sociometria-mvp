import { z } from "zod";

export type SupportedLanguage = "pt" | "en" | "es";

export interface Employee {
  id: string;
  name: string;
  role: "drive" | "help" | "support";
  status: "active" | "inactive" | "leave";
  traits: string[];
  preferences?: string[];
  avoidances?: string[];
  notes?: string;
}

export const insertEmployeeSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z.enum(["drive", "help", "support"]),
  status: z.enum(["active", "inactive", "leave"]).optional(),
  traits: z.array(z.string()).optional(),
  preferences: z.array(z.string()).optional(),
  avoidances: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export interface House {
  id: string;
  name: string;
  cleaningType: "quick" | "standard" | "meticulous";
  size: "small" | "medium" | "large";
  address?: string;
  tags?: string[];
  notes?: string;
}

export const insertHouseSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cleaningType: z.enum(["quick", "standard", "meticulous"]),
  size: z.enum(["small", "medium", "large"]),
  address: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type InsertHouse = z.infer<typeof insertHouseSchema>;

export interface LikertQuestion {
  id: string;
  prompt: string;
  helpText?: string;
  dimension?: string;
  reverseScore?: boolean;
  scaleMin: number;
  scaleMax: number;
  labels?: Record<number, string>;
  weight?: number;
}

export interface LikertBand {
  id: string;
  label: string;
  min: number;
  max: number;
  description?: string;
  color?: string;
}

export interface TestVersionMeta {
  version: number;
  createdAt: Date;
  note?: string;
  author?: string;
}

export interface PsychologicalTest {
  id: string;
  slug: string;
  language: SupportedLanguage;
  availableLanguages: SupportedLanguage[];
  title: string;
  description: string;
  questions: LikertQuestion[];
  interpretationBands: LikertBand[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
  estimatedDurationMinutes?: number;
  history: TestVersionMeta[];
  status?: "draft" | "published" | "archived";
}

export const insertTestSchema = z.object({
  title: z.string().min(3, "Titulo deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descricao deve ter pelo menos 10 caracteres"),
  language: z.enum(["pt", "en", "es"]),
});

export type InsertTest = z.infer<typeof insertTestSchema>;

export interface AssessmentTestRef {
  testId: string;
  testVersion: number;
  order: number;
  optional?: boolean;
}

export interface Assessment {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tests: AssessmentTestRef[];
  defaultLanguage: SupportedLanguage;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  status: "draft" | "published" | "archived";
  history: TestVersionMeta[];
  metadata?: {
    estimatedDurationMinutes?: number;
    tags?: string[];
  };
}

export interface AssessmentLink {
  id: string;
  assessmentId: string;
  code: string;
  language: SupportedLanguage;
  url: string;
  expiresAt?: Date;
  createdAt: Date;
}

export type AssessmentAssignmentStatus = "pending" | "in_progress" | "paused" | "completed";

export interface AssessmentAssignment {
  id: string;
  assessmentId: string;
  assigneeId: string;
  linkId: string;
  language: SupportedLanguage;
  status: AssessmentAssignmentStatus;
  startedAt?: Date;
  completedAt?: Date;
  lastActivityAt?: Date;
  progress: {
    currentTestId?: string;
    currentQuestionId?: string;
    completedTests: string[];
    percentage: number;
    remainingTimeMs?: number;
  };
  attempt: number;
  metadata?: Record<string, unknown>;
}

export interface LikertResponse {
  questionId: string;
  value: number;
}

export interface AssessmentResponseSet {
  testId: string;
  responses: LikertResponse[];
  startedAt: Date;
  submittedAt?: Date;
  durationMs?: number;
}

export type AssessmentSessionStatus = "active" | "paused" | "completed" | "expired";

export interface AssessmentSession {
  id: string;
  assignmentId: string;
  status: AssessmentSessionStatus;
  startedAt: Date;
  pausedAt?: Date;
  completedAt?: Date;
  lastSavedAt: Date;
  responses: AssessmentResponseSet[];
  progress: {
    currentTestIndex: number;
    currentQuestionIndex: number;
  };
  timerMs?: number;
}

export interface TeamRecommendation {
  id: string;
  members: Employee[];
  compatibility: number;
  justification: string;
  house?: House;
}

export interface SociometryData {
  employeeId: string;
  preferences: string[];
  avoidances: string[];
}

export interface PerformanceReport {
  employeeId: string;
  employeeName: string;
  completedTasks: number;
  averageRating: number;
  bestPartner?: string;
  improvement: "high" | "medium" | "low";
}
