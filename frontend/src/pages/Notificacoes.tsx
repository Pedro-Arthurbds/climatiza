import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Notificacao, TipoNotificacao } from "../types";

const rotuloTipo: Record<TipoNotificacao, string> = {
  MANUTENCAO_VENCIDA: "Manutenção vencida",
  LEMBRETE_MANUTENCAO: "Retorno preventivo",
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
  const [resolvendoId, setResolvendoId] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setMensagemErro(null);
    try {
      const { data } = await api.get<Notificacao[]>('/notificacoes', {
        params: { resolution: aba === 'resolvidas' },
      });
      setNotificacoes(data.filter((item) =>
        item.type !== "MANUTENCAO_VENCIDA" &&
        (item.type !== "LEMBRETE_MANUTENCAO" || item.message.startsWith("Retorno preventivo previsto para"))
      ));
    } catch {
      setMensagemErro('Não foi possível carregar as notificações neste momento.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba]);

  async function resolver(id: string) {
    const item = notificacoes.find((n) => n.id === id);
    const confirmar = window.confirm(`Confirmar como resolvida a notificação de "${item?.type ? rotuloTipo[item.type] : 'evento'}"?`);
    if (!confirmar) return;

    setMensagemErro(null);
    setMensagemSucesso(null);
    setResolvendoId(id);

    try {
      await api.patch(`/notificacoes/${id}/resolver`);
      setMensagemSucesso('Notificação resolvida com sucesso.');
      await carregar();
    } catch {
      setMensagemErro('Não foi possível marcar a notificação como resolvida.');
    } finally {
      setResolvendoId(null);
    }
  }

  async function verificarAgora() {
    setVerificando(true);
    setMensagemErro(null);
    setMensagemSucesso(null);
    try {
      await api.post('/dashboard/verificar-manutencoes');
      setMensagemSucesso('Retornos próximos verificados.');
      await carregar();
    } catch {
      setMensagemErro('Não foi possível verificar os retornos agora.');
    } finally {
      setVerificando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-inkMuted">Comunicação</p>
          <h1 className="mt-2 text-4xl text-ink">Notificações</h1>
          <p className="mt-2 text-sm text-inkMuted">
            Agendamentos, técnicos atribuídos, conclusões e manutenções.
          </p>
        </div>

        {ehAdmin && (
          <button
            onClick={verificarAgora}
            disabled={verificando}
            className="rounded-xl border border-border bg-[#fffdf9] px-3 py-2 text-xs font-semibold text-inkMuted hover:border-[#2f4f48] hover:text-[#2f4f48] disabled:opacity-50"
          >
            {verificando ? "Verificando..." : "Verificar retornos próximos"}
          </button>
        )}
      </div>

      {mensagemErro && (
        <p className="rounded-2xl border border-[#d9a39b] bg-[#f6e1df] px-4 py-3 text-sm text-[#8c3d35]" role="alert" aria-live="assertive">
          {mensagemErro}
        </p>
      )}

      {mensagemSucesso && (
        <p className="rounded-2xl border border-[#94b89a] bg-[#dff0e2] px-4 py-3 text-sm text-[#2d6646]" role="status" aria-live="polite">
          {mensagemSucesso}
        </p>
      )}

      <div className="rounded-[24px] border border-border bg-[#fffdf9] p-4 shadow-panel">
        <div className="mb-4 flex gap-2">
          {(["pendentes", "resolvidas"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${
                aba === a ? "border-[#2f4f48] bg-[#2f4f48] text-[#f7f2ea]" : "border-border bg-surfaceAlt text-inkMuted"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {carregando && <p className="rounded-2xl border border-border bg-[#f9f4eb] p-6 text-center text-sm text-inkMuted">Carregando notificações...</p>}
          {!carregando && notificacoes.length === 0 && (
            <div className="rounded-2xl border border-border bg-[#f9f4eb] p-6 text-center text-sm text-inkMuted">
              <p className="text-base font-medium text-ink">Nenhuma notificação {aba === "pendentes" ? "pendente" : "resolvida"}.</p>
              <p className="mt-2">Tudo em dia por enquanto.</p>
            </div>
          )}
          {notificacoes.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-4 rounded-[20px] border p-4 ${corTipo[n.type]}`}
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{rotuloTipo[n.type]}</span>
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
                  disabled={resolvendoId === n.id}
                  className="shrink-0 rounded-xl bg-[#2f4f48] px-3 py-2 text-xs font-semibold text-[#f9f5f0] hover:bg-[#24413d] disabled:opacity-50"
                >
                  {resolvendoId === n.id ? 'Resolvendo...' : 'Marcar resolvido'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
