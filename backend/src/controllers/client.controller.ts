import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { diffCampos, registrarAuditoria } from "../utils/audit";

const enderecoSchema = z.object({
  street: z.string().min(1),
  number: z.string().min(1),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zipcode: z.string().min(1),
});

const criarClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  doc: z.string().min(1),
  phone: z.string().min(1),
  addresses: z.array(enderecoSchema).min(1),
});

const atualizarClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  doc: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function listar(req: Request, res: Response) {
  const somenteAtivos = req.query.all !== "true";
  const clients = await prisma.client.findMany({
    where: somenteAtivos ? { isActive: true } : undefined,
    include: { addresses: true },
    orderBy: { name: "asc" },
  });
  return res.json(clients);
}

export async function buscar(req: Request, res: Response) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: (req.params.id as string) },
    include: { addresses: true },
  });
  return res.json(client);
}

export async function criar(req: Request, res: Response) {
  const { addresses, ...dados } = criarClientSchema.parse(req.body);

  const client = await prisma.$transaction(async (tx) => {
    const criado = await tx.client.create({
      data: { ...dados, addresses: { create: addresses } },
    });
    await registrarAuditoria(tx, {
      entityType: "Client",
      entityId: criado.id,
      action: "CREATED",
      userId: req.userId,
      changes: dados,
    });
    return tx.client.findUniqueOrThrow({
      where: { id: criado.id },
      include: { addresses: true },
    });
  });

  return res.status(201).json(client);
}

export async function atualizar(req: Request, res: Response) {
  const dados = atualizarClientSchema.parse(req.body);
  const atual = await prisma.client.findUniqueOrThrow({ where: { id: (req.params.id as string) } });
  const { before, after } = diffCampos(atual, dados);

  const client = await prisma.$transaction(async (tx) => {
    await tx.client.update({ where: { id: atual.id }, data: dados });
    if (Object.keys(after).length > 0) {
      await registrarAuditoria(tx, {
        entityType: "Client",
        entityId: atual.id,
        action: "UPDATED",
        userId: req.userId,
        changes: { before, after },
      });
    }
    return tx.client.findUniqueOrThrow({
      where: { id: atual.id },
      include: { addresses: true },
    });
  });

  return res.json(client);
}

// Soft delete — cliente pode ter chamados vinculados (relação RESTRICT).
export async function desativar(req: Request, res: Response) {
  const client = await prisma.$transaction(async (tx) => {
    const atualizado = await tx.client.update({
      where: { id: (req.params.id as string) },
      data: { isActive: false },
    });
    await registrarAuditoria(tx, {
      entityType: "Client",
      entityId: (req.params.id as string),
      action: "DEACTIVATED",
      userId: req.userId,
    });
    return atualizado;
  });
  return res.json(client);
}
