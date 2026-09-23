import { prisma } from "../lib/prisma";
import { enviarNotificacao } from "./notificationChannel";

type TipoNotificacao =
  | "MANUTENCAO_VENCIDA"
  | "LEMBRETE_MANUTENCAO"
  | "AGENDAMENTO"
  | "TECNICO_ATRIBUIDO"
  | "CHAMADO_CONCLUIDO";

// Grava o log (fonte de verdade, aparece na tela de Notificações) e só
// depois tenta enviar — se o envio falhar, o registro já existe e não se
// perde (diferente de mandar primeiro e só depois gravar).
export async function registrarNotificacao(params: {
  clientId: string;
  serviceTypeId?: string;
  type: TipoNotificacao;
  mensagem: string;
}) {
  await prisma.notificationLog.create({
    data: {
      clientId: params.clientId,
      serviceTypeId: params.serviceTypeId,
      type: params.type,
      message: params.mensagem,
    },
  });

  const cliente = await prisma.client.findUnique({
    where: { id: params.clientId },
    select: { email: true, name: true },
  });
  if (!cliente) return;

  await enviarNotificacao({
    destinatario: cliente.email,
    assunto: "Climatiza",
    mensagem: params.mensagem,
  });
}
