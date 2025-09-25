import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Star } from "lucide-react";
import type { TeamRecommendation } from "@shared/schema";

interface TeamCardProps {
  team: TeamRecommendation;
  className?: string;
}

export default function TeamCard({ team, className }: TeamCardProps) {
  const { t } = useTranslation();

  const justification = t(team.justification, {
    defaultValue: team.justification,
  });

  const roleColorMap: Record<TeamRecommendation["members"][number]["role"], string> = {
    drive: "bg-blue-50 text-blue-700",
    help: "bg-green-50 text-green-700",
    support: "bg-purple-50 text-purple-700",
  };

  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${team.members.length}, minmax(0, 1fr))`,
  };

  return (
    <Card className={`hover-elevate ${className ?? ""}`} data-testid={`card-team-${team.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {t("teamCard.title")}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{team.compatibility}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4" style={gridStyle}>
          {team.members.map((member) => (
            <div key={member.id} className="space-y-2">
              <Badge variant="outline" className={roleColorMap[member.role]}>
                {t(`roles.${member.role}`)}
              </Badge>
              <p className="font-medium" data-testid={`text-member-${member.id}`}>
                {member.name}
              </p>
              <div className="flex flex-wrap gap-1">
                {member.traits.slice(0, 3).map((trait) => (
                  <Badge key={trait} variant="secondary" className="text-xs">
                    {t(`traits.${trait}`, { defaultValue: trait })}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>{t("teamCard.justification")}: </strong>
            {justification}
          </p>
        </div>

        {team.house && (
          <div className="pt-2 border-t">
            <p className="text-sm">
              <strong>{t("teamCard.suggestedHouse")}: </strong>
              {team.house.name}
              <Badge variant="outline" className="ml-2">
                {t(`houseTypes.${team.house.type}`)}
              </Badge>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

