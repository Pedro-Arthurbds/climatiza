import type { TicketStatus } from "../types";

const rotulo: Record<TicketStatus, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const cor: Record<TicketStatus, string> = {
  ABERTO: "border-amber-300/60 bg-amber-50 text-amber-800",
  EM_ANDAMENTO: "border-sky-300/60 bg-sky-50 text-sky-800",
  CONCLUIDO: "border-emerald-300/60 bg-emerald-50 text-emerald-800",
  CANCELADO: "border-rose-300/60 bg-rose-50 text-rose-800",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cor[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {rotulo[status]}
    </span>
  );
}
