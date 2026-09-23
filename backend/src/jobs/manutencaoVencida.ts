import { prisma } from "../lib/prisma";
import { registrarNotificacao } from "../services/notificacoes";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function diasEntre(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / MS_POR_DIA);
}

// Varre os tipos de serviço recorrentes (maintenanceIntervalDays definido)
// e, pra cada cliente, olha a última vez que ele concluiu um chamado
// daquele tipo. Se já passou do intervalo, é VENCIDA; se está chegando
// perto (dentro da janela de lembrete configurada no Company), é
// LEMBRETE. Só dispara se: (a) o cliente não tem chamado aberto desse
// tipo depois da última conclusão, e (b) não existe alerta do mesmo tipo
// ainda não resolvido pra esse cliente+serviço (evita spam diário).
export async function verificarManutencoes() {
  const [tipos, empresa] = await Promise.all([
    prisma.serviceType.findMany({
      where: { maintenanceIntervalDays: { not: null }, isActive: true },
    }),
    prisma.company.findUnique({
      where: { id: "company-default" },
      select: { maintenanceReminderDays: true },
    }),
  ]);

  if (tipos.length === 0) return { verificados: 0, criados: 0 };

  const reminderDays = empresa?.maintenanceReminderDays ?? 7;
  const tipoMap = new Map(tipos.map((t) => [t.id, t]));

  const ultimasConclusoes = await prisma.$queryRaw<
    { clientId: string; serviceTypeId: string; ultimaConclusao: Date }[]
  >`
    SELECT "clientId", "serviceTypeId", MAX("completedAt") as "ultimaConclusao"
    FROM "Ticket"
    WHERE status = 'CONCLUIDO'
      AND "completedAt" IS NOT NULL
      AND "serviceTypeId" = ANY(${tipos.map((t) => t.id)})
    GROUP BY "clientId", "serviceTypeId"
  `;

  let criados = 0;

  for (const linha of ultimasConclusoes) {
    const tipo = tipoMap.get(linha.serviceTypeId);
    if (!tipo?.maintenanceIntervalDays) continue;

    const diasDesde = diasEntre(new Date(linha.ultimaConclusao), new Date());
    const vencida = diasDesde >= tipo.maintenanceIntervalDays;
    const perto =
      !vencida && diasDesde >= tipo.maintenanceIntervalDays - reminderDays;

    if (!vencida && !perto) continue;

    const temChamadoAberto = await prisma.ticket.count({
      where: {
        clientId: linha.clientId,
        serviceTypeId: linha.serviceTypeId,
        status: { in: ["ABERTO", "EM_ANDAMENTO"] },
        createdAt: { gt: linha.ultimaConclusao },
      },
    });
    if (temChamadoAberto > 0) continue;

    const tipoAlerta = vencida ? "MANUTENCAO_VENCIDA" : "LEMBRETE_MANUTENCAO";

    const jaExiste = await prisma.notificationLog.count({
      where: {
        clientId: linha.clientId,
        serviceTypeId: linha.serviceTypeId,
        type: tipoAlerta,
        resolution: false,
      },
    });
    if (jaExiste > 0) continue;

    const mensagem = vencida
      ? `Manutenção preventiva (${tipo.name}) vencida há ${diasDesde - tipo.maintenanceIntervalDays} dia(s).`
      : `Manutenção preventiva (${tipo.name}) vence em ${tipo.maintenanceIntervalDays - diasDesde} dia(s).`;

    await registrarNotificacao({
      clientId: linha.clientId,
      serviceTypeId: linha.serviceTypeId,
      type: tipoAlerta,
      mensagem,
    });
    criados++;
  }

  return { verificados: ultimasConclusoes.length, criados };
}
