import { z } from "zod";

// Funcionária (Employee) types
export interface Employee {
  id: string;
  name: string;
  role: "Drive" | "Help";
  status: "Ativo" | "Inativo" | "Licença";
  traits: string[];
  preferences?: string[];
  avoidances?: string[];
}

export const insertEmployeeSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z.enum(["Drive", "Help"]),
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

// Casa (House) types
export interface House {
  id: string;
  name: string;
  type: "Dinâmica" | "Padrão" | "Detalhista";
  difficulty: 1 | 2 | 3 | 4 | 5;
  rating: number;
  address?: string;
}

export const insertHouseSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  type: z.enum(["Dinâmica", "Padrão", "Detalhista"]),
  difficulty: z.number().min(1).max(5),
  address: z.string().optional(),
});

export type InsertHouse = z.infer<typeof insertHouseSchema>;

// Test types
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

// Pair recommendation types
export interface PairRecommendation {
  id: string;
  drive: Employee;
  help: Employee;
  compatibility: number;
  justification: string;
  house?: House;
}

// Sociometry types
export interface SociometryData {
  employeeId: string;
  preferences: string[];
  avoidances: string[];
}

// Report types
export interface PerformanceReport {
  employeeId: string;
  employeeName: string;
  completedTasks: number;
  averageRating: number;
  bestPartner?: string;
  improvement: "Alta" | "Média" | "Baixa";
}
