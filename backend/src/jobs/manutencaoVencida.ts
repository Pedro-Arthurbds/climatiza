import { prisma } from "../lib/prisma";

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
  fimJanela.setHours(23, 59, 59, 999);

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
    const resultado = await prisma.notificationLog.createMany({
      data: [{
        clientId: ticket.clientId,
        serviceTypeId: ticket.serviceTypeId,
        ticketId: ticket.id,
        maintenanceDueAt: ticket.maintenanceNextAt!,
        type: "LEMBRETE_MANUTENCAO",
        message: `Retorno preventivo previsto para ${ticket.maintenanceNextAt!.toLocaleString("pt-BR")}.`,
      }],
      skipDuplicates: true,
    });
    criados += resultado.count;
  }

  return { verificados: pendentes.length, criados };
}
