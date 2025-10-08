
import type { OptionWeight, PsychologicalTest } from "@shared/schema";
import TestCard from "../TestCard";

const optionLabels: Record<OptionWeight, string> = {
  1: "Quase nunca descreve minha atuacao",
  2: "As vezes descreve minha atuacao",
  3: "Frequentemente descreve minha atuacao",
  4: "Quase sempre descreve minha atuacao",
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
    options: (Object.entries(optionLabels) as Array<[string, string]>).map(([weight, label]) => ({
      id: `q-${index + 1}-opt${weight}`,
      weight: Number(weight) as OptionWeight,
      label,
    })),
  })),
  interpretationBands: [
    {
      id: "low",
      label: "Baixo nivel",
      min: 10,
      max: 19,
      description: "Resultados indicam oportunidade para desenvolvimento comportamental.",
      color: "#F97316",
    },
    {
      id: "medium",
      label: "Equilibrado",
      min: 20,
      max: 29,
      description: "Perfil consistente para atuacao em equipe.",
      color: "#FACC15",
    },
    {
      id: "high",
      label: "Alto nivel",
      min: 30,
      max: 40,
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
