import type { Employee } from "@shared/schema";

export const employeeStatusClassMap: Record<Employee["status"], string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-red-100 text-red-800",
  leave: "bg-yellow-100 text-yellow-800",
};

export const employeeRoleClassMap: Record<Employee["role"], string> = {
  drive: "bg-blue-50 text-blue-700",
  help: "bg-green-50 text-green-700",
  support: "bg-purple-50 text-purple-700",
};
