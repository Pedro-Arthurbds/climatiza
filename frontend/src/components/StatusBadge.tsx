import type { TicketStatus } from "../types";

const rotulo: Record<TicketStatus, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const cor: Record<TicketStatus, string> = {
  ABERTO: "border-[#d9b171] bg-[#f8e5bf] text-[#8a5d1d]",
  EM_ANDAMENTO: "border-[#95afc8] bg-[#dfeaf7] text-[#35577b]",
  CONCLUIDO: "border-[#94b89a] bg-[#dff0e2] text-[#2d6646]",
  CANCELADO: "border-[#d9a39b] bg-[#f6e1df] text-[#8c3d35]",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${cor[status]}`}
    >
      {rotulo[status]}
    </span>
  );
}
