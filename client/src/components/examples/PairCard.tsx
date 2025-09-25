import TeamCard from "../TeamCard";

export default function TeamCardExample() {
  const mockTeam = {
    id: "1",
    members: [
      {
        id: "1",
        name: "Ana Silva",
        role: "drive" as const,
        status: "active" as const,
        traits: ["organized", "leadership"],
      },
      {
        id: "2",
        name: "Maria Santos",
        role: "help" as const,
        status: "active" as const,
        traits: ["detailOriented", "collaborative"],
      },
      {
        id: "3",
        name: "Lívia Rocha",
        role: "support" as const,
        status: "active" as const,
        traits: ["trustworthy", "collaborative"],
      },
    ],
    compatibility: 87,
    justification: "dashboard.recommendations.justification1",
    house: {
      id: "1",
      name: "Casa Premium",
      type: "detailed" as const,
      difficulty: 4,
      rating: 4.8,
    },
  };

  return <TeamCard team={mockTeam} />;
}
