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

export async function criar(req: Request, res: Response) {
  const dados = enderecoSchema.parse(req.body);

  const endereco = await prisma.$transaction(async (tx) => {
    const criado = await tx.address.create({
      data: { ...dados, clientId: (req.params.clienteId as string) },
    });
    await registrarAuditoria(tx, {
      entityType: "Address",
      entityId: criado.id,
      action: "CREATED",
      userId: req.userId,
      changes: { ...dados, clientId: (req.params.clienteId as string) },
    });
    return criado;
  });

  return res.status(201).json(endereco);
}

export async function atualizar(req: Request, res: Response) {
  const dados = enderecoSchema.partial().parse(req.body);
  const atual = await prisma.address.findUniqueOrThrow({ where: { id: (req.params.id as string) } });
  const { before, after } = diffCampos(atual, dados);

  const endereco = await prisma.$transaction(async (tx) => {
    const atualizado = await tx.address.update({ where: { id: atual.id }, data: dados });
    if (Object.keys(after).length > 0) {
      await registrarAuditoria(tx, {
        entityType: "Address",
        entityId: atual.id,
        action: "UPDATED",
        userId: req.userId,
        changes: { before, after },
      });
    }
    return atualizado;
  });

  return res.json(endereco);
}

// Hard delete mesmo — endereço não carrega histórico próprio relevante
// fora dos tickets, que ficam preservados via FK (RESTRICT impede a
// exclusão se houver ticket vinculado a este endereço).
export async function remover(req: Request, res: Response) {
  await prisma.$transaction(async (tx) => {
    await registrarAuditoria(tx, {
      entityType: "Address",
      entityId: (req.params.id as string),
      action: "DELETED",
      userId: req.userId,
    });
    await tx.address.delete({ where: { id: (req.params.id as string) } });
  });
  return res.status(204).send();
}
