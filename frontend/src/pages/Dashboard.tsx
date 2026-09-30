import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api/client";
import type {
  AlertaManutencao,
  DashboardResumo,
  GraficoDashboard,
  TecnicoCarga,
} from "../types";

const mesAbreviado = new Intl.DateTimeFormat("pt-BR", { month: "short" });

export function Dashboard() {
  const navigate = useNavigate();
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [tecnicos, setTecnicos] = useState<TecnicoCarga[]>([]);
  const [grafico, setGrafico] = useState<GraficoDashboard | null>(null);
  const [alertas, setAlertas] = useState<AlertaManutencao[]>([]);
  const [mostrarEquipe, setMostrarEquipe] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 768;
  });
  const [mostrarPanorama, setMostrarPanorama] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 768;
  });
  async function carregarAlertas() {
    const { data } = await api.get<AlertaManutencao[]>("/dashboard/alertas");
    setAlertas(data);
  }

  useEffect(() => {
    api.get<DashboardResumo>("/dashboard/resumo").then((r) => setResumo(r.data));
    api.get<TecnicoCarga[]>("/dashboard/por-tecnico").then((r) => setTecnicos(r.data));
    api.get<GraficoDashboard>("/dashboard/grafico").then((r) => setGrafico(r.data));
    carregarAlertas();
  }, []);

  useEffect(() => {
    function atualizarVisibilidadeEquipe() {
      if (window.innerWidth >= 768) {
        setMostrarEquipe(true);
        setMostrarPanorama(true);
      }
    }

    window.addEventListener("resize", atualizarVisibilidadeEquipe);
    return () => window.removeEventListener("resize", atualizarVisibilidadeEquipe);
  }, []);

  async function resolverAlerta(id: string) {
    await api.patch(`/notificacoes/${id}/resolver`);
    carregarAlertas();
  }

  const porPeriodo =
    grafico?.porPeriodo.map((p) => ({
      mes: mesAbreviado.format(new Date(p.periodo)),
      total: p.total,
    })) ?? [];

  const indicadoresPrincipais: Array<{
    titulo: string;
    valor?: number | string;
    corTexto?: string;
    destaque?: boolean;
    icone: string;
  }> = [
    { titulo: "Abertos", valor: resumo?.abertos, corTexto: "text-status-aberto", icone: "○" },
    { titulo: "Em andamento", valor: resumo?.emAndamento, corTexto: "text-status-andamento", icone: "◔" },
    { titulo: "Atrasados", valor: resumo?.atrasados, corTexto: "text-status-cancelado", destaque: !!resumo?.atrasados, icone: "!" },
    { titulo: "Agendados hoje", valor: resumo?.agendadosHoje, icone: "⏱" },
    { titulo: "Sem técnico", valor: resumo?.semTecnico, icone: "•" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <div className="md:hidden">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-inkMuted">Operação</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">Dashboard</h1>
          </div>
        </div>

        <div>
          <div className="hidden md:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-inkMuted">Operação</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">Dashboard</h1>
            <p className="mt-1 text-sm text-inkMuted">Panorama da equipe e do dia.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5">
        {indicadoresPrincipais.map((card, index) => (
          <Card
            key={card.titulo}
            titulo={card.titulo}
            valor={card.valor}
            corTexto={card.corTexto}
            destaque={card.destaque}
            icone={card.icone}
            className={index === indicadoresPrincipais.length - 1 ? "col-span-2 sm:col-span-1" : ""}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-inkMuted">Panorama</p>
            <p className="mt-1 text-base font-semibold text-ink">Resumo semanal</p>
          </div>
          <button
            type="button"
            onClick={() => setMostrarPanorama((valor) => !valor)}
            className="rounded-full border border-border bg-surfaceAlt px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-inkMuted"
          >
            {mostrarPanorama ? "Ocultar" : "Ver"}
          </button>
        </div>

        {!mostrarPanorama && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-inkMuted">
              {resumo?.abertos ?? 0} chamados abertos · {resumo?.agendadosHoje ?? 0} agendados hoje.
            </p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-inkMuted">
              Panorama semanal oculto. Toque em “Ver” para ver o histórico por mês e por tipo.
            </p>
          </div>
        )}
      </div>

      <div className={mostrarPanorama ? "grid gap-6 xl:grid-cols-[1.3fr_1fr]" : "hidden lg:grid lg:grid-cols-2 xl:grid-cols-[1.3fr_1fr]"}>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-inkMuted">Tráfego</p>
              <p className="mt-1 text-base font-semibold text-ink">Chamados por mês</p>
            </div>
            <span className="rounded-full border border-border bg-surfaceAlt px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-inkMuted">
              Trimestre
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={porPeriodo}>
              <CartesianGrid stroke="#2E3746" strokeDasharray="3 3" />
              <XAxis dataKey="mes" stroke="#8B94A6" fontSize={12} />
              <YAxis stroke="#8B94A6" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#1C232E", border: "1px solid #2E3746" }}
              />
              <Line type="monotone" dataKey="total" stroke="#4FA3A8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-inkMuted">Atividade</p>
              <p className="mt-1 text-base font-semibold text-ink">Por tipo de serviço</p>
            </div>
            <span className="rounded-full border border-border bg-surfaceAlt px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-inkMuted">
              Volume
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={grafico?.porTipoServico ?? []}>
              <CartesianGrid stroke="#2E3746" strokeDasharray="3 3" />
              <XAxis dataKey="tipo" stroke="#8B94A6" fontSize={12} />
              <YAxis stroke="#8B94A6" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#1C232E", border: "1px solid #2E3746" }}
              />
              <Bar dataKey="total" fill="#4FA3A8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-inkMuted">Equipe</p>
              <p className="mt-1 text-base font-semibold text-ink">Carga por técnico</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarEquipe((valor) => !valor)}
              className="rounded-full border border-border bg-surfaceAlt px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-inkMuted md:hidden"
            >
              {mostrarEquipe ? "Fechar" : "Abrir"}
            </button>
          </div>

          <div className={mostrarEquipe ? "block" : "hidden md:block"}>
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] uppercase tracking-[0.16em] text-inkMuted">
                <tr>
                  <th className="pb-2">Técnico</th>
                  <th className="pb-2 text-right">Carga</th>
                  <th className="pb-2 text-right">Concluídos</th>
                </tr>
              </thead>
              <tbody>
                {tecnicos.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-3 text-inkMuted">
                      Nenhum técnico ativo.
                    </td>
                  </tr>
                )}
                {tecnicos.map((t) => (
                  <tr key={t.userId} className="border-t border-border">
                    <td className="py-2 font-medium">{t.nome}</td>
                    <td className="py-2 text-right text-inkMuted">{t.cargaAtual}</td>
                    <td className="py-2 text-right text-inkMuted">{t.concluidos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!mostrarEquipe && (
            <div className="mt-3 space-y-2 md:hidden">
              <p className="text-sm text-inkMuted">
                {tecnicos.length} técnico{tecnicos.length === 1 ? "" : "s"} em operação.
              </p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-inkMuted">
                Carga por técnico escondida. Toque em “Abrir” para ver a distribuição de trabalho.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-inkMuted">Alerta</p>
              <p className="mt-1 text-base font-semibold text-ink">Alertas de manutenção</p>
            </div>
            {alertas.length > 0 && (
              <span className="rounded-full border border-status-aberto/30 bg-status-aberto/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-status-aberto">
                {alertas.length} itens
              </span>
            )}
          </div>
          {alertas.length === 0 && (
            <p className="text-sm text-inkMuted">Nenhum alerta pendente.</p>
          )}
          <ul className="flex flex-col gap-3">
            {alertas.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-status-aberto/30 bg-status-aberto/10 p-3"
              >
                <button
                  type="button"
                  disabled={!a.ticketId}
                  onClick={() => a.ticketId && navigate(`/chamados?ticket=${encodeURIComponent(a.ticketId)}`)}
                  className="min-w-0 flex-1 text-left disabled:cursor-default"
                  aria-label={a.ticketId ? `Abrir chamado de manutenção de ${a.client.name}` : `Alerta de manutenção de ${a.client.name}; chamado relacionado não encontrado`}
                >
                  <p className="text-sm font-medium">{a.client.name}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase text-status-aberto">
                    {a.type === "MANUTENCAO_VENCIDA" ? "Manutenção vencida" : "Retorno preventivo"}
                  </p>
                  <p className="mt-0.5 text-xs text-inkMuted">{a.message}</p>
                  {a.ticketId ? (
                    <span className="mt-2 inline-block text-xs font-semibold text-accent">Abrir chamado</span>
                  ) : (
                    <span className="mt-2 inline-block text-xs text-inkMuted">Chamado relacionado não encontrado</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => resolverAlerta(a.id)}
                  className="shrink-0 text-xs font-semibold text-accent hover:underline"
                >
                  Resolver
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Card({
  titulo,
  valor,
  corTexto,
  destaque,
  icone,
  className = "",
}: {
  titulo: string;
  valor?: number | string;
  corTexto?: string;
  destaque?: boolean;
  icone?: string;
  className?: string;
}) {
  return (
    <div
      className={`metric-card ${className} ${
        destaque ? "border-status-cancelado/40 bg-status-cancelado/10" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="metric-card-title">{titulo}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surfaceAlt text-sm font-bold text-inkMuted">
          {icone ?? "•"}
        </span>
      </div>
      <p className={`metric-card-value ${corTexto ?? "text-ink"}`}>
        {valor ?? "—"}
      </p>
    </div>
  );
}
