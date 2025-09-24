import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import EmployeeCard from "@/components/EmployeeCard"
import AddEmployeeModal from "@/components/AddEmployeeModal"
import { Employee, InsertEmployee } from "@shared/schema"

export default function Funcionarias() {
  const [searchTerm, setSearchTerm] = useState("")
  
  // todo: remove mock functionality  
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: "1",
      name: "Ana Silva",
      role: "Drive",
      status: "Ativo",
      traits: ["Organizada", "Liderança", "Comunicativa", "Proativa"],
      preferences: ["2", "4"],
      avoidances: ["3"]
    },
    {
      id: "2",
      name: "Maria Santos", 
      role: "Help",
      status: "Ativo",
      traits: ["Detalhista", "Colaborativa", "Paciente", "Confiável"]
    },
    {
      id: "3",
      name: "Carla Oliveira",
      role: "Drive", 
      status: "Licença",
      traits: ["Energética", "Criativa", "Flexível"]
    },
    {
      id: "4",
      name: "Júlia Costa",
      role: "Help",
      status: "Ativo",
      traits: ["Minuciosa", "Responsável", "Analítica"]
    },
    {
      id: "5",
      name: "Patricia Lima",
      role: "Help",
      status: "Inativo",
      traits: ["Sistemática", "Pontual", "Discreta"]
    }
  ])

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.traits.some(trait => trait.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleAddEmployee = (newEmployee: InsertEmployee) => {
    const employee: Employee = {
      id: Date.now().toString(),
      ...newEmployee,
      status: "Ativo",
      traits: newEmployee.role === "Drive" ? ["Liderança", "Comunicativa"] : ["Colaborativa", "Confiável"]
    }
    setEmployees(prev => [...prev, employee])
  }

  const handleDeleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id))
    console.log('Employee deleted:', id)
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-funcionarias">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Funcionárias</h1>
          <p className="text-muted-foreground">
            Gerencie o cadastro e perfis das funcionárias
          </p>
        </div>
        <AddEmployeeModal onAdd={handleAddEmployee} />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar funcionárias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-employees"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredEmployees.length} de {employees.length} funcionárias
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <EmployeeCard 
            key={employee.id} 
            employee={employee} 
            onDelete={handleDeleteEmployee}
          />
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma funcionária encontrada</p>
        </div>
      )}
    </div>
  )
}