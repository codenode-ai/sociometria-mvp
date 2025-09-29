import type { PsychologicalTest } from "@shared/schema";
import TestCard from "../TestCard";

const likertLabels: Record<number, string> = {
  1: "Discordo totalmente",
  2: "Discordo parcialmente",
  3: "Neutro",
  4: "Concordo parcialmente",
  5: "Concordo totalmente",
};

const mockTest: PsychologicalTest = {
  id: "example-test",
  slug: "example-test",
  language: "pt",
  availableLanguages: ["pt"],
  title: "Avaliacao de personalidade DISC",
  description:
    "Instrumento de referencia para mapear dominancia, influencia, estabilidade e conformidade em equipes de limpeza.",
  questions: Array.from({ length: 10 }, (_, index) => ({
    id: `q-${index + 1}`,
    prompt: `Como voce reage em situacoes de alta pressao? (${index + 1})`,
    dimension: "comportamento",
    scaleMin: 1,
    scaleMax: 5,
    labels: likertLabels,
  })),
  interpretationBands: [
    {
      id: "low",
      label: "Baixo nivel",
      min: 10,
      max: 25,
      description: "Resultados indicam oportunidade para desenvolvimento comportamental.",
      color: "#F97316",
    },
    {
      id: "medium",
      label: "Equilibrado",
      min: 26,
      max: 40,
      description: "Perfil consistente para atuacao em equipe.",
      color: "#FACC15",
    },
    {
      id: "high",
      label: "Alto nivel",
      min: 41,
      max: 50,
      description: "Exibe excelencia na dimensao analisada.",
      color: "#22C55E",
    },
  ],
  tags: ["disc", "comportamento"],
  createdAt: new Date("2024-01-15T09:00:00Z"),
  updatedAt: new Date("2024-03-10T14:00:00Z"),
  version: 1,
  estimatedDurationMinutes: 35,
  history: [
    {
      version: 1,
      createdAt: new Date("2024-01-15T09:00:00Z"),
      note: "Versao inicial",
    },
  ],
  status: "published",
};

function handleEdit(id: string) {
  console.log("Edit test:", id);
}

function handleDelete(id: string) {
  console.log("Delete test:", id);
}

export default function TestCardExample() {
  return <TestCard test={mockTest} onEdit={handleEdit} onDelete={handleDelete} />;
}
