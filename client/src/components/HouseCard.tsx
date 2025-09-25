import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Pencil, Trash2 } from "lucide-react";
import { House } from "@shared/schema";

interface HouseCardProps {
  house: House;
  onDelete?: (id: string) => void;
  onEdit?: (house: House) => void;
  className?: string;
}

const cleaningTypeClassMap: Record<House["cleaningType"], string> = {
  quick: "bg-green-50 text-green-700",
  standard: "bg-blue-50 text-blue-700",
  meticulous: "bg-purple-50 text-purple-700",
};

const sizeClassMap: Record<House["size"], string> = {
  small: "bg-orange-50 text-orange-700",
  medium: "bg-yellow-50 text-yellow-700",
  large: "bg-red-50 text-red-700",
};

export default function HouseCard({ house, onDelete, onEdit, className }: HouseCardProps) {
  const { t } = useTranslation();

  return (
    <Card className={`hover-elevate ${className ?? ""}`} data-testid={`card-house-${house.id}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="w-5 h-5 text-muted-foreground" />
          <span data-testid={`text-house-name-${house.id}`}>{house.name}</span>
        </CardTitle>
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(house)}
              data-testid={`button-edit-house-${house.id}`}
            >
              <span className="sr-only">{t("houses.editModal.title")}</span>
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(house.id)}
              className="text-destructive hover:text-destructive"
              data-testid={`button-delete-house-${house.id}`}
            >
              <span className="sr-only">{t("actions.delete")}</span>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={cleaningTypeClassMap[house.cleaningType]}>
            {t(`cleaningTypes.${house.cleaningType}`)}
          </Badge>
          <Badge variant="outline" className={sizeClassMap[house.size]}>
            {t(`houseSizes.${house.size}`)}
          </Badge>
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
