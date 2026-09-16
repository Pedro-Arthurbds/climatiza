import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type {
  ChamadoDetalhe,
  TicketStatus,
  TipoServico,
  Usuario,
} from "../types";
import { StatusBadge } from "./StatusBadge";

const statusOptions: TicketStatus[] = [
  "ABERTO",
  "EM_ANDAMENTO",
  "CONCLUIDO",
  "CANCELADO",
];

const rotuloStatus: Record<TicketStatus, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

function formatarData(valor: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// Converte ISO -> valor aceito por <input type="datetime-local">, que não
// entende timezone nem segundos.
function paraInputLocal(valor: string | null) {
  if (!valor) return "";
  const d = new Date(valor);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function ChamadoDrawer({
  chamadoId,
  onFechar,
  onMudou,
}: {
  chamadoId: string;
  onFechar: () => void;
  onMudou?: () => void;
}) {
  const { user } = useAuth();
  const ehAdmin = user?.role === "ADMIN";

  const [chamado, setChamado] = useState<ChamadoDetalhe | null>(null);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [tipos, setTipos] = useState<TipoServico[]>([]);
  const [aba, setAba] = useState<"detalhes" | "historico" | "notas" | "anexos">(
    "detalhes"
  );
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);

  async function carregar() {
    const { data } = await api.get<ChamadoDetalhe>(`/chamados/${chamadoId}`);
    setChamado(data);
  }

  useEffect(() => {
    carregar();
    if (ehAdmin) {
      api
        .get<Usuario[]>("/usuarios")
        .then((r) => setTecnicos(r.data.filter((u) => u.role === "TECNICO" && u.isActive)));
      api.get<TipoServico[]>("/tipos-servico").then((r) => setTipos(r.data));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamadoId]);

  async function executar(fn: () => Promise<unknown>) {
    setErro(null);
    try {
      await fn();
      await carregar();
      onMudou?.();
    } catch (e: any) {
      setErro(e?.response?.data?.error ?? "Não foi possível concluir a ação.");
    }
  }

  if (!chamado) {
    return (
      <Overlay onFechar={onFechar}>
        <p className="p-6 text-sm text-inkMuted">Carregando...</p>
      </Overlay>
    );
  }

  return (
    <Overlay onFechar={onFechar}>
      <div className="flex items-start justify-between border-b border-border p-6">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <StatusBadge status={chamado.status} />
            {chamado.scheduledAt &&
              new Date(chamado.scheduledAt) < new Date() &&
              (chamado.status === "ABERTO" || chamado.status === "EM_ANDAMENTO") && (
                <span className="text-xs font-semibold text-status-cancelado">
                  Atrasado
                </span>
              )}
          </div>
          <h2 className="text-lg font-extrabold tracking-tight">
            {chamado.client.name}
          </h2>
          <p className="text-sm text-inkMuted">{chamado.serviceType.name}</p>
        </div>
        <button
          onClick={onFechar}
          className="rounded-md px-2 py-1 text-sm text-inkMuted hover:bg-surfaceAlt hover:text-ink"
        >
          Fechar
        </button>
      </div>

      {erro && (
        <p className="border-b border-border bg-status-cancelado/10 px-6 py-3 text-sm text-status-cancelado">
          {erro}
        </p>
      )}

      <div className="flex gap-1 border-b border-border px-6 pt-4">
        {(["detalhes", "historico", "notas", "anexos"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium capitalize ${
              aba === a
                ? "border-b-2 border-accent text-accent"
                : "text-inkMuted hover:text-ink"
            }`}
          >
            {a === "historico" ? "Histórico" : a}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {aba === "detalhes" && (
          <div className="flex flex-col gap-6">
            <AcoesRapidas
              chamado={chamado}
              ehAdmin={ehAdmin}
              tecnicos={tecnicos}
              executar={executar}
            />

            {ehAdmin && (
              <button
                onClick={() => setEditando((v) => !v)}
                className="self-start text-xs font-semibold text-accent hover:underline"
              >
                {editando ? "Cancelar edição" : "Editar dados do chamado"}
              </button>
            )}

            {editando && ehAdmin ? (
              <FormEdicao
                chamado={chamado}
                tipos={tipos}
                executar={executar}
                aoSalvar={() => setEditando(false)}
              />
            ) : (
              <>
                <Secao titulo="Cliente e endereço">
                  <Linha rotulo="Cliente" valor={chamado.client.name} />
                  <Linha rotulo="Telefone" valor={chamado.client.phone} />
                  <Linha rotulo="E-mail" valor={chamado.client.email} />
                  <Linha
                    rotulo="Endereço"
                    valor={`${chamado.address.street}, ${chamado.address.number} — ${chamado.address.neighborhood}, ${chamado.address.city}/${chamado.address.state}`}
                  />
                </Secao>

                <Secao titulo="Equipamento">
                  <Linha rotulo="Marca" valor={chamado.equipmentBrand} />
                  <Linha rotulo="Local" valor={chamado.equipmentLocation} />
                  <Linha rotulo="Problema relatado" valor={chamado.problem} />
                </Secao>

                <Secao titulo="Atendimento">
                  <Linha rotulo="Técnico" valor={chamado.user?.name ?? "Não atribuído"} />
                  <Linha rotulo="Aberto em" valor={formatarData(chamado.createdAt)} />
                  <Linha rotulo="Agendado para" valor={formatarData(chamado.scheduledAt)} />
                  <Linha rotulo="Concluído em" valor={formatarData(chamado.completedAt)} />
                </Secao>
              </>
            )}
          </div>
        )}

        {aba === "historico" && (
          <ol className="flex flex-col gap-3">
            {chamado.statusHistory.length === 0 && (
              <p className="text-sm text-inkMuted">Nenhuma alteração registrada.</p>
            )}
            {chamado.statusHistory.map((h) => (
              <li key={h.id} className="rounded-md border border-border bg-surfaceAlt p-3">
                <p className="text-sm">
                  {h.fromStatus
                    ? `${rotuloStatus[h.fromStatus]} → ${rotuloStatus[h.toStatus]}`
                    : rotuloStatus[h.toStatus]}
                </p>
                {h.note && <p className="mt-1 text-xs text-inkMuted">{h.note}</p>}
                <p className="mt-1 text-xs text-inkMuted">
                  {h.user?.name ?? "Sistema"} · {formatarData(h.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        )}

        {aba === "notas" && (
          <Notas chamado={chamado} executar={executar} />
        )}

        {aba === "anexos" && (
          <Anexos chamado={chamado} ehAdmin={ehAdmin} executar={executar} />
        )}
      </div>
    </Overlay>
  );
}

function AcoesRapidas({
  chamado,
  ehAdmin,
  tecnicos,
  executar,
}: {
  chamado: ChamadoDetalhe;
  ehAdmin: boolean;
  tecnicos: Usuario[];
  executar: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [novaData, setNovaData] = useState(paraInputLocal(chamado.scheduledAt));

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surfaceAlt p-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-inkMuted">Status</p>
        <div className="flex flex-wrap gap-2">
          {statusOptions
            .filter((s) => s !== chamado.status)
            .map((s) => (
              <button
                key={s}
                onClick={() =>
                  executar(() => api.patch(`/chamados/${chamado.id}/status`, { status: s }))
                }
                className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent"
              >
                {rotuloStatus[s]}
              </button>
            ))}
        </div>
      </div>

      {ehAdmin && (
        <>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-inkMuted">
              Técnico responsável
            </p>
            <select
              value={chamado.userId ?? ""}
              onChange={(e) =>
                executar(() =>
                  api.patch(`/chamados/${chamado.id}/atribuir`, {
                    userId: e.target.value || null,
                  })
                )
              }
              className="campo-select max-w-xs"
            >
              <option value="">Sem atribuição</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-inkMuted">
              Reagendar
            </p>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={novaData}
                onChange={(e) => setNovaData(e.target.value)}
                className="campo-input max-w-xs"
              />
              <button
                onClick={() =>
                  executar(() =>
                    api.patch(`/chamados/${chamado.id}/reagendar`, {
                      scheduledAt: novaData ? new Date(novaData).toISOString() : null,
                    })
                  )
                }
                className="rounded-md bg-accent px-3 py-2 text-xs font-semibold text-base hover:opacity-90"
              >
                Salvar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FormEdicao({
  chamado,
  tipos,
  executar,
  aoSalvar,
}: {
  chamado: ChamadoDetalhe;
  tipos: TipoServico[];
  executar: (fn: () => Promise<unknown>) => Promise<void>;
  aoSalvar: () => void;
}) {
  const [equipmentBrand, setEquipmentBrand] = useState(chamado.equipmentBrand);
  const [equipmentLocation, setEquipmentLocation] = useState(chamado.equipmentLocation);
  const [problem, setProblem] = useState(chamado.problem);
  const [serviceTypeId, setServiceTypeId] = useState(chamado.serviceTypeId);
  const [addressId, setAddressId] = useState(chamado.addressId);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surfaceAlt p-4">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase text-inkMuted">
          Endereço de atendimento
        </span>
        <select
          value={addressId}
          onChange={(e) => setAddressId(e.target.value)}
          className="campo-select"
        >
          {chamado.client.addresses.map((end) => (
            <option key={end.id} value={end.id}>
              {end.street}, {end.number} — {end.city}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase text-inkMuted">
          Tipo de serviço
        </span>
        <select
          value={serviceTypeId}
          onChange={(e) => setServiceTypeId(e.target.value)}
          className="campo-select"
        >
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase text-inkMuted">
          Marca do equipamento
        </span>
        <input
          value={equipmentBrand}
          onChange={(e) => setEquipmentBrand(e.target.value)}
          className="campo-input"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase text-inkMuted">
          Local do equipamento
        </span>
        <input
          value={equipmentLocation}
          onChange={(e) => setEquipmentLocation(e.target.value)}
          className="campo-input"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase text-inkMuted">
          Problema relatado
        </span>
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          rows={3}
          className="campo-input"
        />
      </label>

      <button
        onClick={() =>
          executar(async () => {
            await api.patch(`/chamados/${chamado.id}`, {
              equipmentBrand,
              equipmentLocation,
              problem,
              serviceTypeId,
              addressId,
            });
            aoSalvar();
          })
        }
        className="self-start rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base hover:opacity-90"
      >
        Salvar alterações
      </button>
    </div>
  );
}

function Notas({
  chamado,
  executar,
}: {
  chamado: ChamadoDetalhe;
  executar: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [content, setContent] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Observação interna (não visível ao cliente)"
          className="campo-input"
        />
        <button
          disabled={!content.trim()}
          onClick={() =>
            executar(async () => {
              await api.post(`/chamados/${chamado.id}/notas`, { content });
              setContent("");
            })
          }
          className="self-start rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base hover:opacity-90 disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>

      {chamado.notes.length === 0 && (
        <p className="text-sm text-inkMuted">Nenhuma observação registrada.</p>
      )}
      <ul className="flex flex-col gap-3">
        {chamado.notes.map((n) => (
          <li key={n.id} className="rounded-md border border-border bg-surfaceAlt p-3">
            <p className="text-sm">{n.content}</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-inkMuted">
                {n.user?.name ?? "—"} · {formatarData(n.createdAt)}
              </p>
              <button
                onClick={() =>
                  executar(() => api.delete(`/chamados/${chamado.id}/notas/${n.id}`))
                }
                className="text-xs font-semibold text-status-cancelado hover:underline"
              >
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Anexos({
  chamado,
  ehAdmin,
  executar,
}: {
  chamado: ChamadoDetalhe;
  ehAdmin: boolean;
  executar: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [filename, setFilename] = useState("");
  const [url, setUrl] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-border bg-surfaceAlt p-4">
        <p className="mb-3 text-xs text-inkMuted">
          Upload de arquivo ainda não está ligado — cole o link da foto ou
          documento por enquanto.
        </p>
        <div className="flex flex-col gap-2">
          <input
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="Nome do arquivo"
            className="campo-input"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="campo-input"
          />
          <button
            disabled={!filename.trim() || !url.trim()}
            onClick={() =>
              executar(async () => {
                await api.post(`/chamados/${chamado.id}/anexos`, { filename, url });
                setFilename("");
                setUrl("");
              })
            }
            className="self-start rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base hover:opacity-90 disabled:opacity-50"
          >
            Anexar
          </button>
        </div>
      </div>

      {chamado.attachments.length === 0 && (
        <p className="text-sm text-inkMuted">Nenhum anexo.</p>
      )}
      <ul className="flex flex-col gap-2">
        {chamado.attachments.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between rounded-md border border-border bg-surfaceAlt p-3"
          >
            <div>
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-accent hover:underline"
              >
                {a.filename}
              </a>
              <p className="text-xs text-inkMuted">
                {a.uploadedBy?.name ?? "—"} · {formatarData(a.createdAt)}
              </p>
            </div>
            {ehAdmin && (
              <button
                onClick={() =>
                  executar(() => api.delete(`/chamados/${chamado.id}/anexos/${a.id}`))
                }
                className="text-xs font-semibold text-status-cancelado hover:underline"
              >
                Remover
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Overlay({
  children,
  onFechar,
}: {
  children: React.ReactNode;
  onFechar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onFechar}>
      <div
        className="flex h-full w-full max-w-2xl flex-col bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase text-inkMuted">{titulo}</p>
      <div className="flex flex-col gap-1 rounded-md border border-border bg-surfaceAlt p-4">
        {children}
      </div>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-40 shrink-0 text-inkMuted">{rotulo}</span>
      <span>{valor}</span>
    </div>
  );
}
