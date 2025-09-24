import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Users, Building2, FileText, TrendingUp } from "lucide-react"
import PairCard from "@/components/PairCard"
import { PairRecommendation } from "@shared/schema"

export default function Dashboard() {
  const [isGenerating, setIsGenerating] = useState(false)
  
  // todo: remove mock functionality
  const [recommendations, setRecommendations] = useState<PairRecommendation[]>([
    {
      id: "1",
      drive: {
        id: "1",
        name: "Ana Silva",
        role: "Drive",
        status: "Ativo",
        traits: ["Organizada", "Liderança"]
      },
      help: {
        id: "2",
        name: "Maria Santos",
        role: "Help",
        status: "Ativo",
        traits: ["Detalhista", "Colaborativa"]
      },
      compatibility: 87,
      justification: "Ambas possuem perfis complementares de organização e atenção aos detalhes, com boa sinergia de comunicação."
    },
    {
      id: "2", 
      drive: {
        id: "3",
        name: "Carla Oliveira",
        role: "Drive",
        status: "Ativo",
        traits: ["Proativa", "Comunicativa"]
      },
      help: {
        id: "4",
        name: "Júlia Costa",
        role: "Help",
        status: "Ativo",
        traits: ["Paciente", "Minuciosa"]
      },
      compatibility: 92,
      justification: "Excelente complementaridade entre liderança proativa e execução detalhista, histórico de trabalhos bem-sucedidos.",
      house: {
        id: "1",
        name: "Residência Executiva",
        type: "Detalhista",
        difficulty: 5,
        rating: 4.9
      }
    }
  ])

  const mockStats = [
    { title: "Funcionárias Ativas", value: "24", icon: Users, color: "text-blue-600" },
    { title: "Casas Cadastradas", value: "18", icon: Building2, color: "text-green-600" },
    { title: "Testes Disponíveis", value: "5", icon: FileText, color: "text-purple-600" },
    { title: "Taxa de Sucesso", value: "94%", icon: TrendingUp, color: "text-orange-600" }
  ]

  const handleGenerateNew = () => {
    setIsGenerating(true)
    // Simulate API call
    setTimeout(() => {
      console.log('Generating new pair recommendations')
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Sistema inteligente de formação de duplas baseado em perfis psicológicos
          </p>
        </div>
        <Button 
          onClick={handleGenerateNew}
          disabled={isGenerating}
          data-testid="button-generate-pairs"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Gerando...' : 'Gerar Novas Duplas'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockStats.map((stat) => (
          <Card key={stat.title} className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommended Pairs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Duplas Recomendadas</h2>
          <Badge variant="secondary">{recommendations.length} sugestões</Badge>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recommendations.map((pair) => (
            <PairCard key={pair.id} pair={pair} />
          ))}
        </div>
      </div>
    </div>
  )
}