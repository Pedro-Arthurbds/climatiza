import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Notificacao, TipoNotificacao } from "../types";

const rotuloTipo: Record<TipoNotificacao, string> = {
  MANUTENCAO_VENCIDA: "Manutenção vencida",
  LEMBRETE_MANUTENCAO: "Lembrete de manutenção",
  AGENDAMENTO: "Agendamento",
  TECNICO_ATRIBUIDO: "Técnico atribuído",
  CHAMADO_CONCLUIDO: "Chamado concluído",
};

const corTipo: Record<TipoNotificacao, string> = {
  MANUTENCAO_VENCIDA: "border-status-cancelado/30 bg-status-cancelado/10 text-status-cancelado",
  LEMBRETE_MANUTENCAO: "border-status-aberto/30 bg-status-aberto/10 text-status-aberto",
  AGENDAMENTO: "border-status-andamento/30 bg-status-andamento/10 text-status-andamento",
  TECNICO_ATRIBUIDO: "border-accent/30 bg-accent/10 text-accent",
  CHAMADO_CONCLUIDO: "border-status-concluido/30 bg-status-concluido/10 text-status-concluido",
};

function formatarData(valor: string) {
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function Notificacoes() {
  const { user } = useAuth();
  const ehAdmin = user?.role === "ADMIN";

  const [aba, setAba] = useState<"pendentes" | "resolvidas">("pendentes");
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [verificando, setVerificando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const { data } = await api.get<Notificacao[]>("/notificacoes", {
      params: { resolution: aba === "resolvidas" },
    });
    setNotificacoes(data);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba]);

  async function resolver(id: string) {
    await api.patch(`/notificacoes/${id}/resolver`);
    carregar();
  }

  async function verificarAgora() {
    setVerificando(true);
    try {
      await api.post("/dashboard/verificar-manutencoes");
      if (aba === "pendentes") carregar();
    } finally {
      setVerificando(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Notificações</h1>
          <p className="text-sm text-inkMuted">
            Agendamentos, técnicos atribuídos, conclusões e manutenções.
          </p>
        </div>

        {ehAdmin && (
          <button
            onClick={verificarAgora}
            disabled={verificando}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-inkMuted hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {verificando ? "Verificando..." : "Verificar manutenções agora"}
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-1">
        {(["pendentes", "resolvidas"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold capitalize ${
              aba === a ? "border-accent text-accent" : "border-border text-inkMuted"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {carregando && <p className="text-sm text-inkMuted">Carregando...</p>}
        {!carregando && notificacoes.length === 0 && (
          <p className="rounded-md border border-border bg-surface p-6 text-center text-sm text-inkMuted">
            Nenhuma notificação {aba === "pendentes" ? "pendente" : "resolvida"}.
          </p>
        )}
        {notificacoes.map((n) => (
          <div
            key={n.id}
            className={`flex items-start justify-between gap-4 rounded-md border p-4 ${corTipo[n.type]}`}
          >
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-bold uppercase">{rotuloTipo[n.type]}</span>
                {n.serviceType && (
                  <span className="text-xs text-inkMuted">· {n.serviceType.name}</span>
                )}
              </div>
              <p className="text-sm text-ink">{n.message}</p>
              <p className="mt-1 text-xs text-inkMuted">
                {n.client.name} · {formatarData(n.createdAt)}
              </p>
            </div>
            {!n.resolution && (
              <button
                onClick={() => resolver(n.id)}
                className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-base hover:opacity-90"
              >
                Marcar resolvido
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
