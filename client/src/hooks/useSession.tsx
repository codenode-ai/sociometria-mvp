import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const SessionContext = createContext<SessionContextValue | null>(null);

export type UserRole = "admin" | "user";

interface SessionContextValue {
  accessToken: string | null;
  role: UserRole | null;
  loading: boolean;
  setSession(token: string | null, role: UserRole | null): void;
  signOut(): void;
}

const STORAGE_TOKEN_KEY = "sociometria-token";
const STORAGE_ROLE_KEY = "sociometria-role";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(STORAGE_TOKEN_KEY);
    const storedRole = window.localStorage.getItem(STORAGE_ROLE_KEY) as UserRole | null;
    if (storedToken) {
      setAccessToken(storedToken);
      setRole(storedRole ?? "user");
    }
    setLoading(false);
  }, []);

  const value = useMemo<SessionContextValue>(() => ({
    accessToken,
    role,
    loading,
    setSession(token, nextRole) {
      if (token) {
        window.localStorage.setItem(STORAGE_TOKEN_KEY, token);
        if (nextRole) {
          window.localStorage.setItem(STORAGE_ROLE_KEY, nextRole);
        }
      } else {
        window.localStorage.removeItem(STORAGE_TOKEN_KEY);
        window.localStorage.removeItem(STORAGE_ROLE_KEY);
      }
      setAccessToken(token);
      setRole(nextRole);
    },
    signOut() {
      window.localStorage.removeItem(STORAGE_TOKEN_KEY);
      window.localStorage.removeItem(STORAGE_ROLE_KEY);
      setAccessToken(null);
      setRole(null);
    },
  }), [accessToken, role, loading]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
