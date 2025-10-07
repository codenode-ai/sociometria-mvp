import {
  Assessment,
  AssessmentAssignment,
  AssessmentLink,
  AssessmentResponseSet,
  AssessmentSession,
  OptionWeight,
  PsychologicalTest,
  QuestionOption,
  ScoreBand,
  SupportedLanguage,
  TestVersionMeta,
  WeightedQuestion,
  WeightedResponse,
} from "@shared/schema";

const createOptions = (
  questionId: string,
  labels?: [string, string, string, string],
): QuestionOption[] => {
  const baseLabels =
    labels ?? [
      "Quase nunca descreve minha atuacao",
      "As vezes descreve minha atuacao",
      "Frequentemente descreve minha atuacao",
      "Quase sempre descreve minha atuacao",
    ];

  return baseLabels.map((label, index) => ({
    id: `${questionId}-opt${index + 1}`,
    label,
    weight: (index + 1) as OptionWeight,
  }));
};

const createQuestion = (
  id: string,
  prompt: string,
  dimension: string,
  helpText?: string,
  optionLabels?: [string, string, string, string],
): WeightedQuestion => ({
  id,
  prompt,
  dimension,
  helpText,
  options: createOptions(id, optionLabels),
});

const defaultBands = (low: string, medium: string, high: string): ScoreBand[] => [
  {
    id: "low",
    label: low,
    min: 10,
    max: 19,
    description: "Resultados indicam aderencia baixa a competencia analisada.",
    color: "#F97316",
  },
  {
    id: "medium",
    label: medium,
    min: 20,
    max: 29,
    description: "Resultados sugerem desenvolvimento em andamento.",
    color: "#FACC15",
  },
  {
    id: "high",
    label: high,
    min: 30,
    max: 40,
    description: "Resultados demonstram forte alinhamento ao comportamento esperado.",
    color: "#22C55E",
  },
];

const history = (
  entries: Array<{ version: number; date: string; note: string; author?: string }>,
): TestVersionMeta[] =>
  entries.map((entry) => ({
    version: entry.version,
    createdAt: new Date(entry.date),
    note: entry.note,
    author: entry.author,
  }));

const discQuestions: WeightedQuestion[] = [
  createQuestion("disc-1", "Assumo a lideranca quando o grupo precisa de direcao.", "Dominancia"),
  createQuestion("disc-2", "Gosto de negociar resultados com clareza.", "Dominancia"),
  createQuestion("disc-3", "Procuro envolver todas as pessoas nas decisoes.", "Influencia"),
  createQuestion("disc-4", "Adapto meu tom de voz conforme o contexto.", "Influencia"),
  createQuestion("disc-5", "Mantenho um ritmo constante mesmo sob pressao.", "Estabilidade"),
  createQuestion("disc-6", "Prefiro ambientes com rotina previsivel.", "Estabilidade"),
  createQuestion("disc-7", "Confiro os detalhes antes de entregar uma tarefa.", "Conformidade"),
  createQuestion("disc-8", "Sigo padroes de qualidade mesmo com prazos curtos.", "Conformidade"),
  createQuestion("disc-9", "Apoio colegas que precisam de orientacao.", "Suporte"),
  createQuestion("disc-10", "Ofereco feedbacks construtivos ao time.", "Suporte"),
];

const collaborationQuestions: WeightedQuestion[] = [
  createQuestion("col-1", "Compreendo rapidamente o papel de cada pessoa no time.", "Clareza"),
  createQuestion("col-2", "Consigo priorizar tarefas coletivas sem perder qualidade.", "Organizacao"),
  createQuestion("col-3", "Ajusto minha comunicacao conforme o perfil da equipe.", "Comunicacao"),
  createQuestion("col-4", "Aceito feedbacks e aplico melhorias logo na sequencia.", "Comunicacao"),
  createQuestion("col-5", "Percebo sinais de sobrecarga nos colegas.", "Empatia"),
  createQuestion("col-6", "Apoio quem precisa pausar sem comprometer as entregas.", "Empatia"),
  createQuestion("col-7", "Tenho planos alternativos quando algo nao sai como previsto.", "Flexibilidade"),
  createQuestion("col-8", "Aprendo rapidamente novas ferramentas.", "Flexibilidade"),
  createQuestion("col-9", "Compartilho informacoes importantes sem ser solicitado.", "Transparencia"),
  createQuestion("col-10", "Faco acordos claros sobre responsabilidades.", "Transparencia"),
];

const resilienceQuestions: WeightedQuestion[] = [
  createQuestion("res-1", "Consigo manter a calma diante de mudancas inesperadas.", "Controle"),
  createQuestion("res-2", "Transformo pressao em foco.", "Controle"),
  createQuestion("res-3", "Peco apoio quando percebo que estou sobrecarregada.", "Rede de apoio"),
  createQuestion("res-4", "Consigo desconectar do trabalho ao final do dia.", "Recuperacao"),
  createQuestion("res-5", "Aprendo algo novo com cada situacao desafiadora.", "Aprendizado"),
  createQuestion("res-6", "Identifico sinais fisicos e emocionais de estresse.", "Autoconsciencia"),
  createQuestion("res-7", "Tenho estrategias pessoais para recarregar as energias.", "Recuperacao"),
  createQuestion("res-8", "Consigo dizer nao quando necessario.", "Limites"),
  createQuestion("res-9", "Reviso processos para evitar erros futuros.", "Melhoria continua"),
  createQuestion("res-10", "Reforco acordos de forma respeitosa quando algo foge do combinado.", "Colaboracao"),
];

const defaultHistory = history([
  { version: 1, date: "2024-01-15T09:00:00Z", note: "Versao inicial" },
  { version: 2, date: "2024-03-22T10:00:00Z", note: "Ajustes nas descricoes" },
  { version: 3, date: "2024-05-05T14:30:00Z", note: "Atualizacao de interpretacoes", author: "Equipe Psicologia" },
]);

const AVAILABLE_LANGUAGES: SupportedLanguage[] = ["pt", "en", "es"];

export const mockTests: PsychologicalTest[] = [
  {
    id: "test-disc-pt",
    slug: "perfil-disc",
    language: "pt",
    availableLanguages: AVAILABLE_LANGUAGES,
    title: "Mapa DISC de Colaboracao",
    description: "Avaliacao comportamental para identificar estilos de trabalho e necessidades de apoio.",
    questions: discQuestions,
    interpretationBands: defaultBands("Baixo alinhamento", "Equilibrado", "Alta adequacao"),
    tags: ["perfil", "comportamento"],
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-05-05T14:30:00Z"),
    version: 3,
    estimatedDurationMinutes: 15,
    history: defaultHistory,
    status: "published",
  },
  {
    id: "test-collaboration-pt",
    slug: "dinamica-equipe",
    language: "pt",
    availableLanguages: AVAILABLE_LANGUAGES,
    title: "Colaboracao e Dinamica de Equipe",
    description: "Explora habilidades socioemocionais essenciais para atuacao em equipes multidisciplinares.",
    questions: collaborationQuestions,
    interpretationBands: defaultBands("Precisa de suporte", "Em desenvolvimento", "Pronto para liderar"),
    tags: ["dinamica", "equipes"],
    createdAt: new Date("2024-02-10T11:00:00Z"),
    updatedAt: new Date("2024-04-12T16:45:00Z"),
    version: 2,
    estimatedDurationMinutes: 18,
    history: history([
      { version: 1, date: "2024-02-10T11:00:00Z", note: "Versao inicial" },
      { version: 2, date: "2024-04-12T16:45:00Z", note: "Inclusao de nova dimensao de transparencia" },
    ]),
    status: "published",
  },
  {
    id: "test-resilience-pt",
    slug: "resiliencia-operacional",
    language: "pt",
    availableLanguages: AVAILABLE_LANGUAGES,
    title: "Resiliencia e Gestao do Estresse",
    description: "Mede estrategias de autocuidado e capacidade de manter performance em cenarios intensos.",
    questions: resilienceQuestions,
    interpretationBands: defaultBands("Fragil", "Atento", "Sustentado"),
    tags: ["bem-estar", "resiliencia"],
    createdAt: new Date("2024-03-05T08:30:00Z"),
    updatedAt: new Date("2024-05-25T15:10:00Z"),
    version: 1,
    estimatedDurationMinutes: 12,
    history: history([{ version: 1, date: "2024-03-05T08:30:00Z", note: "Versao inicial" }]),
    status: "published",
  },
];

const testLookup = new Map(mockTests.map((test) => [test.id, test]));

export const mockAssessmentLinks: AssessmentLink[] = [
  {
    id: "link-avaliacao-inicial",
    assessmentId: "assessment-onboarding",
    code: "onboarding-pt",
    language: "pt",
    url: "http://localhost:5173/avaliacoes/onboarding-pt",
    createdAt: new Date("2024-05-20T09:00:00Z"),
  },
  {
    id: "link-reavaliacao-es",
    assessmentId: "assessment-checkin",
    code: "checkin-es",
    language: "es",
    url: "http://localhost:5173/avaliacoes/checkin-es",
    createdAt: new Date("2024-06-02T10:15:00Z"),
    expiresAt: new Date("2024-07-01T23:59:00Z"),
  },
];

export const mockAssessments: Assessment[] = [
  {
    id: "assessment-onboarding",
    name: "Avaliacao de Integracao",
    slug: "avaliacao-integracao",
    description: "Primeiro diagnostico completo com foco em acolhimento e alinhamento de expectativas.",
    tests: [
      { testId: "test-disc-pt", testVersion: 3, order: 1 },
      { testId: "test-collaboration-pt", testVersion: 2, order: 2 },
      { testId: "test-resilience-pt", testVersion: 1, order: 3 },
    ],
    defaultLanguage: "pt",
    createdAt: new Date("2024-05-18T13:00:00Z"),
    updatedAt: new Date("2024-06-01T09:40:00Z"),
    version: 2,
    status: "published",
    history: history([
      { version: 1, date: "2024-05-18T13:00:00Z", note: "Avaliacao inicial" },
      { version: 2, date: "2024-06-01T09:40:00Z", note: "Inclusao do teste de resiliencia" },
    ]),
    metadata: {
      estimatedDurationMinutes: 45,
      tags: ["onboarding", "primeira-avaliacao"],
    },
  },
  {
    id: "assessment-checkin",
    name: "Check-in Trimestral",
    slug: "checkin-trimestral",
    description: "Combina feedback rapido com monitoramento de bem-estar e colaboracao.",
    tests: [
      { testId: "test-collaboration-pt", testVersion: 2, order: 1 },
      { testId: "test-resilience-pt", testVersion: 1, order: 2 },
    ],
    defaultLanguage: "pt",
    createdAt: new Date("2024-05-05T12:30:00Z"),
    updatedAt: new Date("2024-05-28T10:00:00Z"),
    version: 1,
    status: "draft",
    history: history([
      { version: 1, date: "2024-05-05T12:30:00Z", note: "Configuracao inicial" },
    ]),
    metadata: {
      estimatedDurationMinutes: 25,
      tags: ["checkin", "continuo"],
    },
  },
];

export const mockAssessmentAssignments: AssessmentAssignment[] = [
  {
    id: "assignment-ana-onboarding",
    assessmentId: "assessment-onboarding",
    assigneeId: "1",
    linkId: "link-avaliacao-inicial",
    language: "pt",
    status: "in_progress",
    startedAt: new Date("2024-06-03T08:05:00Z"),
    lastActivityAt: new Date("2024-06-03T08:25:00Z"),
    progress: {
      currentTestId: "test-collaboration-pt",
      currentQuestionId: "col-5",
      completedTests: ["test-disc-pt"],
      percentage: 48,
      remainingTimeMs: 18 * 60 * 1000,
    },
    attempt: 1,
  },
  {
    id: "assignment-maria-checkin",
    assessmentId: "assessment-checkin",
    assigneeId: "2",
    linkId: "link-reavaliacao-es",
    language: "es",
    status: "pending",
    progress: {
      currentTestId: undefined,
      currentQuestionId: undefined,
      completedTests: [],
      percentage: 0,
      remainingTimeMs: 25 * 60 * 1000,
    },
    attempt: 1,
    metadata: {
      lastInvitationSentAt: new Date("2024-06-10T07:30:00Z"),
    },
  },
];

const buildResponses = (testId: string, weights: OptionWeight[]): WeightedResponse[] => {
  const test = testLookup.get(testId);
  if (!test) {
    return [];
  }

  return test.questions.map((question, index) => {
    const targetWeight = weights[index % weights.length];
    const option = question.options.find((item) => item.weight === targetWeight) ?? question.options[question.options.length - 1];
    return {
      questionId: question.id,
      optionId: option.id,
      weight: option.weight,
    } satisfies WeightedResponse;
  });
};

const sessionResponses = (
  responses: Array<{ testId: string; weights: OptionWeight[]; started: string; submitted?: string }>,
): AssessmentResponseSet[] =>
  responses
    .map((entry) => {
      const startedAt = new Date(entry.started);
      const submittedAt = entry.submitted ? new Date(entry.submitted) : undefined;
      const durationMs = submittedAt ? submittedAt.getTime() - startedAt.getTime() : undefined;

      return {
        testId: entry.testId,
        responses: buildResponses(entry.testId, entry.weights),
        startedAt,
        submittedAt,
        durationMs,
      } satisfies AssessmentResponseSet;
    })
    .filter((set) => set.responses.length > 0);

export const mockAssessmentSessions: AssessmentSession[] = [
  {
    id: "session-ana-onboarding",
    assignmentId: "assignment-ana-onboarding",
    status: "active",
    startedAt: new Date("2024-06-03T08:05:00Z"),
    lastSavedAt: new Date("2024-06-03T08:25:00Z"),
    responses: sessionResponses([
      {
        testId: "test-disc-pt",
        started: "2024-06-03T08:05:00Z",
        submitted: "2024-06-03T08:17:00Z",
        weights: [3, 4, 3, 4, 2, 3, 4, 3, 4, 3],
      },
    ]),
    progress: {
      currentTestIndex: 1,
      currentQuestionIndex: 4,
    },
    timerMs: 45 * 60 * 1000,
  },
];
