
import type { OptionWeight, PsychologicalTest, ScoreBand, WeightedResponse } from "@shared/schema";

export const OPTION_WEIGHT_VALUES: OptionWeight[] = [1, 2, 3, 4];

export function createDefaultInterpretationBands(t: (key: string) => string): ScoreBand[] {
  return [
    {
      id: "low",
      label: t("tests.bands.low"),
      min: 10,
      max: 19,
      description: t("tests.bands.lowDescription"),
      color: "#F97316",
    },
    {
      id: "medium",
      label: t("tests.bands.medium"),
      min: 20,
      max: 29,
      description: t("tests.bands.mediumDescription"),
      color: "#FACC15",
    },
    {
      id: "high",
      label: t("tests.bands.high"),
      min: 30,
      max: 40,
      description: t("tests.bands.highDescription"),
      color: "#22C55E",
    },
  ];
}

export function getOptionLabels(t: (key: string) => string): Record<OptionWeight, string> {
  return {
    1: t("tests.builder.optionLabels.1"),
    2: t("tests.builder.optionLabels.2"),
    3: t("tests.builder.optionLabels.3"),
    4: t("tests.builder.optionLabels.4"),
  } as Record<OptionWeight, string>;
}

export function calculateRawScore(responses: WeightedResponse[]): number {
  return responses.reduce((total, response) => total + response.weight, 0);
}

export function calculateNormalizedScore(rawScore: number, answeredCount: number): number {
  if (answeredCount <= 0) {
    return 0;
  }

  const minPossible = answeredCount * OPTION_WEIGHT_VALUES[0];
  const maxPossible = answeredCount * OPTION_WEIGHT_VALUES[OPTION_WEIGHT_VALUES.length - 1];
  if (maxPossible === minPossible) {
    return 0;
  }

  const normalized = ((rawScore - minPossible) / (maxPossible - minPossible)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

export function summarizeTestScore(test: PsychologicalTest, responses: WeightedResponse[]) {
  const responseMap = new Map(responses.map((response) => [response.questionId, response.weight]));
  const answeredWeights: number[] = [];

  test.questions.forEach((question) => {
    const weight = responseMap.get(question.id);
    if (typeof weight === "number") {
      answeredWeights.push(weight);
    }
  });

  const answeredCount = answeredWeights.length;
  const rawScore = answeredWeights.reduce((total, weight) => total + weight, 0);
  const minTheoretical = test.questions.length * OPTION_WEIGHT_VALUES[0];
  const maxTheoretical = test.questions.length * OPTION_WEIGHT_VALUES[OPTION_WEIGHT_VALUES.length - 1];

  return {
    rawScore,
    normalizedScore: calculateNormalizedScore(rawScore, answeredCount),
    answeredCount,
    totalQuestions: test.questions.length,
    minTheoretical,
    maxTheoretical,
  };
}

export function findScoreBand(bands: ScoreBand[], value: number): ScoreBand | undefined {
  return bands.find((band) => value >= band.min && value <= band.max);
}
