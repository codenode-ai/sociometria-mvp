import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee } from "@shared/schema";

interface SociometryGraphProps {
  employees: Employee[];
  preferences: Record<string, string[]>;
  avoidances: Record<string, string[]>;
  className?: string;
}

export default function SociometryGraph({ employees, preferences, avoidances, className }: SociometryGraphProps) {
  const { t } = useTranslation();
  const width = 400;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 100;

  const positions = employees.map((_, index) => {
    const angle = (index / employees.length) * 2 * Math.PI;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  const getConnectionLines = () => {
    const lines: JSX.Element[] = [];

    employees.forEach((employee, fromIndex) => {
      const fromPos = positions[fromIndex];

      preferences[employee.id]?.forEach((targetId) => {
        const targetIndex = employees.findIndex((e) => e.id === targetId);
        if (targetIndex !== -1) {
          const toPos = positions[targetIndex];
          lines.push(
            <line
              key={`pref-${employee.id}-${targetId}`}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke="#10b981"
              strokeWidth="2"
              markerEnd="url(#arrowhead-green)"
            />,
          );
        }
      });

      avoidances[employee.id]?.forEach((targetId) => {
        const targetIndex = employees.findIndex((e) => e.id === targetId);
        if (targetIndex !== -1) {
          const toPos = positions[targetIndex];
          lines.push(
            <line
              key={`avoid-${employee.id}-${targetId}`}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="5,5"
              markerEnd="url(#arrowhead-red)"
            />,
          );
        }
      });
    });

    return lines;
  };

  return (
    <Card className={className} data-testid="card-sociometry-graph">
      <CardHeader>
        <CardTitle>{t("sociometryGraph.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
            </marker>
            <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
            </marker>
          </defs>

          {getConnectionLines()}

          {employees.map((employee, index) => {
            const pos = positions[index];
            const nodeColor = (
              employee.role === "drive"
                ? "#3b82f6"
                : employee.role === "help"
                ? "#10b981"
                : "#a855f7"
            );

            return (
              <g key={employee.id}>
                <circle cx={pos.x} cy={pos.y} r="20" fill={nodeColor} stroke="#fff" strokeWidth="2" />
                <text
                  x={pos.x}
                  y={pos.y + 30}
                  textAnchor="middle"
                  className="text-xs font-medium fill-current"
                  data-testid={`text-graph-employee-${employee.id}`}
                >
                  {employee.name.split(" ")[0]}
                </text>
                <text x={pos.x} y={pos.y + 42} textAnchor="middle" className="text-xs fill-muted-foreground">
                  {t(`roles.${employee.role}`)}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="mt-4 flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500" />
            <span>{t("sociometryGraph.prefers")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-0.5 bg-red-500 border-dashed border-red-500"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, #ef4444 0, #ef4444 3px, transparent 3px, transparent 8px)",
              }}
            />
            <span>{t("sociometryGraph.avoids")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
