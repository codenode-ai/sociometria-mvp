import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { InsertTest } from "@shared/schema"

interface AddTestModalProps {
  onAdd: (test: InsertTest) => void
  trigger?: React.ReactNode
}

export default function AddTestModal({ onAdd, trigger }: AddTestModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<InsertTest>({
    title: "",
    description: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title.trim() && formData.description.trim()) {
      onAdd(formData)
      setFormData({ title: "", description: "" })
      setOpen(false)
      console.log('Teste criado:', formData)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-add-test">
            <Plus className="w-4 h-4 mr-2" />
            Novo Teste
          </Button>
        )}
      </DialogTrigger>
      <DialogContent data-testid="modal-add-test">
        <DialogHeader>
          <DialogTitle>Novo Teste Psicológico</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Avaliação de Personalidade"
              data-testid="input-test-title"
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o objetivo e metodologia do teste..."
              rows={4}
              data-testid="textarea-test-description"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" data-testid="button-submit-test">
              Criar Teste
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}