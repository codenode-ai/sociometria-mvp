import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { apiRequest } from "@/lib/queryClient";
import type { Employee, InsertEmployee } from "@shared/schema";

type UpdateEmployeePayload = {
  id: string;
  name?: string;
  role?: Employee["role"];
  status?: Employee["status"];
  traits?: string[];
  preferences?: string[];
  avoidances?: string[];
  notes?: string | null;
};

interface UseEmployeesResult {
  employees: Employee[];
  isLoading: boolean;
  isError: boolean;
  createEmployee: (input: InsertEmployee) => Promise<Employee>;
  updateEmployee: (input: UpdateEmployeePayload) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<void>;
}

const EMPLOYEES_ENDPOINT = "/api/employees";

type DbEmployee = {
  id: string;
  code: string | null;
  name: string;
  role: Employee["role"];
  status: Employee["status"];
  traits: string[] | null;
  preferences: string[] | null;
  avoidances: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeEmployee(raw: DbEmployee): Employee {
  return {
    id: raw.id,
    name: raw.name,
    role: raw.role,
    status: raw.status,
    traits: raw.traits ?? [],
    preferences: raw.preferences ?? [],
    avoidances: raw.avoidances ?? [],
    notes: raw.notes ?? undefined,
  } satisfies Employee;
}

export function useEmployees(): UseEmployeesResult {
  const { accessToken } = useSession();
  const queryClient = useQueryClient();

  const employeesQuery = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await apiRequest("GET", EMPLOYEES_ENDPOINT, undefined, accessToken);
      const data = (await res.json()) as DbEmployee[];
      return data.map(normalizeEmployee);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: InsertEmployee) => {
      const res = await apiRequest("POST", EMPLOYEES_ENDPOINT, input, accessToken);
      const data = (await res.json()) as DbEmployee;
      return normalizeEmployee(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateEmployeePayload) => {
      const { id, ...payload } = input;
      const res = await apiRequest("PUT", `${EMPLOYEES_ENDPOINT}/${id}`, payload, accessToken);
      const data = (await res.json()) as DbEmployee;
      return normalizeEmployee(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `${EMPLOYEES_ENDPOINT}/${id}`, undefined, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  return {
    employees: employeesQuery.data ?? [],
    isLoading: employeesQuery.isLoading,
    isError: employeesQuery.isError,
    createEmployee: (input) => createMutation.mutateAsync(input),
    updateEmployee: (input) => updateMutation.mutateAsync(input),
    deleteEmployee: (id) => deleteMutation.mutateAsync(id),
  };
}

