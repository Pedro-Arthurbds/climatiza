import { prisma } from "../lib/prisma";
import { registrarNotificacao } from "../services/notificacoes";

// Alerta somente retornos de atendimentos concluídos, dentro da janela
// configurada na empresa. Chamados cancelados ou ainda em andamento não geram retorno.
export async function verificarRetornosPreventivos() {
  const agora = new Date();
  const inicioHoje = new Date(agora);
  inicioHoje.setHours(0, 0, 0, 0);
  const empresa = await prisma.company.findUnique({
    where: { id: "company-default" },
    select: { maintenanceReminderDays: true },
  });
  const diasAviso = empresa?.maintenanceReminderDays ?? 7;
  const fimJanela = new Date(agora);
  fimJanela.setDate(fimJanela.getDate() + diasAviso);

  const pendentes = await prisma.ticket.findMany({
    where: {
      isPreventiveMaintenance: true,
      maintenanceNextAt: { gte: inicioHoje, lte: fimJanela },
      status: "CONCLUIDO",
      completedAt: { not: null },
    },
  });

  let criados = 0;

  for (const ticket of pendentes) {
    const inicioAviso = new Date(ticket.maintenanceNextAt!);
    inicioAviso.setDate(inicioAviso.getDate() - diasAviso);
    const jaExiste = await prisma.notificationLog.count({
      where: {
        clientId: ticket.clientId,
        serviceTypeId: ticket.serviceTypeId,
        type: "LEMBRETE_MANUTENCAO",
        createdAt: { gte: inicioAviso },
        message: { startsWith: "Retorno preventivo previsto para" },
      },
    });

    if (jaExiste > 0) continue;

    await registrarNotificacao({
      clientId: ticket.clientId,
      serviceTypeId: ticket.serviceTypeId,
      type: "LEMBRETE_MANUTENCAO",
      mensagem: `Retorno preventivo previsto para ${new Date(ticket.maintenanceNextAt!).toLocaleString("pt-BR")}.`,
      enviarAoCliente: false,
    });
    criados++;
  }

  return { verificados: pendentes.length, criados };
}
