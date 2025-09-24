import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Edit, Trash2 } from "lucide-react"
import { PsychologicalTest } from "@shared/schema"

interface TestCardProps {
  test: PsychologicalTest
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}

export default function TestCard({ test, onEdit, onDelete, className }: TestCardProps) {
  return (
    <Card className={`hover-elevate ${className}`} data-testid={`card-test-${test.id}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <span data-testid={`text-test-title-${test.id}`}>{test.title}</span>
        </CardTitle>
        <div className="flex gap-1">
          {onEdit && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit(test.id)}
              data-testid={`button-edit-test-${test.id}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete(test.id)}
              className="text-destructive hover:text-destructive"
              data-testid={`button-delete-test-${test.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground" data-testid={`text-test-description-${test.id}`}>
          {test.description}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {test.questions.length} pergunta{test.questions.length !== 1 ? 's' : ''}
          </span>
          <span className="text-muted-foreground">
            Criado em {test.createdAt.toLocaleDateString('pt-BR')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}