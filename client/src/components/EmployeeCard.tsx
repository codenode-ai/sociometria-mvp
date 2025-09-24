import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Trash2 } from "lucide-react"
import { Employee } from "@shared/schema"

interface EmployeeCardProps {
  employee: Employee
  onDelete?: (id: string) => void
  className?: string
}

export default function EmployeeCard({ employee, onDelete, className }: EmployeeCardProps) {
  const statusColor = employee.status === "Ativo" ? "bg-green-100 text-green-800" : 
                     employee.status === "Inativo" ? "bg-red-100 text-red-800" : 
                     "bg-yellow-100 text-yellow-800"

  const roleColor = employee.role === "Drive" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"

  return (
    <Card className={`hover-elevate ${className}`} data-testid={`card-employee-${employee.id}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-muted-foreground" />
          <span data-testid={`text-employee-name-${employee.id}`}>{employee.name}</span>
        </CardTitle>
        {onDelete && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onDelete(employee.id)}
            className="text-destructive hover:text-destructive"
            data-testid={`button-delete-employee-${employee.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Badge variant="outline" className={roleColor}>
            {employee.role}
          </Badge>
          <Badge variant="secondary" className={statusColor}>
            {employee.status}
          </Badge>
        </div>
        
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Traços Principais:</p>
          <div className="flex flex-wrap gap-1">
            {employee.traits.map((trait) => (
              <Badge key={trait} variant="outline" className="text-xs">
                {trait}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}