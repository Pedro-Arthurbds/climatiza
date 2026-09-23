import { useEffect, useState } from "react";
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
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [tecnicos, setTecnicos] = useState<TecnicoCarga[]>([]);
  const [grafico, setGrafico] = useState<GraficoDashboard | null>(null);
  const [alertas, setAlertas] = useState<AlertaManutencao[]>([]);

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

  async function resolverAlerta(id: string) {
    await api.patch(`/notificacoes/${id}/resolver`);
    carregarAlertas();
  }

  const porPeriodo =
    grafico?.porPeriodo.map((p) => ({
      mes: mesAbreviado.format(new Date(p.periodo)),
      total: p.total,
    })) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-sm text-inkMuted">Panorama geral da operação.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card titulo="Abertos" valor={resumo?.abertos} corTexto="text-status-aberto" icone="○" />
        <Card titulo="Em andamento" valor={resumo?.emAndamento} corTexto="text-status-andamento" icone="◔" />
        <Card titulo="Concluídos" valor={resumo?.concluidos} corTexto="text-status-concluido" icone="✓" />
        <Card
          titulo="Atrasados"
          valor={resumo?.atrasados}
          corTexto="text-status-cancelado"
          destaque={!!resumo?.atrasados}
          icone="!"
        />
        <Card titulo="Agendados hoje" valor={resumo?.agendadosHoje} icone="⏱" />
        <Card titulo="Sem técnico" valor={resumo?.semTecnico} icone="•" />
        <Card
          titulo="Tempo médio"
          valor={
            resumo?.tempoMedioAtendimentoHoras != null
              ? `${resumo.tempoMedioAtendimentoHoras}h`
              : "—"
          }
          icone="↗"
        />
        <Card titulo="SLA" valor={resumo ? `${resumo.slaHoras}h` : undefined} icone="◎" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="mb-4 text-sm font-semibold">Chamados por mês</p>
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

        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="mb-4 text-sm font-semibold">Chamados por tipo de serviço</p>
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

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="mb-4 text-sm font-semibold">Carga e ranking por técnico</p>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-inkMuted">
              <tr>
                <th className="pb-2">Técnico</th>
                <th className="pb-2">Carga atual</th>
                <th className="pb-2">Concluídos</th>
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
                  <td className="py-2">{t.nome}</td>
                  <td className="py-2 text-inkMuted">{t.cargaAtual}</td>
                  <td className="py-2 text-inkMuted">{t.concluidos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="mb-4 text-sm font-semibold">Alertas de manutenção vencida</p>
          {alertas.length === 0 && (
            <p className="text-sm text-inkMuted">Nenhum alerta pendente.</p>
          )}
          <ul className="flex flex-col gap-3">
            {alertas.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-md border border-status-aberto/30 bg-status-aberto/10 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{a.client.name}</p>
                  <p className="text-xs text-inkMuted">{a.message}</p>
                </div>
                <button
                  onClick={() => resolverAlerta(a.id)}
                  className="shrink-0 text-xs font-semibold text-accent hover:underline"
                >
                  Marcar resolvido
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
}: {
  titulo: string;
  valor?: number | string;
  corTexto?: string;
  destaque?: boolean;
  icone?: string;
}) {
  return (
    <div
      className={`metric-card ${
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
