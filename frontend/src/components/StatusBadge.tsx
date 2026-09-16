import type { TicketStatus } from "../types";

const rotulo: Record<TicketStatus, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const cor: Record<TicketStatus, string> = {
  ABERTO: "bg-status-aberto/15 text-status-aberto border-status-aberto/30",
  EM_ANDAMENTO: "bg-status-andamento/15 text-status-andamento border-status-andamento/30",
  CONCLUIDO: "bg-status-concluido/15 text-status-concluido border-status-concluido/30",
  CANCELADO: "bg-status-cancelado/15 text-status-cancelado border-status-cancelado/30",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${cor[status]}`}
    >
      {rotulo[status]}
    </span>
  );
}
