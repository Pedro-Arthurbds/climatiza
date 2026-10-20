import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import { notificationScope } from "../utils/notificationScope";

const tipoNotificacaoSchema = z.enum([
  "MANUTENCAO_VENCIDA",
  "LEMBRETE_MANUTENCAO",
  "AGENDAMENTO",
  "TECNICO_ATRIBUIDO",
  "CHAMADO_CONCLUIDO",
]);

const criarLogSchema = z.object({
  clientId: z.string().min(1),
  serviceTypeId: z.string().min(1).optional(),
  ticketId: z.string().min(1).optional(),
  type: tipoNotificacaoSchema,
  message: z.string().min(1),
});

const filtrosListagemSchema = z.object({
  clientId: z.string().min(1).optional(),
  resolution: z.enum(["true", "false"]).optional(),
  type: tipoNotificacaoSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const filtroContagemSchema = z.object({
  resolution: z.enum(["true", "false"]).default("false"),
});

export async function listar(req: Request, res: Response) {
  const filtros = filtrosListagemSchema.parse(req.query);
  const where = {
    ...notificationScope(req.userRole, req.userId),
    clientId: filtros.clientId,
    type: filtros.type,
    resolution:
      filtros.resolution === undefined ? undefined : filtros.resolution === "true",
  };
  const [items, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        serviceType: { select: { id: true, name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (filtros.page - 1) * filtros.pageSize,
      take: filtros.pageSize,
    }),
    prisma.notificationLog.count({ where }),
  ]);
  return res.json({
    items,
    page: filtros.page,
    pageSize: filtros.pageSize,
    total,
  });
}

export async function contar(req: Request, res: Response) {
  const { resolution } = filtroContagemSchema.parse(req.query);
  const total = await prisma.notificationLog.count({
    where: {
      ...notificationScope(req.userRole, req.userId),
      resolution: resolution === "true",
    },
  });
  return res.json({ total });
}

// Criação manual (ADMIN); não dispara comunicação externa.
export async function criar(req: Request, res: Response) {
  const dados = criarLogSchema.parse(req.body);
  if (dados.ticketId) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: dados.ticketId },
      select: { clientId: true },
    });
    if (!ticket) throw new AppError("Chamado não encontrado", 404);
    if (ticket.clientId !== dados.clientId) {
      throw new AppError("O chamado não pertence ao cliente informado", 400);
    }
  }
  const log = await prisma.notificationLog.create({ data: dados });
  return res.status(201).json(log);
}

export async function marcarResolvido(req: Request, res: Response) {
  const log = await prisma.notificationLog.update({
    where: { id: (req.params.id as string) },
    data: { resolution: true },
  });
  return res.json(log);
}
