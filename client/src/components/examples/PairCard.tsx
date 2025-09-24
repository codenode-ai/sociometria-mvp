import PairCard from '../PairCard'

export default function PairCardExample() {
  // todo: remove mock functionality
  const mockPair = {
    id: "1",
    drive: {
      id: "1",
      name: "Ana Silva",
      role: "Drive" as const,
      status: "Ativo" as const,
      traits: ["Organizada", "Liderança"]
    },
    help: {
      id: "2", 
      name: "Maria Santos",
      role: "Help" as const,
      status: "Ativo" as const,
      traits: ["Detalhista", "Colaborativa"]
    },
    compatibility: 87,
    justification: "Ambas possuem perfis complementares de organização e atenção aos detalhes, com boa sinergia de comunicação.",
    house: {
      id: "1",
      name: "Casa Premium",
      type: "Detalhista" as const,
      difficulty: 4,
      rating: 4.8
    }
  }

  return <PairCard pair={mockPair} />
}