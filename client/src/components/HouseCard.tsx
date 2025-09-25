import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Star, Trash2 } from "lucide-react";
import { House } from "@shared/schema";

interface HouseCardProps {
  house: House;
  onDelete?: (id: string) => void;
  className?: string;
}

const typeColorMap: Record<House["type"], string> = {
  dynamic: "bg-red-50 text-red-700",
  standard: "bg-blue-50 text-blue-700",
  detailed: "bg-purple-50 text-purple-700",
};

export default function HouseCard({ house, onDelete, className }: HouseCardProps) {
  const { t } = useTranslation();

  const getDifficultyStars = (difficulty: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < difficulty ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));

  return (
    <Card className={`hover-elevate ${className ?? ""}`} data-testid={`card-house-${house.id}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="w-5 h-5 text-muted-foreground" />
          <span data-testid={`text-house-name-${house.id}`}>{house.name}</span>
        </CardTitle>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(house.id)}
            className="text-destructive hover:text-destructive"
            data-testid={`button-delete-house-${house.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Badge variant="outline" className={typeColorMap[house.type]}>
            {t(`houseTypes.${house.type}`)}
          </Badge>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {t("houses.card.difficulty")}
          </p>
          <div className="flex items-center gap-1">
            {getDifficultyStars(house.difficulty)}
            <span className="text-sm ml-2">({house.difficulty}/5)</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {t("houses.card.rating")}
          </p>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{house.rating.toFixed(1)}</span>
          </div>
        </div>

        {house.address && (
          <div>
            <p className="text-sm text-muted-foreground">
              <strong>{t("houses.card.address")}:</strong> {house.address}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
