import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useResponsivePageSize } from "../hooks/useResponsivePageSize";
import type { Chamado, Cliente } from "../types";
import { formatarDataHoraBrasil } from "../utils/dataBrasil";
import { StatusBadge } from "./StatusBadge";

// Painel lateral com o histórico de chamados de um cliente.
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
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [pagina, setPagina] = useState(1);
  const pageSize = useResponsivePageSize(() => setPagina(1));
  const [total, setTotal] = useState(0);
  const [resumo, setResumo] = useState({ total: 0, abertos: 0, concluidos: 0 });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);
    api
      .get<{
        items: Chamado[];
        total: number;
        resumo: { total: number; abertos: number; concluidos: number };
      }>("/chamados", {
        params: { clientId: cliente.id, page: pagina, pageSize },
      })
      .then((r) => {
        if (!ativo) return;
        setChamados(r.data.items);
        setTotal(r.data.total);
        setResumo(r.data.resumo);
        const ultimaPagina = Math.max(1, Math.ceil(r.data.total / pageSize));
        if (pagina > ultimaPagina) setPagina(ultimaPagina);
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível carregar o histórico de chamados.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [cliente.id, versao, pagina, pageSize]);

  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));

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

        {total > 0 && (
          <div className="grid grid-cols-3 gap-3 border-b border-border px-6 py-4 text-center">
            <Resumo rotulo="Total" valor={resumo.total} />
            <Resumo rotulo="Em aberto" valor={resumo.abertos} />
            <Resumo rotulo="Concluídos" valor={resumo.concluidos} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {erro && <p className="text-sm text-status-cancelado">{erro}</p>}
          {!erro && carregando && (
            <p className="text-sm text-inkMuted">Carregando...</p>
          )}
          {!erro && !carregando && total === 0 && (
            <p className="text-sm text-inkMuted">
              Nenhum chamado foi gerado para este cliente ainda.
            </p>
          )}

          <ul className="flex flex-col gap-3">
            {chamados.map((c) => (
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
          {total > pageSize && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
              <span className="text-inkMuted">
                Página {pagina} de {totalPaginas} · {total} chamados
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
