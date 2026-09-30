import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const criarLogSchema = z.object({
  clientId: z.string().min(1),
  serviceTypeId: z.string().min(1).optional(),
  type: z.enum([
    "MANUTENCAO_VENCIDA",
    "LEMBRETE_MANUTENCAO",
    "AGENDAMENTO",
    "TECNICO_ATRIBUIDO",
    "CHAMADO_CONCLUIDO",
  ]),
  message: z.string().min(1),
});

export async function listar(req: Request, res: Response) {
  const { clientId, resolution, type } = req.query;
  const logs = await prisma.notificationLog.findMany({
    where: {
      clientId: typeof clientId === "string" ? clientId : undefined,
      type: typeof type === "string" ? (type as never) : undefined,
      resolution:
        resolution === "true" ? true : resolution === "false" ? false : undefined,
    },
    include: {
      client: { select: { id: true, name: true } },
      serviceType: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return res.json(logs);
}

// Criação manual (ADMIN). O envio automático (agendamento, técnico
// atribuído, conclusão, manutenção) acontece pelos próprios controllers
// que disparam essas ações — este endpoint é só pra casos avulsos.
export async function criar(req: Request, res: Response) {
  const dados = criarLogSchema.parse(req.body);
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
