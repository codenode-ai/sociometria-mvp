import type { LikertBand } from "@shared/schema";

export function createDefaultInterpretationBands(t: (key: string) => string): LikertBand[] {
  return [
    {
      id: "low",
      label: t("tests.bands.low"),
      min: 10,
      max: 25,
      description: t("tests.bands.lowDescription"),
      color: "#F97316",
    },
    {
      id: "medium",
      label: t("tests.bands.medium"),
      min: 26,
      max: 40,
      description: t("tests.bands.mediumDescription"),
      color: "#FACC15",
    },
    {
      id: "high",
      label: t("tests.bands.high"),
      min: 41,
      max: 50,
      description: t("tests.bands.highDescription"),
      color: "#22C55E",
    },
  ];
}

export function getLikertLabels(t: (key: string) => string): Record<number, string> {
  return {
    1: t("tests.builder.likertLabels.1"),
    2: t("tests.builder.likertLabels.2"),
    3: t("tests.builder.likertLabels.3"),
    4: t("tests.builder.likertLabels.4"),
    5: t("tests.builder.likertLabels.5"),
  };
}
