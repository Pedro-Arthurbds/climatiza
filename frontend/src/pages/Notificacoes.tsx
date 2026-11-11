import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useAssinatura } from "../context/SubscriptionContext";
import { useResponsivePageSize } from "../hooks/useResponsivePageSize";
import type { Notificacao, TipoNotificacao } from "../types";

const rotuloTipo: Record<TipoNotificacao, string> = {
  MANUTENCAO_VENCIDA: "Manutenção vencida",
  LEMBRETE_MANUTENCAO: "Retorno preventivo",
  AGENDAMENTO: "Agendamento",
  TECNICO_ATRIBUIDO: "Técnico atribuído",
  CHAMADO_CONCLUIDO: "Chamado concluído",
};

const corTipo: Record<TipoNotificacao, string> = {
  MANUTENCAO_VENCIDA: "border-rose-200 bg-rose-50/70 text-rose-800",
  LEMBRETE_MANUTENCAO: "border-amber-200 bg-amber-50/70 text-amber-800",
  AGENDAMENTO: "border-sky-200 bg-sky-50/70 text-sky-800",
  TECNICO_ATRIBUIDO: "border-slate-200 bg-slate-50 text-slate-800",
  CHAMADO_CONCLUIDO: "border-emerald-200 bg-emerald-50/70 text-emerald-800",
};

function formatarData(valor: string) {
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function Notificacoes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { assinatura } = useAssinatura();
  const somenteLeitura =
    assinatura?.status === "SUSPENSA" && assinatura.mode === "READ_ONLY";
  const ehAdmin = user?.role === "ADMIN";

  const [aba, setAba] = useState<"pendentes" | "resolvidas">("pendentes");
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [pagina, setPagina] = useState(1);
  const pageSize = useResponsivePageSize(() => setPagina(1));
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [verificando, setVerificando] = useState(false);
  const [resolvendoId, setResolvendoId] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setMensagemErro(null);
    try {
      const { data } = await api.get<{
        items: Notificacao[];
        total: number;
      }>('/notificacoes', {
        params: { resolution: aba === 'resolvidas', page: pagina, pageSize },
      });
      setNotificacoes(data.items);
      setTotal(data.total);
      const ultimaPagina = Math.max(1, Math.ceil(data.total / pageSize));
      if (pagina > ultimaPagina) setPagina(ultimaPagina);
    } catch {
      setMensagemErro('Não foi possível carregar as notificações neste momento.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, pageSize, pagina]);

  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Notificações Internas</h1>
          <p className="mt-0.5 text-xs text-inkMuted">
            Avisos operacionais sobre agendamentos, técnicos e manutenções de HVAC.
          </p>
        </div>

        {ehAdmin && !somenteLeitura && (
          <button
            onClick={verificarAgora}
            disabled={verificando}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink hover:border-accent hover:text-accent transition disabled:opacity-50 self-start sm:self-auto"
          >
            {verificando ? "Verificando..." : "Verificar retornos próximos"}
          </button>
        )}
      </div>

      {mensagemErro && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-800" role="alert" aria-live="assertive">
          {mensagemErro}
        </p>
      )}

      {mensagemSucesso && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800" role="status" aria-live="polite">
          {mensagemSucesso}
        </p>
      )}

      <div className="rounded-xl border border-border bg-surface p-4 shadow-subtle">
        <div className="mb-4 flex gap-1.5">
          {(["pendentes", "resolvidas"] as const).map((a) => (
            <button
              key={a}
              onClick={() => {
                setAba(a);
                setPagina(1);
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition ${
                aba === a ? "border-accent bg-accent text-white" : "border-border bg-surfaceAlt text-inkMuted hover:border-accent/40"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {carregando && <p className="rounded-xl border border-border bg-surfaceAlt/60 p-6 text-center text-xs text-inkMuted">Carregando notificações...</p>}
          {!carregando && notificacoes.length === 0 && (
            <div className="rounded-xl border border-border bg-surfaceAlt/60 p-6 text-center text-xs text-inkMuted">
              <p className="text-sm font-semibold text-ink">Nenhuma notificação {aba === "pendentes" ? "pendente" : "resolvida"}.</p>
              <p className="mt-1">Tudo em dia com as manutenções e chamados.</p>
            </div>
          )}
          {notificacoes.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${corTipo[n.type]}`}
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold">{rotuloTipo[n.type]}</span>
                  {n.serviceType && (
                    <span className="text-xs text-inkMuted">· {n.serviceType.name}</span>
                  )}
                </div>
                <p className="text-sm text-ink">{n.message}</p>
                <p className="mt-1 text-xs text-inkMuted">
                  {n.client.name} · {formatarData(n.createdAt)}
                </p>
                {n.ticketId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/chamados?ticket=${encodeURIComponent(n.ticketId!)}`)}
                    className="mt-2 text-xs font-semibold text-accent hover:underline"
                  >
                    Abrir chamado
                  </button>
                )}
              </div>
              {!n.resolution && ehAdmin && !somenteLeitura && (
                <button
                  onClick={() => resolver(n.id)}
                  disabled={resolvendoId === n.id}
                  className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accentMuted transition disabled:opacity-50"
                >
                  {resolvendoId === n.id ? 'Resolvendo...' : 'Marcar resolvido'}
                </button>
              )}
            </div>
          ))}
        </div>
        {total > pageSize && (
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
            <span className="text-inkMuted">
              Página {pagina} de {totalPaginas} · {total} notificações
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
                disabled={pagina === 1 || carregando}
                className="rounded-lg border border-border px-3 py-1.5 font-semibold text-inkMuted disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPagina((atual) => Math.min(totalPaginas, atual + 1))}
                disabled={pagina >= totalPaginas || carregando}
                className="rounded-lg border border-border px-3 py-1.5 font-semibold text-inkMuted disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
