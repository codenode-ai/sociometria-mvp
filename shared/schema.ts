import { z } from "zod";

export interface Employee {
  id: string;
  name: string;
  role: "drive" | "help" | "support";
  status: "active" | "inactive" | "leave";
  traits: string[];
  preferences?: string[];
  avoidances?: string[];
}

export const insertEmployeeSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z.enum(["drive", "help", "support"]),
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export interface House {
  id: string;
  name: string;
  type: "dynamic" | "standard" | "detailed";
  difficulty: 1 | 2 | 3 | 4 | 5;
  rating: number;
  address?: string;
}

export const insertHouseSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  type: z.enum(["dynamic", "standard", "detailed"]),
  difficulty: z.number().min(1).max(5),
  address: z.string().optional(),
});

export type InsertHouse = z.infer<typeof insertHouseSchema>;

export interface PsychologicalTest {
  id: string;
  title: string;
  description: string;
  questions: TestQuestion[];
  createdAt: Date;
}

export interface TestQuestion {
  id: string;
  question: string;
  type: "multiple_choice" | "scale" | "text";
  options?: string[];
}

export const insertTestSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
});

export type InsertTest = z.infer<typeof insertTestSchema>;

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
