import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import HouseCard from "@/components/HouseCard"
import AddHouseModal from "@/components/AddHouseModal"
import { House, InsertHouse } from "@shared/schema"

export default function Casas() {
  const [searchTerm, setSearchTerm] = useState("")
  
  // todo: remove mock functionality
  const [houses, setHouses] = useState<House[]>([
    {
      id: "1",
      name: "Casa Premium",
      type: "Detalhista",
      difficulty: 4,
      rating: 4.8,
      address: "Rua das Flores, 123 - Vila Rica"
    },
    {
      id: "2", 
      name: "Residência Executiva",
      type: "Detalhista",
      difficulty: 5,
      rating: 4.9,
      address: "Av. Principal, 456 - Centro"
    },
    {
      id: "3",
      name: "Casa Família Silva",
      type: "Padrão",
      difficulty: 2,
      rating: 4.2,
      address: "Rua Tranquila, 789 - Bairro Novo"
    },
    {
      id: "4",
      name: "Cobertura Moderna",
      type: "Dinâmica", 
      difficulty: 3,
      rating: 4.5
    },
    {
      id: "5",
      name: "Apartamento Compacto",
      type: "Padrão",
      difficulty: 1,
      rating: 4.0
    }
  ])

  const filteredHouses = houses.filter(house => 
    house.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    house.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    house.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddHouse = (newHouse: InsertHouse) => {
    const house: House = {
      id: Date.now().toString(),
      ...newHouse,
      rating: 4.0 // Default rating for new houses
    }
    setHouses(prev => [...prev, house])
  }

  const handleDeleteHouse = (id: string) => {
    setHouses(prev => prev.filter(house => house.id !== id))
    console.log('House deleted:', id)
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-casas">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Casas</h1>
          <p className="text-muted-foreground">
            Gerencie o cadastro de casas e suas características
          </p>
        </div>
        <AddHouseModal onAdd={handleAddHouse} />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar casas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-houses"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredHouses.length} de {houses.length} casas
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHouses.map((house) => (
          <HouseCard 
            key={house.id} 
            house={house} 
            onDelete={handleDeleteHouse}
          />
        ))}
      </div>

      {filteredHouses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma casa encontrada</p>
        </div>
      )}
    </div>
  )
}