import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const criarLogSchema = z.object({
  clientId: z.string().min(1),
  type: z.literal("MANUTENCAO_VENCIDA"),
  message: z.string().min(1),
});

export async function listar(req: Request, res: Response) {
  const { clientId, resolution } = req.query;
  const logs = await prisma.notificationLog.findMany({
    where: {
      clientId: typeof clientId === "string" ? clientId : undefined,
      resolution:
        resolution === "true" ? true : resolution === "false" ? false : undefined,
    },
    include: { client: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json(logs);
}

// Criação manual (ADMIN). O envio automático por vencimento de manutenção
// fica pra uma rotina agendada à parte — este endpoint só registra o log.
export async function criar(req: Request, res: Response) {
  const dados = criarLogSchema.parse(req.body);
  const log = await prisma.notificationLog.create({ data: dados });
  return res.status(201).json(log);
}

export async function marcarResolvido(req: Request, res: Response) {
  const log = await prisma.notificationLog.update({
    where: { id: req.params.id },
    data: { resolution: true },
  });
  return res.json(log);
}
