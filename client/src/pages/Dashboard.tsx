import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Users, Building2, FileText } from "lucide-react";
import TeamCard from "@/components/TeamCard";
import type { TeamRecommendation } from "@shared/schema";

const stats = [
  { titleKey: "dashboard.stats.activeEmployees", value: "24", icon: Users, color: "text-blue-600", href: "/funcionarias" },
  { titleKey: "dashboard.stats.registeredHouses", value: "18", icon: Building2, color: "text-green-600", href: "/casas" },
  { titleKey: "dashboard.stats.availableTests", value: "5", icon: FileText, color: "text-purple-600", href: "/testes" },
] as const;

const teamRecommendations: TeamRecommendation[] = [
  {
    id: "1",
    members: [
      {
        id: "1",
        name: "Ana Silva",
        role: "drive",
        status: "active",
        traits: ["organized", "leadership"],
      },
      {
        id: "2",
        name: "Maria Santos",
        role: "help",
        status: "active",
        traits: ["detailOriented", "collaborative"],
      },
      {
        id: "6",
        name: "Lívia Rocha",
        role: "support",
        status: "active",
        traits: ["trustworthy", "patient"],
      },
    ],
    compatibility: 89,
    justification: "dashboard.recommendations.justification1",
  },
  {
    id: "2",
    members: [
      {
        id: "3",
        name: "Carla Oliveira",
        role: "drive",
        status: "active",
        traits: ["proactive", "communicative"],
      },
      {
        id: "4",
        name: "Júlia Costa",
        role: "help",
        status: "active",
        traits: ["patient", "meticulous"],
      },
      {
        id: "5",
        name: "Patricia Lima",
        role: "support",
        status: "active",
        traits: ["systematic", "punctual"],
      },
    ],
    compatibility: 93,
    justification: "dashboard.recommendations.justification2",
    house: {
      id: "1",
      name: "Residência Executiva",
      type: "detailed",
      difficulty: 5,
      rating: 4.9,
    },
  },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [teams] = useState<TeamRecommendation[]>(teamRecommendations);

  const handleGenerateNew = () => {
    setIsGenerating(true);
    setTimeout(() => {
      console.log("Generating new team recommendations");
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("navigation.dashboard")}</h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
        <Button
          onClick={handleGenerateNew}
          disabled={isGenerating}
          data-testid="button-generate-teams"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
          {isGenerating ? t("actions.generatingTeams") : t("actions.generateTeams")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link key={stat.titleKey} href={stat.href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            <Card className="hover-elevate h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t(stat.titleKey)}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`stat-${stat.titleKey.split(".").pop()}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">{t("dashboard.recommendedTeams")}</h2>
          <Badge variant="secondary">
            {t("dashboard.suggestions", { count: teams.length })}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      </div>
    </div>
  );
}
