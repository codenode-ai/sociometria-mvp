import type {
  SociometryAggregatedEdge,
  SociometryForm,
  SociometryLink,
  SociometryResponse,
  SociometryRoleIndicator,
  SociometryNeutralIndicator,
  SociometrySnapshot,
  SupportedLanguage,
} from "@shared/schema";

export interface SociometryMockEmployee {
  id: string;
  name: string;
  role: string;
}

export const mockSociometryEmployees: SociometryMockEmployee[] = [
  { id: "employee-ana", name: "Ana Silva", role: "drive" },
  { id: "employee-maria", name: "Maria Santos", role: "help" },
  { id: "employee-julia", name: "Julia Costa", role: "help" },
  { id: "employee-carla", name: "Carla Oliveira", role: "drive" },
  { id: "employee-livia", name: "Livia Rocha", role: "support" },
  { id: "employee-patricia", name: "Patricia Lima", role: "support" },
];
const baseQuestions: SociometryForm["questions"] = [
  {
    id: "preferWorkWith",
    prompt: "Com quais colegas você gostaria de trabalhar com mais frequência?",
    helperText: "Selecione até três nomes.",
    minSelections: 1,
    maxSelections: 3,
  },
  {
    id: "avoidWorkWith",
    prompt: "Com quais colegas você evitaria trabalhar, se possível?",
    helperText: "Selecione até duas pessoas.",
    minSelections: 0,
    maxSelections: 2,
  },
  {
    id: "problemSolver",
    prompt: "Quem você considera uma pessoa que resolve problemas no time?",
    minSelections: 1,
    maxSelections: 1,
  },
  {
    id: "moodKeeper",
    prompt: "Quem você percebe como uma pessoa que mantém o clima positivo?",
    minSelections: 1,
    maxSelections: 1,
  },
  {
    id: "hardHouseFirstPick",
    prompt: "Se tivesse que escolher uma dupla para uma casa difícil, quem seria sua primeira escolha?",
    minSelections: 1,
    maxSelections: 1,
  },
];

export const mockSociometryForm: SociometryForm = {
  id: "sociometry-form-001",
  version: 1,
  title: "Sociometria trimestral",
  description: "Questionário para mapear vínculos interpessoais e preferências de trabalho.",
  questions: baseQuestions,
  defaultLanguage: "pt",
  status: "active",
  createdAt: new Date("2024-05-01T08:00:00Z"),
  updatedAt: new Date("2024-06-10T10:30:00Z"),
};

const languages: SupportedLanguage[] = ["pt", "en", "es"];

export const mockSociometryLinks: SociometryLink[] = [
  {
    id: "socio-link-ana",
    formId: mockSociometryForm.id,
    collaboratorId: "employee-ana",
    code: "SOCIO-ANA",
    status: "completed",
    url: "https://app.sociometria.dev/sociometria/SOCIO-ANA",
    language: languages[0],
    createdAt: new Date("2024-06-15T08:30:00Z"),
    completedAt: new Date("2024-06-16T12:15:00Z"),
  },
  {
    id: "socio-link-maria",
    formId: mockSociometryForm.id,
    collaboratorId: "employee-maria",
    code: "SOCIO-MARIA",
    status: "pending",
    url: "https://app.sociometria.dev/sociometria/SOCIO-MARIA",
    language: languages[0],
    createdAt: new Date("2024-06-15T08:30:00Z"),
    expiresAt: new Date("2024-06-25T23:59:59Z"),
  },
];

export const mockSociometryResponses: SociometryResponse[] = [
  {
    id: "response-ana-prefer",
    linkId: "socio-link-ana",
    collaboratorId: "employee-ana",
    formId: mockSociometryForm.id,
    questionId: "preferWorkWith",
    selections: [
      { targetEmployeeId: "employee-maria", weight: 3 },
      { targetEmployeeId: "employee-julia", weight: 2 },
      { targetEmployeeId: "employee-patricia", weight: 1 },
    ],
    createdAt: new Date("2024-06-16T12:05:00Z"),
  },
  {
    id: "response-ana-avoid",
    linkId: "socio-link-ana",
    collaboratorId: "employee-ana",
    formId: mockSociometryForm.id,
    questionId: "avoidWorkWith",
    selections: [{ targetEmployeeId: "employee-carla", weight: 1 }],
    createdAt: new Date("2024-06-16T12:06:00Z"),
  },
  {
    id: "response-ana-problem",
    linkId: "socio-link-ana",
    collaboratorId: "employee-ana",
    formId: mockSociometryForm.id,
    questionId: "problemSolver",
    selections: [{ targetEmployeeId: "employee-julia" }],
    createdAt: new Date("2024-06-16T12:10:00Z"),
  },
  {
    id: "response-ana-mood",
    linkId: "socio-link-ana",
    collaboratorId: "employee-ana",
    formId: mockSociometryForm.id,
    questionId: "moodKeeper",
    selections: [{ targetEmployeeId: "employee-maria" }],
    createdAt: new Date("2024-06-16T12:11:00Z"),
  },
  {
    id: "response-ana-hardhouse",
    linkId: "socio-link-ana",
    collaboratorId: "employee-ana",
    formId: mockSociometryForm.id,
    questionId: "hardHouseFirstPick",
    selections: [{ targetEmployeeId: "employee-julia" }],
    createdAt: new Date("2024-06-16T12:12:00Z"),
  },
];

const preferredEdges: SociometryAggregatedEdge[] = [
  { fromEmployeeId: "employee-ana", toEmployeeId: "employee-maria", weight: 6, questionId: "preferWorkWith" },
  { fromEmployeeId: "employee-ana", toEmployeeId: "employee-julia", weight: 4, questionId: "preferWorkWith" },
  { fromEmployeeId: "employee-maria", toEmployeeId: "employee-ana", weight: 5, questionId: "preferWorkWith" },
];

const avoidanceEdges: SociometryAggregatedEdge[] = [
  { fromEmployeeId: "employee-ana", toEmployeeId: "employee-carla", weight: 3, questionId: "avoidWorkWith" },
  { fromEmployeeId: "employee-julia", toEmployeeId: "employee-ana", weight: 2, questionId: "avoidWorkWith" },
];

const roleIndicators: SociometryRoleIndicator[] = [
  { employeeId: "employee-julia", role: "problemSolver", count: 4 },
  { employeeId: "employee-maria", role: "moodKeeper", count: 5 },
];

const neutralIndicators: SociometryNeutralIndicator[] = [
  { employeeId: "employee-livia", neutralityPercentage: 78, neutralPairCount: 4 },
  { employeeId: "employee-patricia", neutralityPercentage: 74, neutralPairCount: 3 },
  { employeeId: "employee-carla", neutralityPercentage: 71, neutralPairCount: 3 },
];

export const mockSociometrySnapshot: SociometrySnapshot = {
  id: "snapshot-jun-2024",
  formId: mockSociometryForm.id,
  generatedAt: new Date("2024-06-18T09:00:00Z"),
  preferredEdges,
  avoidanceEdges,
  roleIndicators,
  neutralIndicators,
};

