import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

export type SubscriptionStatus =
  | "ATIVA"
  | "EM_ATRASO"
  | "SUSPENSA"
  | "CANCELADA";

export interface SubscriptionState {
  status: SubscriptionStatus;
  paidUntil: string;
  diasAtraso: number;
  graceDays: number;
  monthlyValue: number | null;
  mode: "READ_ONLY" | "FULL_BLOCK";
  paymentInstructions: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  canManage: boolean;
}

interface SubscriptionContextValue {
  assinatura: SubscriptionState | null;
  carregando: boolean;
  erro: string | null;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);
const INTERVALO_ATUALIZACAO_MS = 3 * 60_000;

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [assinatura, setAssinatura] = useState<SubscriptionState | null>(null);
  const [carregando, setCarregando] = useState(Boolean(user));
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setAssinatura(null);
      setCarregando(false);
      setErro(null);
      return;
    }

    let ativo = true;
    async function carregar() {
      try {
        const { data } = await api.get<SubscriptionState>("/assinatura");
        if (ativo) {
          setAssinatura(data);
          setErro(null);
        }
      } catch {
        if (ativo) {
          setErro("Não foi possível verificar a mensalidade. Tente novamente mais tarde.");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    setCarregando(true);
    void carregar();
    const intervalId = window.setInterval(() => void carregar(), INTERVALO_ATUALIZACAO_MS);
    return () => {
      ativo = false;
      window.clearInterval(intervalId);
    };
  }, [user]);

  useEffect(() => {
    if (
      assinatura &&
      (assinatura.status === "CANCELADA" ||
        (assinatura.status === "SUSPENSA" && assinatura.mode === "FULL_BLOCK")) &&
      !location.pathname.startsWith("/assinatura-pendente")
    ) {
      navigate("/assinatura-pendente", { replace: true });
    }
  }, [assinatura, location.pathname, navigate]);

  const value = useMemo(
    () => ({ assinatura, carregando, erro }),
    [assinatura, carregando, erro]
  );
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useAssinatura() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useAssinatura precisa estar dentro de SubscriptionProvider");
  }
  return context;
}
