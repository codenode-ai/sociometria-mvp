import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, TrendingUp, Users, Clock, Award } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Relatorios() {
  // todo: remove mock functionality
  const performanceData = [
    { name: 'Ana Silva', tasks: 45, rating: 4.8 },
    { name: 'Maria Santos', tasks: 38, rating: 4.6 },
    { name: 'Carla Oliveira', tasks: 32, rating: 4.2 },
    { name: 'Júlia Costa', tasks: 41, rating: 4.7 },
    { name: 'Patricia Lima', tasks: 35, rating: 4.4 }
  ]

  const combinationData = [
    { pair: 'Ana & Maria', success: 95, color: '#10b981' },
    { pair: 'Carla & Júlia', success: 88, color: '#3b82f6' },
    { pair: 'Ana & Júlia', success: 82, color: '#8b5cf6' },
    { pair: 'Maria & Patricia', success: 79, color: '#f59e0b' }
  ]

  const statusData = [
    { name: 'Ativo', value: 20, color: '#10b981' },
    { name: 'Licença', value: 3, color: '#f59e0b' },
    { name: 'Inativo', value: 1, color: '#ef4444' }
  ]

  const mockReports = [
    {
      title: "Desempenho Individual",
      description: "Análise detalhada do desempenho de cada funcionária",
      icon: Award,
      color: "text-blue-600"
    },
    {
      title: "Eficiência de Duplas",
      description: "Relatório sobre o sucesso das combinações de duplas",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Análise Temporal",
      description: "Evolução dos indicadores ao longo do tempo", 
      icon: Clock,
      color: "text-purple-600"
    },
    {
      title: "Indicadores Gerais",
      description: "Visão geral dos principais KPIs do sistema",
      icon: TrendingUp,
      color: "text-orange-600"
    }
  ]

  const handleExportPDF = (reportType: string) => {
    console.log('Exporting PDF for:', reportType)
    // Mock PDF export
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-relatorios">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise de desempenho e eficiência das duplas
          </p>
        </div>
        <Button onClick={() => handleExportPDF('geral')} data-testid="button-export-general">
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockReports.map((report) => (
          <Card key={report.title} className="hover-elevate cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{report.title}</CardTitle>
              <report.icon className={`h-4 w-4 ${report.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{report.description}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 w-full"
                onClick={() => handleExportPDF(report.title)}
                data-testid={`button-export-${report.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Download className="w-3 h-3 mr-1" />
                Exportar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Funcionária</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasks" fill="hsl(var(--chart-1))" name="Tarefas Concluídas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Best Combinations */}
      <Card>
        <CardHeader>
          <CardTitle>Combinações que Mais Funcionaram</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {combinationData.map((combo, index) => (
              <div key={combo.pair} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: combo.color }}
                  ></div>
                  <div>
                    <p className="font-medium" data-testid={`text-combo-${index}`}>
                      {combo.pair}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Taxa de sucesso: {combo.success}%
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="secondary"
                  className={combo.success >= 90 ? "bg-green-100 text-green-700" : 
                           combo.success >= 80 ? "bg-blue-100 text-blue-700" : 
                           "bg-yellow-100 text-yellow-700"}
                >
                  {combo.success >= 90 ? "Excelente" : combo.success >= 80 ? "Bom" : "Regular"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}