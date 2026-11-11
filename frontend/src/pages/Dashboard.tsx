import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineInboxStack,
  HiOutlineWrenchScrewdriver,
  HiOutlineExclamationTriangle,
  HiOutlineCalendarDays,
  HiOutlineUserMinus,
  HiOutlineArrowTrendingUp,
  HiOutlineSquare3Stack3D,
  HiOutlineUsers,
  HiOutlineBellAlert,
  HiOutlineClock,
} from "react-icons/hi2";
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
import { useAuth } from "../context/AuthContext";
import { useAssinatura } from "../context/SubscriptionContext";
import type {
  AlertaManutencao,
  DashboardResumo,
  GraficoDashboard,
  TecnicoCarga,
} from "../types";

const mesAbreviado = new Intl.DateTimeFormat("pt-BR", { month: "short" });

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { assinatura } = useAssinatura();
  const somenteLeitura =
    assinatura?.status === "SUSPENSA" && assinatura.mode === "READ_ONLY";
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [tecnicos, setTecnicos] = useState<TecnicoCarga[]>([]);
  const [grafico, setGrafico] = useState<GraficoDashboard | null>(null);
  const [alertas, setAlertas] = useState<AlertaManutencao[]>([]);
  const [erroAlertas, setErroAlertas] = useState<string | null>(null);
  const [mostrarEquipe, setMostrarEquipe] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 768;
  });
  const [mostrarPanorama, setMostrarPanorama] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 768;
  });
  async function carregarAlertas() {
    try {
      const { data } = await api.get<AlertaManutencao[]>("/dashboard/alertas");
      setAlertas(data);
      setErroAlertas(null);
    } catch {
      setErroAlertas("Não foi possível carregar os alertas de manutenção.");
    }
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
    setErroAlertas(null);
    try {
      await api.patch(`/notificacoes/${id}/resolver`);
      await carregarAlertas();
    } catch {
      setErroAlertas("Não foi possível resolver o alerta de manutenção.");
    }
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
    icone: React.ReactNode;
    badgeClasse?: string;
  }> = [
    {
      titulo: "Abertos",
      valor: resumo?.abertos,
      corTexto: "text-status-aberto",
      badgeClasse: "border-status-aberto/30 bg-status-aberto/10 text-status-aberto",
      icone: <HiOutlineInboxStack className="h-5 w-5" aria-hidden="true" />,
    },
    {
      titulo: "Em andamento",
      valor: resumo?.emAndamento,
      corTexto: "text-status-andamento",
      badgeClasse: "border-status-andamento/30 bg-status-andamento/10 text-status-andamento",
      icone: <HiOutlineWrenchScrewdriver className="h-5 w-5" aria-hidden="true" />,
    },
    {
      titulo: "Atrasados",
      valor: resumo?.atrasados,
      corTexto: "text-status-cancelado",
      destaque: !!resumo?.atrasados,
      badgeClasse: "border-status-cancelado/40 bg-status-cancelado/15 text-status-cancelado",
      icone: <HiOutlineExclamationTriangle className="h-5 w-5" aria-hidden="true" />,
    },
    {
      titulo: "Agendados hoje",
      valor: resumo?.agendadosHoje,
      badgeClasse: "border-accent/25 bg-accent/10 text-accent",
      icone: <HiOutlineCalendarDays className="h-5 w-5" aria-hidden="true" />,
    },
    {
      titulo: "Sem técnico",
      valor: resumo?.semTecnico,
      badgeClasse: "border-border bg-surfaceAlt text-inkMuted",
      icone: <HiOutlineUserMinus className="h-5 w-5" aria-hidden="true" />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Telemetria de Atendimentos</h1>
          <p className="mt-0.5 text-xs text-inkMuted">Acompanhamento em tempo real de chamados, prazos e equipe em campo.</p>
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
            badgeClasse={card.badgeClasse}
            className={index === indicadoresPrincipais.length - 1 ? "col-span-2 sm:col-span-1" : ""}
          />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 shadow-subtle md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-ink">Resumo semanal</p>
            <p className="text-xs text-inkMuted">
              {resumo?.abertos ?? 0} chamados abertos · {resumo?.agendadosHoje ?? 0} agendados hoje
            </p>
          </div>
          {!somenteLeitura && (
            <button
              type="button"
              onClick={() => setMostrarPanorama((valor) => !valor)}
              className="rounded-lg border border-border bg-surfaceAlt px-2.5 py-1 text-xs font-medium text-ink hover:border-accent"
            >
              {mostrarPanorama ? "Ocultar" : "Expandir"}
            </button>
          )}
        </div>
      </div>

      <div className={mostrarPanorama ? "grid gap-6 xl:grid-cols-[1.3fr_1fr]" : "hidden lg:grid lg:grid-cols-2 xl:grid-cols-[1.3fr_1fr]"}>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-subtle">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                <HiOutlineArrowTrendingUp className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Volume de Chamados</p>
                <p className="text-xs text-inkMuted">Evolução por mês</p>
              </div>
            </div>
            <span className="rounded-md border border-border bg-surfaceAlt px-2.5 py-0.5 text-xs font-medium text-inkMuted">
              Trimestre
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={porPeriodo}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: "8px", color: "#FFFFFF", fontSize: "12px" }}
              />
              <Line type="monotone" dataKey="total" stroke="#0284C7" strokeWidth={2.5} dot={{ fill: "#0284C7", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-subtle">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                <HiOutlineSquare3Stack3D className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Tipos de Serviço</p>
                <p className="text-xs text-inkMuted">Distribuição da demanda</p>
              </div>
            </div>
            <span className="rounded-md border border-border bg-surfaceAlt px-2.5 py-0.5 text-xs font-medium text-inkMuted">
              Demanda
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={grafico?.porTipoServico ?? []}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="tipo" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: "8px", color: "#FFFFFF", fontSize: "12px" }}
              />
              <Bar dataKey="total" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-subtle">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                <HiOutlineUsers className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Equipe Técnica</p>
                <p className="text-xs text-inkMuted">Distribuição da carga de trabalho</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMostrarEquipe((valor) => !valor)}
              className="rounded-lg border border-border bg-surfaceAlt px-2.5 py-1 text-xs font-medium text-inkMuted md:hidden"
            >
              {mostrarEquipe ? "Ocultar" : "Ver"}
            </button>
          </div>

          <div className={mostrarEquipe ? "block" : "hidden md:block"}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs font-semibold text-inkMuted">
                <tr>
                  <th className="pb-2">Técnico</th>
                  <th className="pb-2 text-right">Em atendimento</th>
                  <th className="pb-2 text-right">Concluídos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tecnicos.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-xs text-inkMuted">
                      Nenhum técnico ativo no momento.
                    </td>
                  </tr>
                )}
                {tecnicos.map((t) => (
                  <tr key={t.userId} className="hover:bg-surfaceAlt/50 transition-colors">
                    <td className="py-2.5 font-medium text-ink">{t.nome}</td>
                    <td className="py-2.5 text-right font-mono text-ink tabular-nums">{t.cargaAtual}</td>
                    <td className="py-2.5 text-right font-mono text-inkMuted tabular-nums">{t.concluidos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!mostrarEquipe && (
            <div className="mt-3 space-y-1 md:hidden">
              <p className="text-xs text-inkMuted">
                {tecnicos.length} técnico{tecnicos.length === 1 ? "" : "s"} em operação.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-subtle">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-status-aberto/30 bg-status-aberto/10 text-status-aberto">
                <HiOutlineBellAlert className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Alertas de Manutenção</p>
                <p className="text-xs text-inkMuted">Preventivas e retornos agendados</p>
              </div>
            </div>
            {alertas.length > 0 && (
              <span className="rounded-md border border-status-aberto/30 bg-status-aberto/10 px-2 py-0.5 text-xs font-semibold text-status-aberto">
                {alertas.length} pendente{alertas.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {erroAlertas && (
            <p className="mb-3 text-xs text-status-cancelado" role="alert">
              {erroAlertas}
            </p>
          )}
          {alertas.length === 0 && (
            <p className="py-4 text-center text-xs text-inkMuted">Nenhum alerta preventivo pendente.</p>
          )}
          <ul className="flex flex-col gap-3">
            {alertas.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-status-aberto/30 bg-status-aberto/10 p-3"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-status-aberto/20 text-status-aberto">
                    <HiOutlineClock className="h-4 w-4" aria-hidden="true" />
                  </span>
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
                </div>
                {user?.role === "ADMIN" && (
                  <button
                    type="button"
                    onClick={() => resolverAlerta(a.id)}
                    className="shrink-0 text-xs font-semibold text-accent hover:underline"
                  >
                    Resolver
                  </button>
                )}
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
  badgeClasse,
  className = "",
}: {
  titulo: string;
  valor?: number | string;
  corTexto?: string;
  destaque?: boolean;
  icone?: React.ReactNode;
  badgeClasse?: string;
  className?: string;
}) {
  return (
    <div
      className={`metric-card ${className} ${
        destaque ? "border-status-cancelado/40 bg-status-cancelado/10" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-inkMuted leading-tight">{titulo}</p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm transition-colors ${
            badgeClasse ?? "border-border bg-surfaceAlt text-inkMuted"
          }`}
        >
          {icone ?? "•"}
        </span>
      </div>
      <p className={`mt-2 text-2xl sm:text-3xl font-bold tracking-tight font-mono tabular-nums ${corTexto ?? "text-ink"}`}>
        {valor ?? "—"}
      </p>
    </div>
  );
}
