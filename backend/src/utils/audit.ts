import type { Tx } from "../lib/prisma";

export async function registrarAuditoria(
  tx: Tx,
  params: {
    entityType: "Ticket" | "Client" | "Address";
    entityId: string;
    action: string;
    userId?: string;
    changes?: Record<string, unknown>;
  }
) {
  await tx.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      userId: params.userId,
      changes: params.changes as never,
    },
  });
}

// Compara só os campos que vieram no payload contra o valor atual —
// evita gravar o objeto inteiro quando só um campo mudou.
export function diffCampos(
  atual: Record<string, unknown>,
  dados: Record<string, unknown>
) {
  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};
  for (const chave of Object.keys(dados)) {
    const novo = dados[chave];
    if (novo !== undefined && novo !== atual[chave]) {
      before[chave] = atual[chave] ?? null;
      after[chave] = novo;
    }
  }
  return { before, after };
}
