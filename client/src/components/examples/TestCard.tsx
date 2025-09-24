import TestCard from '../TestCard'

export default function TestCardExample() {
  // todo: remove mock functionality
  const mockTest = {
    id: "1",
    title: "Avaliação de Personalidade DISC",
    description: "Teste para identificar perfis de personalidade baseado no modelo DISC, avaliando dominância, influência, estabilidade e conformidade.",
    questions: [
      { id: "1", question: "Como você se comporta em situações de pressão?", type: "multiple_choice" as const }
    ],
    createdAt: new Date('2024-01-15')
  }

  const handleEdit = (id: string) => {
    console.log('Edit test:', id)
  }

  const handleDelete = (id: string) => {
    console.log('Delete test:', id)
  }

  return <TestCard test={mockTest} onEdit={handleEdit} onDelete={handleDelete} />
}