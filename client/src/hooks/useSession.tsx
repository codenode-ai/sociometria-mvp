import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type UserRole = "admin" | "user";

interface SessionContextValue {
  accessToken: string | null;
  role: UserRole | null;
  loading: boolean;
  userName: string | null;
  setSession(token: string | null, role: UserRole | null, userName?: string | null): void;
  signOut(): void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_TOKEN_KEY = "sociometria-token";
const STORAGE_ROLE_KEY = "sociometria-role";
const STORAGE_NAME_KEY = "sociometria-name";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(STORAGE_TOKEN_KEY);
    const storedRole = window.localStorage.getItem(STORAGE_ROLE_KEY) as UserRole | null;
    const storedName = window.localStorage.getItem(STORAGE_NAME_KEY);
    if (storedToken) {
      setAccessToken(storedToken);
      setRole(storedRole ?? "user");
      setUserName(storedName ?? null);
    }
    setLoading(false);
  }, []);

  const value = useMemo<SessionContextValue>(() => ({
    accessToken,
    role,
    loading,
    userName,
    setSession(token, nextRole, nextName) {
      if (token) {
        window.localStorage.setItem(STORAGE_TOKEN_KEY, token);
        if (nextRole) {
          window.localStorage.setItem(STORAGE_ROLE_KEY, nextRole);
        }
        if (nextName !== undefined) {
          if (nextName) {
            window.localStorage.setItem(STORAGE_NAME_KEY, nextName);
          } else {
            window.localStorage.removeItem(STORAGE_NAME_KEY);
          }
        }
      } else {
        window.localStorage.removeItem(STORAGE_TOKEN_KEY);
        window.localStorage.removeItem(STORAGE_ROLE_KEY);
        window.localStorage.removeItem(STORAGE_NAME_KEY);
      }
      setAccessToken(token);
      setRole(nextRole);
      if (nextName !== undefined) {
        setUserName(nextName ?? null);
      }
    },
    signOut() {
      window.localStorage.removeItem(STORAGE_TOKEN_KEY);
      window.localStorage.removeItem(STORAGE_ROLE_KEY);
      window.localStorage.removeItem(STORAGE_NAME_KEY);
      setAccessToken(null);
      setRole(null);
      setUserName(null);
    },
  }), [accessToken, role, loading, userName]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
