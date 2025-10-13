import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { apiRequest } from "@/lib/queryClient";
import type { House, InsertHouse } from "@shared/schema";

type UpdateHousePayload = {
  id: string;
  name?: string;
  cleaningType?: House["cleaningType"];
  size?: House["size"];
  address?: string | null;
  tags?: string[];
  notes?: string | null;
};

interface UseHousesResult {
  houses: House[];
  isLoading: boolean;
  isError: boolean;
  createHouse: (input: InsertHouse) => Promise<House>;
  updateHouse: (input: UpdateHousePayload) => Promise<House>;
  deleteHouse: (id: string) => Promise<void>;
}

const HOUSES_ENDPOINT = "/api/houses";

type DbHouse = {
  id: string;
  code: string | null;
  name: string;
  cleaning_type: House["cleaningType"];
  size: House["size"];
  address: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeHouse(raw: DbHouse): House {
  return {
    id: raw.id,
    name: raw.name,
    cleaningType: raw.cleaning_type,
    size: raw.size,
    address: raw.address ?? undefined,
    tags: raw.tags ?? [],
    notes: raw.notes ?? undefined,
  } satisfies House;
}

export function useHouses(): UseHousesResult {
  const { accessToken } = useSession();
  const queryClient = useQueryClient();

  const housesQuery = useQuery<House[]>({
    queryKey: ["houses"],
    queryFn: async () => {
      const res = await apiRequest("GET", HOUSES_ENDPOINT, undefined, accessToken);
      const data = (await res.json()) as DbHouse[];
      return data.map(normalizeHouse);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: InsertHouse) => {
      const res = await apiRequest(
        "POST",
        HOUSES_ENDPOINT,
        {
          ...input,
          address: input.address ?? null,
        },
        accessToken,
      );
      const data = (await res.json()) as DbHouse;
      return normalizeHouse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["houses"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateHousePayload) => {
      const { id, ...payload } = input;
      const res = await apiRequest(
        "PUT",
        `${HOUSES_ENDPOINT}/${id}`,
        {
          ...payload,
          address: payload.address ?? null,
        },
        accessToken,
      );
      const data = (await res.json()) as DbHouse;
      return normalizeHouse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["houses"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `${HOUSES_ENDPOINT}/${id}`, undefined, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["houses"] });
    },
  });

  return {
    houses: housesQuery.data ?? [],
    isLoading: housesQuery.isLoading,
    isError: housesQuery.isError,
    createHouse: (input) => createMutation.mutateAsync(input),
    updateHouse: (input) => updateMutation.mutateAsync(input),
    deleteHouse: (id) => deleteMutation.mutateAsync(id),
  };
}
