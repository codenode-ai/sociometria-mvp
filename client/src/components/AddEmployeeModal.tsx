import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { InsertEmployee } from "@shared/schema"

interface AddEmployeeModalProps {
  onAdd: (employee: InsertEmployee) => void
  trigger?: React.ReactNode
}

export default function AddEmployeeModal({ onAdd, trigger }: AddEmployeeModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<InsertEmployee>({
    name: "",
    role: "Help"
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim()) {
      onAdd(formData)
      setFormData({ name: "", role: "Help" })
      setOpen(false)
      console.log('Funcionária adicionada:', formData)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-add-employee">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Funcionária
          </Button>
        )}
      </DialogTrigger>
      <DialogContent data-testid="modal-add-employee">
        <DialogHeader>
          <DialogTitle>Nova Funcionária</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome da funcionária"
              data-testid="input-employee-name"
            />
          </div>
          <div>
            <Label htmlFor="role">Papel</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: "Drive" | "Help") => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger data-testid="select-employee-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Help">Help</SelectItem>
                <SelectItem value="Drive">Drive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" data-testid="button-submit-employee">
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}