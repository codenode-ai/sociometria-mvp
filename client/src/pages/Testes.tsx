import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import TestCard from "@/components/TestCard";
import AddTestModal from "@/components/AddTestModal";
import type { InsertTest, LikertBand, PsychologicalTest, SupportedLanguage, TestVersionMeta } from "@shared/schema";
import { mockAssessments, mockAssessmentAssignments, mockAssessmentLinks, mockAssessmentSessions, mockTests } from "@/lib/mock/test-data";
import { slugify } from "@/lib/utils";

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const createBandTranslations = (t: (key: string) => string): LikertBand[] => [
  { id: "low", label: t("tests.bands.low"), min: 10, max: 25, description: t("tests.bands.lowDescription"), color: "#F97316" },
  { id: "medium", label: t("tests.bands.medium"), min: 26, max: 40, description: t("tests.bands.mediumDescription"), color: "#FACC15" },
  { id: "high", label: t("tests.bands.high"), min: 41, max: 50, description: t("tests.bands.highDescription"), color: "#22C55E" },
];

const createHistoryEntry = (version: number, note: string): TestVersionMeta => ({
  version,
  createdAt: new Date(),
  note,
});

export default function Testes() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [tests, setTests] = useState<PsychologicalTest[]>(() => mockTests.map((test) => ({ ...test })));

  const filteredTests = useMemo(() => {
    const term = normalizeText(searchTerm);
    if (!term) {
      return tests;
    }

    return tests.filter((test) => {
      const titleMatch = normalizeText(test.title).includes(term);
      const descriptionMatch = normalizeText(test.description).includes(term);
      const tagMatch = test.tags?.some((tag) => normalizeText(tag).includes(term));
      return titleMatch || descriptionMatch || tagMatch;
    });
  }, [tests, searchTerm]);

  const handleAddTest = (newTest: InsertTest) => {
    const now = new Date();
    const title = newTest.title.trim();
    const description = newTest.description.trim();
    const slug = slugify(title) || `custom-test-${now.getTime()}`;
    const bands = createBandTranslations(t).map((band, index) => ({
      ...band,
      min: 10 + index * 15,
      max: 10 + index * 15 + 14,
    }));

    const createdTest: PsychologicalTest = {
      id: `${slug}-${now.getTime()}`,
      slug,
      language: newTest.language,
      availableLanguages: [newTest.language],
      title,
      description,
      questions: [],
      interpretationBands: bands,
      tags: ["custom"],
      createdAt: now,
      updatedAt: now,
      version: 1,
      estimatedDurationMinutes: 10,
      history: [createHistoryEntry(1, t("tests.history.createdManually"))],
      status: "draft",
    };

    setTests((prev) => [createdTest, ...prev]);
  };

  const handleEditTest = (id: string) => {
    console.log("Edit test:", id);
  };

  const handleDeleteTest = (id: string) => {
    setTests((prev) => prev.filter((test) => test.id !== id));
    console.log("Test deleted:", id);
  };

  // The following mock exports will be used in subsequent steps of the workflow.
  // They are referenced here to avoid lint warnings about unused imports during stage 1.
  void mockAssessments;
  void mockAssessmentAssignments;
  void mockAssessmentLinks;
  void mockAssessmentSessions;

  return (
    <div className="p-6 space-y-6" data-testid="page-testes">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("tests.title")}</h1>
          <p className="text-muted-foreground">{t("tests.subtitle")}</p>
        </div>
        <AddTestModal onAdd={handleAddTest} />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t("tests.searchPlaceholder")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10"
            data-testid="input-search-tests"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {t("tests.counter", { filtered: filteredTests.length, total: tests.length })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map((test) => (
          <TestCard key={test.id} test={test} onEdit={handleEditTest} onDelete={handleDeleteTest} />
        ))}
      </div>

      {filteredTests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("tests.empty")}</p>
        </div>
      )}
    </div>
  );
}

