import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import SociometryGraph from "@/components/SociometryGraph"
import { Employee } from "@shared/schema"

export default function Sociometria() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [preferences, setPreferences] = useState<Record<string, string[]>>({})
  const [avoidances, setAvoidances] = useState<Record<string, string[]>>({})

  // todo: remove mock functionality
  const mockEmployees: Employee[] = [
    { id: "1", name: "Ana Silva", role: "Drive", status: "Ativo", traits: ["Organizada", "Liderança"] },
    { id: "2", name: "Maria Santos", role: "Help", status: "Ativo", traits: ["Detalhista", "Colaborativa"] },
    { id: "3", name: "Carla Oliveira", role: "Drive", status: "Ativo", traits: ["Proativa", "Comunicativa"] },
    { id: "4", name: "Júlia Costa", role: "Help", status: "Ativo", traits: ["Paciente", "Minuciosa"] },
    { id: "5", name: "Patricia Lima", role: "Help", status: "Ativo", traits: ["Sistemática", "Pontual"] }
  ]

  // Mock initial relationships
  const [mockPreferences] = useState<Record<string, string[]>>({
    "1": ["2", "4"],
    "2": ["1", "5"],
    "3": ["4", "5"],
    "4": ["1", "2"],
    "5": ["2", "3"]
  })

  const [mockAvoidances] = useState<Record<string, string[]>>({
    "1": ["3"],
    "3": ["1"],
    "5": ["1"]
  })

  const handlePreferenceChange = (targetId: string, checked: boolean) => {
    if (!selectedEmployee) return
    
    setPreferences(prev => {
      const current = prev[selectedEmployee] || []
      if (checked) {
        return { ...prev, [selectedEmployee]: [...current, targetId] }
      } else {
        return { ...prev, [selectedEmployee]: current.filter(id => id !== targetId) }
      }
    })
  }

  const handleAvoidanceChange = (targetId: string, checked: boolean) => {
    if (!selectedEmployee) return
    
    setAvoidances(prev => {
      const current = prev[selectedEmployee] || []
      if (checked) {
        return { ...prev, [selectedEmployee]: [...current, targetId] }
      } else {
        return { ...prev, [selectedEmployee]: current.filter(id => id !== targetId) }
      }
    })
  }

  const saveRelationships = () => {
    console.log('Saving relationships for employee:', selectedEmployee)
    console.log('Preferences:', preferences[selectedEmployee] || [])
    console.log('Avoidances:', avoidances[selectedEmployee] || [])
  }

  const strongPairs = [
    { from: "Ana Silva", to: "Maria Santos", strength: "Mútua" },
    { from: "Carla Oliveira", to: "Júlia Costa", strength: "Unilateral" }
  ]

  const problemPairs = [
    { from: "Ana Silva", to: "Carla Oliveira", issue: "Conflito de liderança" }
  ]

  return (
    <div className="p-6 space-y-6" data-testid="page-sociometria">
      <div>
        <h1 className="text-3xl font-bold">Sociometria</h1>
        <p className="text-muted-foreground">
          Analise e configure as preferências e evitações entre funcionárias
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Configurar Relacionamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employee-select">Funcionária</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder="Selecione uma funcionária" />
                </SelectTrigger>
                <SelectContent>
                  {mockEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEmployee && (
              <>
                <div>
                  <Label className="text-sm font-medium text-green-600">
                    Prefere trabalhar com:
                  </Label>
                  <div className="mt-2 space-y-2">
                    {mockEmployees
                      .filter(emp => emp.id !== selectedEmployee)
                      .map((employee) => (
                        <div key={employee.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`pref-${employee.id}`}
                            checked={(preferences[selectedEmployee] || []).includes(employee.id)}
                            onCheckedChange={(checked) => 
                              handlePreferenceChange(employee.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={`pref-${employee.id}`} className="text-sm">
                            {employee.name}
                            <Badge variant="outline" className="ml-2">
                              {employee.role}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-red-600">
                    Evita trabalhar com:
                  </Label>
                  <div className="mt-2 space-y-2">
                    {mockEmployees
                      .filter(emp => emp.id !== selectedEmployee)
                      .map((employee) => (
                        <div key={employee.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`avoid-${employee.id}`}
                            checked={(avoidances[selectedEmployee] || []).includes(employee.id)}
                            onCheckedChange={(checked) => 
                              handleAvoidanceChange(employee.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={`avoid-${employee.id}`} className="text-sm">
                            {employee.name}
                            <Badge variant="outline" className="ml-2">
                              {employee.role}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>

                <Button onClick={saveRelationships} className="w-full" data-testid="button-save-relationships">
                  Salvar Relacionamentos
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sociometry Graph */}
        <SociometryGraph 
          employees={mockEmployees}
          preferences={mockPreferences}
          avoidances={mockAvoidances}
        />
      </div>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Pares Fortes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strongPairs.map((pair, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">{pair.from} ↔ {pair.to}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    {pair.strength}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Pares Problemáticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {problemPairs.map((pair, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">{pair.from} ⚠ {pair.to}</p>
                    <p className="text-sm text-muted-foreground">{pair.issue}</p>
                  </div>
                  <Badge variant="outline" className="bg-red-100 text-red-700">
                    Evitar
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}