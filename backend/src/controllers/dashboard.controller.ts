import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const STATUS_ABERTOS = ["ABERTO", "EM_ANDAMENTO"] as const;

async function obterSlaHours() {
  const empresa = await prisma.company.findUnique({
    where: { id: "company-default" },
    select: { slaHours: true },
  });
  return empresa?.slaHours ?? 24;
}

// Cards principais: contagem por status, atrasados, agendados hoje,
// sem técnico e tempo médio de atendimento.
export async function resumo(_req: Request, res: Response) {
  const slaHours = await obterSlaHours();
  const cutoff = new Date(Date.now() - slaHours * 60 * 60 * 1000);

  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);
  const fimHoje = new Date();
  fimHoje.setHours(23, 59, 59, 999);

  const [porStatus, atrasados, agendadosHoje, semTecnico, tempoMedio] =
    await Promise.all([
      prisma.ticket.groupBy({ by: ["status"], _count: true }),

      prisma.ticket.count({
        where: {
          status: { in: [...STATUS_ABERTOS] },
          OR: [
            { scheduledAt: { lt: new Date() } },
            { AND: [{ scheduledAt: null }, { createdAt: { lt: cutoff } }] },
          ],
        },
      }),

      prisma.ticket.count({
        where: {
          scheduledAt: { gte: inicioHoje, lte: fimHoje },
          status: { not: "CANCELADO" },
        },
      }),

      prisma.ticket.count({
        where: { userId: null, status: "ABERTO" },
      }),

      prisma.$queryRaw<{ media_horas: unknown }[]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("completedAt" - "createdAt")) / 3600) as media_horas
        FROM "Ticket"
        WHERE status = 'CONCLUIDO' AND "completedAt" IS NOT NULL
      `,
    ]);

  const contagem = Object.fromEntries(
    porStatus.map((p) => [p.status, p._count])
  );

  return res.json({
    abertos: contagem.ABERTO ?? 0,
    emAndamento: contagem.EM_ANDAMENTO ?? 0,
    concluidos: contagem.CONCLUIDO ?? 0,
    cancelados: contagem.CANCELADO ?? 0,
    atrasados,
    agendadosHoje,
    semTecnico,
    tempoMedioAtendimentoHoras:
      tempoMedio[0]?.media_horas != null
        ? Number(Number(tempoMedio[0].media_horas).toFixed(1))
        : null,
    slaHoras: slaHours,
  });
}

// Carga atual (chamados abertos/andamento) e ranking (concluídos) por técnico.
export async function porTecnico(_req: Request, res: Response) {
  const [cargaAtual, concluidosPorTecnico, tecnicos] = await Promise.all([
    prisma.ticket.groupBy({
      by: ["userId"],
      where: { status: { in: [...STATUS_ABERTOS] }, userId: { not: null } },
      _count: true,
    }),
    prisma.ticket.groupBy({
      by: ["userId"],
      where: { status: "CONCLUIDO", userId: { not: null } },
      _count: true,
    }),
    prisma.user.findMany({
      where: { role: "TECNICO", isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  const cargaMap = new Map(cargaAtual.map((c) => [c.userId, c._count]));
  const concluidosMap = new Map(
    concluidosPorTecnico.map((c) => [c.userId, c._count])
  );

  const dados = tecnicos
    .map((t) => ({
      userId: t.id,
      nome: t.name,
      cargaAtual: cargaMap.get(t.id) ?? 0,
      concluidos: concluidosMap.get(t.id) ?? 0,
    }))
    .sort((a, b) => b.concluidos - a.concluidos);

  return res.json(dados);
}

// Chamados por mês (últimos 6 meses) e por tipo de serviço.
export async function grafico(_req: Request, res: Response) {
  const [porPeriodo, porTipoRaw, tipos] = await Promise.all([
    prisma.$queryRaw<{ periodo: Date; total: bigint }[]>`
      SELECT date_trunc('month', "createdAt") as periodo, COUNT(*) as total
      FROM "Ticket"
      WHERE "createdAt" >= now() - interval '6 months'
      GROUP BY periodo
      ORDER BY periodo
    `,
    prisma.ticket.groupBy({ by: ["serviceTypeId"], _count: true }),
    prisma.serviceType.findMany({ select: { id: true, name: true } }),
  ]);

  const nomeTipo = new Map(tipos.map((t) => [t.id, t.name]));

  return res.json({
    porPeriodo: porPeriodo.map((p) => ({
      periodo: p.periodo,
      total: Number(p.total),
    })),
    porTipoServico: porTipoRaw.map((p) => ({
      tipo: nomeTipo.get(p.serviceTypeId) ?? "Desconhecido",
      total: p._count,
    })),
  });
}

// Alertas de manutenção vencida ainda não resolvidos.
export async function alertas(_req: Request, res: Response) {
  const logs = await prisma.notificationLog.findMany({
    where: { type: "MANUTENCAO_VENCIDA", resolution: false },
    include: { client: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return res.json(logs);
}