import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Chamado, Cliente } from "../types";
import { formatarDataHoraBrasil } from "../utils/dataBrasil";
import { StatusBadge } from "./StatusBadge";

// Painel lateral com todos os chamados já gerados para um cliente.
// Clicar em um chamado chama `onAbrirChamado`, que abre o painel de detalhes.
// `versao` muda quando um chamado é alterado, para recarregar a lista.
export function HistoricoCliente({
  cliente,
  versao,
  onAbrirChamado,
  onFechar,
}: {
  cliente: Cliente;
  versao: number;
  onAbrirChamado: (chamadoId: string) => void;
  onFechar: () => void;
}) {
  const [chamados, setChamados] = useState<Chamado[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    setErro(null);
    api
      .get<Chamado[]>("/chamados", { params: { clientId: cliente.id } })
      .then((r) => {
        if (ativo) setChamados(r.data);
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível carregar o histórico de chamados.");
      });
    return () => {
      ativo = false;
    };
  }, [cliente.id, versao]);

  const total = chamados?.length ?? 0;
  const abertos =
    chamados?.filter((c) => c.status === "ABERTO" || c.status === "EM_ANDAMENTO").length ?? 0;
  const concluidos = chamados?.filter((c) => c.status === "CONCLUIDO").length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onFechar}>
      <div
        className="flex h-full w-full max-w-2xl flex-col bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border p-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-inkMuted">
              Histórico de chamados
            </p>
            <h2 className="mt-1 break-words text-lg font-extrabold tracking-tight">
              {cliente.name}
            </h2>
            <p className="mt-1 text-sm text-inkMuted">
              {cliente.phone} · {cliente.email}
            </p>
          </div>
          <button
            onClick={onFechar}
            className="rounded-md px-2 py-1 text-sm text-inkMuted hover:bg-surfaceAlt hover:text-ink"
          >
            Fechar
          </button>
        </div>

        {chamados && chamados.length > 0 && (
          <div className="grid grid-cols-3 gap-3 border-b border-border px-6 py-4 text-center">
            <Resumo rotulo="Total" valor={total} />
            <Resumo rotulo="Em aberto" valor={abertos} />
            <Resumo rotulo="Concluídos" valor={concluidos} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {erro && <p className="text-sm text-status-cancelado">{erro}</p>}
          {!erro && chamados === null && (
            <p className="text-sm text-inkMuted">Carregando...</p>
          )}
          {!erro && chamados?.length === 0 && (
            <p className="text-sm text-inkMuted">
              Nenhum chamado foi gerado para este cliente ainda.
            </p>
          )}

          <ul className="flex flex-col gap-3">
            {chamados?.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onAbrirChamado(c.id)}
                  className="w-full rounded-xl border border-border bg-surfaceAlt/60 p-4 text-left transition hover:border-accent hover:bg-surfaceAlt"
                >
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge status={c.status} />
                    <span className="text-xs font-semibold text-inkMuted">
                      #{c.id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-ink">{c.serviceType.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-inkMuted">{c.problem}</p>
                  <p className="mt-2 text-xs text-inkMuted">
                    {c.equipmentBrand} · {c.equipmentLocation}
                  </p>
                  <p className="mt-1 text-xs text-inkMuted">
                    Aberto em {formatarDataHoraBrasil(c.createdAt)}
                    {c.completedAt && ` · Concluído em ${formatarDataHoraBrasil(c.completedAt)}`}
                  </p>
                  <p className="mt-1 text-xs text-inkMuted">
                    Técnico: {c.user?.name ?? "Não atribuído"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Resumo({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-lg border border-border bg-surfaceAlt/60 py-2">
      <p className="text-xl font-extrabold text-ink">{valor}</p>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-inkMuted">
        {rotulo}
      </p>
    </div>
  );
}
