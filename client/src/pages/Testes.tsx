import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import TestCard from "@/components/TestCard";
import AddTestModal from "@/components/AddTestModal";
import { PsychologicalTest, InsertTest } from "@shared/schema";

type LocalTest = PsychologicalTest & {
  titleKey?: string;
  descriptionKey?: string;
};

const createInitialTests = (t: (key: string, options?: Record<string, unknown>) => string): LocalTest[] => [
  {
    id: "1",
    titleKey: "tests.list.disc.title",
    descriptionKey: "tests.list.disc.description",
    title: t("tests.list.disc.title"),
    description: t("tests.list.disc.description"),
    questions: [
      { id: "1", question: "Como você se comporta em situações de pressão?", type: "multiple_choice" },
      { id: "2", question: "Qual seu nível de sociabilidade?", type: "scale" },
    ],
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    titleKey: "tests.list.teamCompatibility.title",
    descriptionKey: "tests.list.teamCompatibility.description",
    title: t("tests.list.teamCompatibility.title"),
    description: t("tests.list.teamCompatibility.description"),
    questions: [
      { id: "3", question: "Prefere liderar ou seguir instruções?", type: "multiple_choice" },
      { id: "4", question: "Como lida com mudanças de rotina?", type: "scale" },
    ],
    createdAt: new Date("2024-02-10"),
  },
  {
    id: "3",
    titleKey: "tests.list.stress.title",
    descriptionKey: "tests.list.stress.description",
    title: t("tests.list.stress.title"),
    description: t("tests.list.stress.description"),
    questions: [{ id: "5", question: "Como reage a críticas?", type: "text" }],
    createdAt: new Date("2024-03-05"),
  },
];

export default function Testes() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [tests, setTests] = useState<LocalTest[]>(() => createInitialTests(t));

  useEffect(() => {
    setTests((prev) =>
      prev.map((test) => ({
        ...test,
        title: test.titleKey ? t(test.titleKey) : test.title,
        description: test.descriptionKey ? t(test.descriptionKey) : test.description,
      })),
    );
  }, [t]);

  const filteredTests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return tests;
    }

    return tests.filter((test) => {
      const titleMatch = test.title.toLowerCase().includes(term);
      const descriptionMatch = test.description.toLowerCase().includes(term);
      return titleMatch || descriptionMatch;
    });
  }, [tests, searchTerm]);

  const handleAddTest = (newTest: InsertTest) => {
    const test: LocalTest = {
      id: Date.now().toString(),
      ...newTest,
      questions: [],
      createdAt: new Date(),
    };
    setTests((prev) => [...prev, test]);
  };

  const handleEditTest = (id: string) => {
    console.log("Edit test:", id);
  };

  const handleDeleteTest = (id: string) => {
    setTests((prev) => prev.filter((test) => test.id !== id));
    console.log("Test deleted:", id);
  };

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
            onChange={(e) => setSearchTerm(e.target.value)}
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
