import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, LayoutGrid, List as ListIcon, Pencil, Trash2 } from "lucide-react";
import HouseCard from "@/components/HouseCard";
import AddHouseModal from "@/components/AddHouseModal";
import EditHouseDialog from "@/components/EditHouseDialog";
import type { House, InsertHouse } from "@shared/schema";
import { useHouses } from "@/hooks/useHouses";
import { useToast } from "@/hooks/use-toast";

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

type ViewMode = "cards" | "list";

export default function Casas() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { houses, isLoading, isError, createHouse, updateHouse, deleteHouse } = useHouses();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const filteredHouses = useMemo(() => {
    const term = searchTerm.trim();
    if (!term) {
      return houses;
    }

    const normalizedTerm = normalizeText(term);
    return houses.filter((house) => {
      const nameMatch = normalizeText(house.name).includes(normalizedTerm);
      const cleaningMatch = normalizeText(t(`cleaningTypes.${house.cleaningType}`)).includes(normalizedTerm);
      const sizeMatch = normalizeText(t(`houseSizes.${house.size}`)).includes(normalizedTerm);
      const addressMatch = house.address ? normalizeText(house.address).includes(normalizedTerm) : false;
      return nameMatch || cleaningMatch || sizeMatch || addressMatch;
    });
  }, [houses, searchTerm, t]);

  const handleAddHouse = async (newHouse: InsertHouse) => {
    try {
      await createHouse({
        ...newHouse,
        address: newHouse.address?.trim() ? newHouse.address.trim() : undefined,
      });
      toast({
        title: t("houses.toast.created.title", { defaultValue: "Casa cadastrada" }),
        description: t("houses.toast.created.description", {
          name: newHouse.name,
          defaultValue: "Cadastro concluido com sucesso",
        }),
      });
    } catch (error) {
      toast({
        title: t("errors.genericTitle", { defaultValue: "Algo deu errado" }),
        description: t("houses.toast.created.error", { defaultValue: "Nao foi possivel cadastrar a casa" }),
        variant: "destructive",
      });
    }
  };

  const handleDeleteHouse = async (house: House) => {
    try {
      await deleteHouse(house.id);
      toast({
        title: t("houses.toast.deleted.title", { defaultValue: "Casa removida" }),
        description: t("houses.toast.deleted.description", {
          name: house.name,
          defaultValue: "Removida com sucesso",
        }),
      });
    } catch (error) {
      toast({
        title: t("errors.genericTitle", { defaultValue: "Algo deu errado" }),
        description: t("houses.toast.deleted.error", { defaultValue: "Nao foi possivel remover a casa" }),
        variant: "destructive",
      });
    }
  };

  const handleEditRequest = (house: House) => {
    setEditingHouse(house);
    setIsEditOpen(true);
  };

  const handleEditSave = async (update: {
    id: string;
    name: string;
    cleaningType: House["cleaningType"];
    size: House["size"];
    address?: string;
  }) => {
    try {
      await updateHouse({
        id: update.id,
        name: update.name.trim(),
        cleaningType: update.cleaningType,
        size: update.size,
        address: update.address?.trim() ? update.address.trim() : undefined,
      });
      toast({
        title: t("houses.toast.updated.title", { defaultValue: "Casa atualizada" }),
        description: t("houses.toast.updated.description", {
          name: update.name,
          defaultValue: "Alteracoes salvas com sucesso",
        }),
      });
      setIsEditOpen(false);
      setEditingHouse(null);
    } catch (error) {
      toast({
        title: t("errors.genericTitle", { defaultValue: "Algo deu errado" }),
        description: t("houses.toast.updated.error", { defaultValue: "Nao foi possivel atualizar a casa" }),
        variant: "destructive",
      });
    }
  };

  const handleEditOpenChange = (open: boolean) => {
    setIsEditOpen(open);
    if (!open) {
      setEditingHouse(null);
    }
  };

  const handleViewModeChange = (mode: string) => {
    if (mode === "cards" || mode === "list") {
      setViewMode(mode);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6" data-testid="page-casas-loading">
        <p className="text-muted-foreground">
          {t("houses.loading", { defaultValue: "Carregando casas..." })}
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6" data-testid="page-casas-error">
        <p className="text-destructive">
          {t("houses.error", { defaultValue: "Nao foi possivel carregar as casas" })}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-casas">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("houses.title")}</h1>
          <p className="text-muted-foreground">{t("houses.subtitle")}</p>
        </div>
        <AddHouseModal onAdd={handleAddHouse} />
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder={t("houses.searchPlaceholder")}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
              data-testid="input-search-houses"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {t("houses.counter", { filtered: filteredHouses.length, total: houses.length })}
          </div>
        </div>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={handleViewModeChange}
          variant="outline"
          size="sm"
          aria-label={t("houses.viewModes.aria")}
        >
          <ToggleGroupItem value="cards" aria-label={t("houses.viewModes.cards")} data-testid="toggle-view-cards">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">{t("houses.viewModes.cards")}</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label={t("houses.viewModes.list")} data-testid="toggle-view-list">
            <ListIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t("houses.viewModes.list")}</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredHouses.map((house) => (
            <HouseCard
              key={house.id}
              house={house}
              onDelete={(id) => {
                const target = houses.find((item) => item.id === id);
                if (target) {
                  void handleDeleteHouse(target);
                }
              }}
              onEdit={handleEditRequest}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("houses.list.headers.name")}</TableHead>
                <TableHead>{t("houses.list.headers.cleaningType")}</TableHead>
                <TableHead>{t("houses.list.headers.size")}</TableHead>
                <TableHead>{t("houses.list.headers.address")}</TableHead>
                <TableHead className="text-right">{t("houses.list.headers.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHouses.map((house) => (
                <TableRow key={house.id} data-testid={`row-house-${house.id}`}>
                  <TableCell>
                    <div className="font-semibold">{house.name}</div>
                  </TableCell>
                  <TableCell>{t(`cleaningTypes.${house.cleaningType}`)}</TableCell>
                  <TableCell>{t(`houseSizes.${house.size}`)}</TableCell>
                  <TableCell>{house.address ?? "--"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditRequest(house)}
                        data-testid={`button-edit-house-${house.id}`}
                      >
                        <span className="sr-only">{t("houses.editModal.title")}</span>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteHouse(house)}
                        data-testid={`button-delete-house-${house.id}`}
                      >
                        <span className="sr-only">{t("actions.delete")}</span>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {filteredHouses.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">{t("houses.empty")}</p>
        </div>
      )}

      <EditHouseDialog
        house={editingHouse}
        open={isEditOpen}
        onOpenChange={handleEditOpenChange}
        onSave={handleEditSave}
      />
    </div>
  );
}
