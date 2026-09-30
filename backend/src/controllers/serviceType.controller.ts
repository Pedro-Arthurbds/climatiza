import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const serviceTypeSchema = z.object({
  name: z.string().min(1),
  isActive: z.boolean().optional(),
});

export async function listar(req: Request, res: Response) {
  const somenteAtivos = req.query.all !== "true";
  const tipos = await prisma.serviceType.findMany({
    where: somenteAtivos ? { isActive: true } : undefined,
    orderBy: { name: "asc" },
  });
  return res.json(tipos);
}

export async function criar(req: Request, res: Response) {
  const dados = serviceTypeSchema.parse(req.body);
  const tipo = await prisma.serviceType.create({ data: dados });
  return res.status(201).json(tipo);
}

export async function atualizar(req: Request, res: Response) {
  const dados = serviceTypeSchema.partial().parse(req.body);
  const tipo = await prisma.serviceType.update({
    where: { id: (req.params.id as string) },
    data: dados,
  });
  return res.json(tipo);
}

export async function desativar(req: Request, res: Response) {
  const tipo = await prisma.serviceType.update({
    where: { id: (req.params.id as string) },
    data: { isActive: false },
  });
  return res.json(tipo);
}
