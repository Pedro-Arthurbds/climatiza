import { prisma } from "../lib/prisma";
import type { Tx } from "../lib/prisma";

type TipoNotificacao =
  | "MANUTENCAO_VENCIDA"
  | "LEMBRETE_MANUTENCAO"
  | "AGENDAMENTO"
  | "TECNICO_ATRIBUIDO"
  | "CHAMADO_CONCLUIDO";

export async function registrarNotificacao(params: {
  clientId: string;
  serviceTypeId?: string;
  ticketId?: string;
  maintenanceDueAt?: Date;
  type: TipoNotificacao;
  mensagem: string;
}, db: Tx | typeof prisma = prisma) {
  return db.notificationLog.create({
    data: {
      clientId: params.clientId,
      serviceTypeId: params.serviceTypeId,
      ticketId: params.ticketId,
      maintenanceDueAt: params.maintenanceDueAt,
      type: params.type,
      message: params.mensagem,
    },
  });
}
