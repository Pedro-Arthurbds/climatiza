import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { ChamadoDrawer } from "../components/ChamadoDrawer";
import { useAuth } from "../context/AuthContext";
import type { ChamadoAgenda, TicketStatus, TipoServico, Usuario } from "../types";

type Visao = "dia" | "semana" | "mes";

const statusOptions: TicketStatus[] = [
  "ABERTO",
  "EM_ANDAMENTO",
  "CONCLUIDO",
  "CANCELADO",
];

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function inicioDoDia(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function fimDoDia(d: Date) {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

// Calcula o intervalo visível conforme a visão escolhida. Para "mês",
// estende até completar as semanas, senão a grade fica com buracos.
function intervalo(visao: Visao, referencia: Date) {
  if (visao === "dia") {
    return { from: inicioDoDia(referencia), to: fimDoDia(referencia) };
  }
  if (visao === "semana") {
    const from = inicioDoDia(referencia);
    from.setDate(from.getDate() - from.getDay());
    const to = new Date(from);
    to.setDate(to.getDate() + 6);
    return { from, to: fimDoDia(to) };
  }
  const primeiro = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
  const ultimo = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0);
  const from = inicioDoDia(primeiro);
  from.setDate(from.getDate() - from.getDay());
  const to = fimDoDia(ultimo);
  to.setDate(to.getDate() + (6 - ultimo.getDay()));
  return { from, to };
}

function chaveDia(d: Date | string) {
  const data = typeof d === "string" ? new Date(d) : d;
  return `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
}

export function Agenda() {
  const { user } = useAuth();
  const ehAdmin = user?.role === "ADMIN";

  const [visao, setVisao] = useState<Visao>("semana");
  const [referencia, setReferencia] = useState(new Date());
  const [chamados, setChamados] = useState<ChamadoAgenda[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [tipos, setTipos] = useState<TipoServico[]>([]);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [filtroTecnico, setFiltroTecnico] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<TicketStatus | "">("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const { from, to } = useMemo(() => intervalo(visao, referencia), [visao, referencia]);

  async function carregar() {
    const { data } = await api.get<ChamadoAgenda[]>("/chamados/agenda", {
      params: {
        from: from.toISOString(),
        to: to.toISOString(),
        userId: filtroTecnico || undefined,
        city: filtroCidade || undefined,
        status: filtroStatus || undefined,
        serviceTypeId: filtroTipo || undefined,
      },
    });
    setChamados(data);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visao, referencia, filtroTecnico, filtroCidade, filtroStatus, filtroTipo]);

  useEffect(() => {
    api.get<TipoServico[]>("/tipos-servico").then((r) => setTipos(r.data));
    if (ehAdmin) {
      api
        .get<Usuario[]>("/usuarios")
        .then((r) => setTecnicos(r.data.filter((u) => u.role === "TECNICO" && u.isActive)));
    }
  }, [ehAdmin]);

  // Reagendamento por arrastar: mantém o horário original e troca só o dia,
  // que é o comportamento esperado ao mover um card entre datas.
  async function soltarEm(chamadoId: string, dia: Date) {
    const chamado = chamados.find((c) => c.id === chamadoId);
    if (!chamado?.scheduledAt) return;

    const original = new Date(chamado.scheduledAt);
    const nova = new Date(dia);
    nova.setHours(original.getHours(), original.getMinutes(), 0, 0);

    setErro(null);
    try {
      await api.patch(`/chamados/${chamadoId}/reagendar`, {
        scheduledAt: nova.toISOString(),
      });
      carregar();
    } catch (e: any) {
      setErro(e?.response?.data?.error ?? "Não foi possível reagendar.");
    }
  }

  const porDia = useMemo(() => {
    const mapa = new Map<string, ChamadoAgenda[]>();
    for (const c of chamados) {
      if (!c.scheduledAt) continue;
      const k = chaveDia(c.scheduledAt);
      mapa.set(k, [...(mapa.get(k) ?? []), c]);
    }
    return mapa;
  }, [chamados]);

  const dias = useMemo(() => {
    const lista: Date[] = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      lista.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return lista;
  }, [from, to]);

  function navegar(direcao: number) {
    const nova = new Date(referencia);
    if (visao === "dia") nova.setDate(nova.getDate() + direcao);
    else if (visao === "semana") nova.setDate(nova.getDate() + direcao * 7);
    else nova.setMonth(nova.getMonth() + direcao);
    setReferencia(nova);
  }

  const rotuloPeriodo =
    visao === "mes"
      ? referencia.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      : `${from.toLocaleDateString("pt-BR")} — ${to.toLocaleDateString("pt-BR")}`;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Agenda</h1>
          <p className="text-sm capitalize text-inkMuted">{rotuloPeriodo}</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navegar(-1)} className="botao-nav">‹</button>
          <button onClick={() => setReferencia(new Date())} className="botao-nav">
            Hoje
          </button>
          <button onClick={() => navegar(1)} className="botao-nav">›</button>

          <div className="ml-3 flex gap-1">
            {(["dia", "semana", "mes"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVisao(v)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold capitalize ${
                  visao === v ? "border-accent text-accent" : "border-border text-inkMuted"
                }`}
              >
                {v === "mes" ? "mês" : v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {erro && (
        <p className="mb-4 rounded-md border border-status-cancelado/30 bg-status-cancelado/10 px-4 py-2 text-sm text-status-cancelado">
          {erro}
        </p>
      )}

      <div className="mb-4 grid grid-cols-4 gap-3">
        {ehAdmin && (
          <select
            value={filtroTecnico}
            onChange={(e) => setFiltroTecnico(e.target.value)}
            className="campo-select"
          >
            <option value="">Todos os técnicos</option>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
        <input
          value={filtroCidade}
          onChange={(e) => setFiltroCidade(e.target.value)}
          placeholder="Cidade"
          className="campo-input"
        />
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as TicketStatus | "")}
          className="campo-select"
        >
          <option value="">Todos os status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="campo-select"
        >
          <option value="">Todos os tipos</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {visao === "dia" ? (
        <ColunaDia
          dia={dias[0]}
          chamados={porDia.get(chaveDia(dias[0])) ?? []}
          agrupado={!filtroTecnico}
          aoAbrir={setSelecionado}
          aoSoltar={soltarEm}
        />
      ) : (
        <div
          className={`grid gap-2 ${visao === "semana" ? "grid-cols-7" : "grid-cols-7"}`}
        >
          {visao === "mes" &&
            diasSemana.map((d) => (
              <p key={d} className="pb-1 text-center text-xs font-semibold text-inkMuted">
                {d}
              </p>
            ))}
          {dias.map((dia) => (
            <CelulaDia
              key={dia.toISOString()}
              dia={dia}
              mesReferencia={referencia.getMonth()}
              destacarMes={visao === "mes"}
              chamados={porDia.get(chaveDia(dia)) ?? []}
              aoAbrir={setSelecionado}
              aoSoltar={soltarEm}
            />
          ))}
        </div>
      )}

      {selecionado && (
        <ChamadoDrawer
          chamadoId={selecionado}
          onFechar={() => setSelecionado(null)}
          onMudou={carregar}
        />
      )}
    </div>
  );
}

function CelulaDia({
  dia,
  mesReferencia,
  destacarMes,
  chamados,
  aoAbrir,
  aoSoltar,
}: {
  dia: Date;
  mesReferencia: number;
  destacarMes: boolean;
  chamados: ChamadoAgenda[];
  aoAbrir: (id: string) => void;
  aoSoltar: (id: string, dia: Date) => void;
}) {
  const [sobre, setSobre] = useState(false);
  const foraDoMes = destacarMes && dia.getMonth() !== mesReferencia;
  const hoje = chaveDia(dia) === chaveDia(new Date());

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setSobre(true);
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => {
        e.preventDefault();
        setSobre(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id) aoSoltar(id, dia);
      }}
      className={`min-h-28 rounded-md border p-2 transition-colors ${
        sobre ? "border-accent bg-accent/10" : "border-border bg-surface"
      } ${foraDoMes ? "opacity-40" : ""}`}
    >
      <p
        className={`mb-2 text-xs font-semibold ${
          hoje ? "text-accent" : "text-inkMuted"
        }`}
      >
        {dia.getDate()}
      </p>
      <div className="flex flex-col gap-1">
        {chamados.map((c) => (
          <CardChamado key={c.id} chamado={c} aoAbrir={aoAbrir} />
        ))}
      </div>
    </div>
  );
}

function ColunaDia({
  dia,
  chamados,
  agrupado,
  aoAbrir,
  aoSoltar,
}: {
  dia: Date;
  chamados: ChamadoAgenda[];
  agrupado: boolean;
  aoAbrir: (id: string) => void;
  aoSoltar: (id: string, dia: Date) => void;
}) {
  // Na visão de dia, agrupar por técnico é o que dá leitura de carga.
  const grupos = useMemo(() => {
    if (!agrupado) return [{ nome: "Chamados", itens: chamados }];
    const mapa = new Map<string, ChamadoAgenda[]>();
    for (const c of chamados) {
      const nome = c.user?.name ?? "Sem técnico";
      mapa.set(nome, [...(mapa.get(nome) ?? []), c]);
    }
    return [...mapa.entries()].map(([nome, itens]) => ({ nome, itens }));
  }, [chamados, agrupado]);

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        if (id) aoSoltar(id, dia);
      }}
      className="flex flex-col gap-4"
    >
      {grupos.length === 0 && (
        <p className="rounded-md border border-border bg-surface p-6 text-center text-sm text-inkMuted">
          Nenhum chamado agendado para este dia.
        </p>
      )}
      {grupos.map((g) => (
        <div key={g.nome} className="rounded-lg border border-border bg-surface p-4">
          <p className="mb-3 text-sm font-semibold">
            {g.nome}{" "}
            <span className="text-inkMuted">({g.itens.length})</span>
          </p>
          <div className="flex flex-col gap-2">
            {g.itens.map((c) => (
              <CardChamado key={c.id} chamado={c} aoAbrir={aoAbrir} detalhado />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CardChamado({
  chamado,
  aoAbrir,
  detalhado,
}: {
  chamado: ChamadoAgenda;
  aoAbrir: (id: string) => void;
  detalhado?: boolean;
}) {
  const hora = chamado.scheduledAt
    ? new Date(chamado.scheduledAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const borda = chamado.atrasado
    ? "border-status-cancelado/60 bg-status-cancelado/10"
    : chamado.conflito
      ? "border-status-aberto/60 bg-status-aberto/10"
      : "border-border bg-surfaceAlt";

  return (
    <button
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", chamado.id)}
      onClick={() => aoAbrir(chamado.id)}
      className={`w-full cursor-grab rounded border p-2 text-left text-xs active:cursor-grabbing ${borda}`}
    >
      <p className="font-semibold">
        {hora} {chamado.client.name}
      </p>
      {detalhado && (
        <p className="text-inkMuted">
          {chamado.serviceType.name} · {chamado.address.city}
        </p>
      )}
      {chamado.conflito && (
        <p className="mt-1 font-semibold text-status-aberto">Conflito de horário</p>
      )}
      {chamado.atrasado && (
        <p className="mt-1 font-semibold text-status-cancelado">Atrasado</p>
      )}
    </button>
  );
}
