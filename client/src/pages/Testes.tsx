import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import TestCard from "@/components/TestCard"
import AddTestModal from "@/components/AddTestModal"
import { PsychologicalTest, InsertTest } from "@shared/schema"

export default function Testes() {
  const [searchTerm, setSearchTerm] = useState("")
  
  // todo: remove mock functionality
  const [tests, setTests] = useState<PsychologicalTest[]>([
    {
      id: "1",
      title: "Avaliação de Personalidade DISC",
      description: "Teste para identificar perfis de personalidade baseado no modelo DISC, avaliando dominância, influência, estabilidade e conformidade.",
      questions: [
        { id: "1", question: "Como você se comporta em situações de pressão?", type: "multiple_choice" },
        { id: "2", question: "Qual seu nível de sociabilidade?", type: "scale" }
      ],
      createdAt: new Date('2024-01-15')
    },
    {
      id: "2",
      title: "Teste de Compatibilidade de Equipe",
      description: "Avalia a capacidade de trabalho em equipe e identificação de perfis complementares para formação de duplas eficientes.",
      questions: [
        { id: "3", question: "Prefere liderar ou seguir instruções?", type: "multiple_choice" },
        { id: "4", question: "Como lida com mudanças de rotina?", type: "scale" }
      ],
      createdAt: new Date('2024-02-10')
    },
    {
      id: "3",
      title: "Avaliação de Estresse e Resiliência", 
      description: "Mede a capacidade de lidar com situações estressantes e recuperação após adversidades.",
      questions: [
        { id: "5", question: "Como reage a críticas?", type: "text" }
      ],
      createdAt: new Date('2024-03-05')
    }
  ])

  const filteredTests = tests.filter(test => 
    test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddTest = (newTest: InsertTest) => {
    const test: PsychologicalTest = {
      id: Date.now().toString(),
      ...newTest,
      questions: [], // Empty questions array for new tests
      createdAt: new Date()
    }
    setTests(prev => [...prev, test])
  }

  const handleEditTest = (id: string) => {
    console.log('Edit test:', id)
    // In a real app, this would open an edit modal
  }

  const handleDeleteTest = (id: string) => {
    setTests(prev => prev.filter(test => test.id !== id))
    console.log('Test deleted:', id)
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-testes">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Testes Psicológicos</h1>
          <p className="text-muted-foreground">
            Gerencie testes psicológicos para avaliação de funcionárias
          </p>
        </div>
        <AddTestModal onAdd={handleAddTest} />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar testes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-tests"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredTests.length} de {tests.length} testes
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map((test) => (
          <TestCard 
            key={test.id} 
            test={test} 
            onEdit={handleEditTest}
            onDelete={handleDeleteTest}
          />
        ))}
      </div>

      {filteredTests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum teste encontrado</p>
        </div>
      )}
    </div>
  )
}