import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { InsertHouse } from "@shared/schema"

interface AddHouseModalProps {
  onAdd: (house: InsertHouse) => void
  trigger?: React.ReactNode
}

export default function AddHouseModal({ onAdd, trigger }: AddHouseModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<InsertHouse>({
    name: "",
    type: "Padrão",
    difficulty: 3,
    address: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim()) {
      onAdd(formData)
      setFormData({ name: "", type: "Padrão", difficulty: 3, address: "" })
      setOpen(false)
      console.log('Casa adicionada:', formData)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-add-house">
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Casa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent data-testid="modal-add-house">
        <DialogHeader>
          <DialogTitle>Nova Casa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="houseName">Nome/ID</Label>
            <Input
              id="houseName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Casa Silva, Apto 101"
              data-testid="input-house-name"
            />
          </div>
          <div>
            <Label htmlFor="houseType">Tipo</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: "Dinâmica" | "Padrão" | "Detalhista") => 
                setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger data-testid="select-house-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Padrão">Padrão</SelectItem>
                <SelectItem value="Dinâmica">Dinâmica</SelectItem>
                <SelectItem value="Detalhista">Detalhista</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="difficulty">Nível de Exigência (1-5)</Label>
            <Select 
              value={formData.difficulty.toString()} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: parseInt(value) as 1 | 2 | 3 | 4 | 5 }))}
            >
              <SelectTrigger data-testid="select-house-difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Muito Fácil</SelectItem>
                <SelectItem value="2">2 - Fácil</SelectItem>
                <SelectItem value="3">3 - Médio</SelectItem>
                <SelectItem value="4">4 - Difícil</SelectItem>
                <SelectItem value="5">5 - Muito Difícil</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="address">Endereço (Opcional)</Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Endereço da casa"
              data-testid="input-house-address"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" data-testid="button-submit-house">
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}