import EmployeeCard from '../EmployeeCard'

export default function EmployeeCardExample() {
  // todo: remove mock functionality
  const mockEmployee = {
    id: "1",
    name: "Ana Silva",
    role: "Drive" as const,
    status: "Ativo" as const,
    traits: ["Organizada", "Liderança", "Comunicativa", "Proativa"]
  }

  const handleDelete = (id: string) => {
    console.log('Delete employee:', id)
  }

  return <EmployeeCard employee={mockEmployee} onDelete={handleDelete} />
}