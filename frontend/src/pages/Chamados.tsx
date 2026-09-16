import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { ChamadoDrawer } from "../components/ChamadoDrawer";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import type { Chamado, Cliente, TicketStatus, TipoServico, Usuario } from "../types";

const statusOptions: TicketStatus[] = [
  "ABERTO",
  "EM_ANDAMENTO",
  "CONCLUIDO",
  "CANCELADO",
];

export function Chamados() {
  const { user } = useAuth();
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<TicketStatus | "">("");
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [selecionado, setSelecionado] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    const { data } = await api.get<Chamado[]>("/chamados", {
      params: filtroStatus ? { status: filtroStatus } : undefined,
    });
    setChamados(data);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus]);

  async function mudarStatus(id: string, status: TicketStatus) {
    await api.patch(`/chamados/${id}/status`, { status });
    carregar();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Chamados</h1>
          <p className="text-sm text-inkMuted">
            {user?.role === "TECNICO"
              ? "Seus chamados e os ainda sem técnico atribuído."
              : "Todos os chamados abertos na operação."}
          </p>
        </div>

        {user?.role === "ADMIN" && (
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base hover:opacity-90"
          >
            {mostrarForm ? "Fechar" : "Novo chamado"}
          </button>
        )}
      </div>

      {mostrarForm && (
        <NovoChamadoForm
          onCriado={() => {
            setMostrarForm(false);
            carregar();
          }}
        />
      )}

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFiltroStatus("")}
          className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
            filtroStatus === ""
              ? "border-accent text-accent"
              : "border-border text-inkMuted"
          }`}
        >
          Todos
        </button>
        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
              filtroStatus === s
                ? "border-accent text-accent"
                : "border-border text-inkMuted"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surfaceAlt text-xs uppercase text-inkMuted">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Equipamento</th>
              <th className="px-4 py-3">Técnico</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Agendado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-inkMuted">
                  Carregando...
                </td>
              </tr>
            )}
            {!carregando && chamados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-inkMuted">
                  Nenhum chamado encontrado.
                </td>
              </tr>
            )}
            {chamados.map((chamado) => (
              <tr
                key={chamado.id}
                onClick={() => setSelecionado(chamado.id)}
                className="cursor-pointer border-t border-border hover:bg-surfaceAlt"
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{chamado.client.name}</p>
                  <p className="text-xs text-inkMuted">{chamado.problem}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{chamado.equipmentBrand}</p>
                  <p className="text-xs text-inkMuted">
                    {chamado.equipmentLocation}
                  </p>
                </td>
                <td className="px-4 py-3">{chamado.user?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={chamado.status} />
                </td>
                <td className="px-4 py-3 text-inkMuted">
                  {chamado.scheduledAt
                    ? new Date(chamado.scheduledAt).toLocaleDateString("pt-BR")
                    : "—"}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={chamado.status}
                    onChange={(e) =>
                      mudarStatus(chamado.id, e.target.value as TicketStatus)
                    }
                    className="rounded-md border border-border bg-surfaceAlt px-2 py-1 text-xs"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

function NovoChamadoForm({ onCriado }: { onCriado: () => void }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tipos, setTipos] = useState<TipoServico[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [clientId, setClientId] = useState("");
  const [addressId, setAddressId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [userId, setUserId] = useState("");
  const [equipmentBrand, setEquipmentBrand] = useState("");
  const [equipmentLocation, setEquipmentLocation] = useState("");
  const [problem, setProblem] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get<Cliente[]>("/clientes").then((r) => setClientes(r.data));
    api.get<TipoServico[]>("/tipos-servico").then((r) => setTipos(r.data));
    api
      .get<Usuario[]>("/usuarios")
      .then((r) => setTecnicos(r.data.filter((u) => u.role === "TECNICO")));
  }, []);

  const clienteSelecionado = clientes.find((c) => c.id === clientId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post("/chamados", {
        clientId,
        addressId,
        serviceTypeId,
        userId: userId || undefined,
        equipmentBrand,
        equipmentLocation,
        problem,
      });
      onCriado();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-6"
    >
      <Campo label="Cliente">
        <select
          required
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            setAddressId("");
          }}
          className="campo-select"
        >
          <option value="">Selecione</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Endereço">
        <select
          required
          value={addressId}
          onChange={(e) => setAddressId(e.target.value)}
          disabled={!clienteSelecionado}
          className="campo-select"
        >
          <option value="">Selecione</option>
          {clienteSelecionado?.addresses.map((end) => (
            <option key={end.id} value={end.id}>
              {end.street}, {end.number}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Tipo de serviço">
        <select
          required
          value={serviceTypeId}
          onChange={(e) => setServiceTypeId(e.target.value)}
          className="campo-select"
        >
          <option value="">Selecione</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Técnico (opcional)">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="campo-select"
        >
          <option value="">Sem atribuição ainda</option>
          {tecnicos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Marca do equipamento">
        <input
          required
          value={equipmentBrand}
          onChange={(e) => setEquipmentBrand(e.target.value)}
          className="campo-input"
        />
      </Campo>

      <Campo label="Local do equipamento">
        <input
          required
          value={equipmentLocation}
          onChange={(e) => setEquipmentLocation(e.target.value)}
          placeholder="Ex.: sala, quarto 2..."
          className="campo-input"
        />
      </Campo>

      <div className="col-span-2">
        <Campo label="Problema relatado">
          <textarea
            required
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows={3}
            className="campo-input"
          />
        </Campo>
      </div>

      <div className="col-span-2 flex justify-end">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base hover:opacity-90 disabled:opacity-50"
        >
          {enviando ? "Abrindo..." : "Abrir chamado"}
        </button>
      </div>
    </form>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-inkMuted">
        {label}
      </span>
      {children}
    </label>
  );
}
