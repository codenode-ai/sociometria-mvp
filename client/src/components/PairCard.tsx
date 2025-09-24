import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Star } from "lucide-react"
import { PairRecommendation } from "@shared/schema"

interface PairCardProps {
  pair: PairRecommendation
  className?: string
}

export default function PairCard({ pair, className }: PairCardProps) {
  const compatibilityColor = pair.compatibility >= 80 ? "bg-green-500" : pair.compatibility >= 60 ? "bg-yellow-500" : "bg-red-500"

  return (
    <Card className={`hover-elevate ${className}`} data-testid={`card-pair-${pair.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Dupla Recomendada
          </CardTitle>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{pair.compatibility}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Drive
            </Badge>
            <p className="font-medium" data-testid={`text-drive-${pair.drive.name}`}>
              {pair.drive.name}
            </p>
            <div className="flex flex-wrap gap-1">
              {pair.drive.traits.slice(0, 2).map((trait) => (
                <Badge key={trait} variant="secondary" className="text-xs">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Help
            </Badge>
            <p className="font-medium" data-testid={`text-help-${pair.help.name}`}>
              {pair.help.name}
            </p>
            <div className="flex flex-wrap gap-1">
              {pair.help.traits.slice(0, 2).map((trait) => (
                <Badge key={trait} variant="secondary" className="text-xs">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Justificativa:</strong> {pair.justification}
          </p>
        </div>

        {pair.house && (
          <div className="pt-2 border-t">
            <p className="text-sm">
              <strong>Casa sugerida:</strong> {pair.house.name}
              <Badge variant="outline" className="ml-2">
                {pair.house.type}
              </Badge>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}