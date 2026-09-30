import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { api } from "../api/client";
import type { AuthUser } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  finishFirstAccess: (password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("climatiza:user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      async login(email, password) {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("climatiza:token", data.token);
        localStorage.setItem("climatiza:user", JSON.stringify(data.user));
        setUser(data.user);
      },
      async finishFirstAccess(password, passwordConfirmation) {
        const { data } = await api.post("/auth/first-password", {
          password,
          passwordConfirmation,
        });
        localStorage.setItem("climatiza:token", data.token);
        localStorage.setItem("climatiza:user", JSON.stringify(data.user));
        setUser(data.user);
      },
      logout() {
        localStorage.removeItem("climatiza:token");
        localStorage.removeItem("climatiza:user");
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
