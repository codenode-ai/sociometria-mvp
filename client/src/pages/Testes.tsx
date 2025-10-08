import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eraser, Plus, Search } from "lucide-react";
import TestCard from "@/components/TestCard";
import { useTests } from "@/hooks/useTests";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export default function Testes() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { tests, deleteTest } = useTests();
  const { currentUser } = useSession();
  const canManageInstruments = currentUser.role === "psychologist";
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleEditTest = (id: string) => {
    if (!canManageInstruments) {
      return;
    }
    navigate(`/testes/${id}/editar`);
  };

  const handleDeleteTest = (id: string) => {
    if (!canManageInstruments) {
      return;
    }
    const test = tests.find((item) => item.id === id);
    deleteTest(id);
    toast({
      title: t("tests.listing.toastDeleted.title"),
      description: test ? t("tests.listing.toastDeleted.description", { title: test.title }) : undefined,
    });
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-testes">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("tests.title")}</h1>
          <p className="text-muted-foreground">{t("tests.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSearchTerm("")}>
            <Eraser className="w-4 h-4 mr-2" />
            {t("tests.actions.clearFilters")}
          </Button>
          {canManageInstruments ? (
            <Button asChild data-testid="button-create-test">
              <Link href="/testes/novo" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {t("actions.addTest")}
              </Link>
            </Button>
          ) : null}
        </div>
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
          <TestCard
            key={test.id}
            test={test}
            canManage={canManageInstruments}
            viewHref={!canManageInstruments ? `/testes/${test.id}` : undefined}
            onEdit={handleEditTest}
            onDelete={handleDeleteTest}
          />
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
