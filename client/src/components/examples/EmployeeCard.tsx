import EmployeeCard from "../EmployeeCard";

export default function EmployeeCardExample() {
  const mockEmployee = {
    id: "1",
    name: "Ana Silva",
    role: "drive" as const,
    status: "active" as const,
    traits: ["organized", "leadership", "communicative", "proactive"],
  };

  const handleDelete = (id: string) => {
    console.log("Delete employee:", id);
  };

  return <EmployeeCard employee={mockEmployee} onDelete={handleDelete} />;
}
