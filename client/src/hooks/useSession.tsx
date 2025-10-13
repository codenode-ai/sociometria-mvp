import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type UserRole = "psychologist" | "manager" | "viewer";

interface SessionUser {
  id: string;
  name: string;
  role: UserRole;
}

interface SessionContextValue {
  currentUser: SessionUser;
  setRole(role: UserRole): void;
}

const DEFAULT_USER: SessionUser = {
  id: "demo-user",
  name: "Colaborador",
  role: "manager",
};

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = "sociometria-role";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<SessionUser>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_USER;
    }
    const storedRole = window.localStorage.getItem(STORAGE_KEY) as UserRole | null;
    return storedRole ? { ...DEFAULT_USER, role: storedRole } : DEFAULT_USER;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, currentUser.role);
  }, [currentUser.role]);

  const value = useMemo<SessionContextValue>(() => ({
    currentUser,
    setRole: (role: UserRole) => setCurrentUser((prev) => ({ ...prev, role })),
  }), [currentUser]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
