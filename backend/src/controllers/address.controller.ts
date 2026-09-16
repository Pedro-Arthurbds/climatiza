import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

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
  const endereco = await prisma.address.create({
    data: { ...dados, clientId: req.params.clienteId },
  });
  return res.status(201).json(endereco);
}

export async function atualizar(req: Request, res: Response) {
  const dados = enderecoSchema.partial().parse(req.body);
  const endereco = await prisma.address.update({
    where: { id: req.params.id },
    data: dados,
  });
  return res.json(endereco);
}

// Hard delete mesmo — endereço não carrega histórico próprio relevante
// fora dos tickets, que ficam preservados via FK (RESTRICT impede a
// exclusão se houver ticket vinculado a este endereço).
export async function remover(req: Request, res: Response) {
  await prisma.address.delete({ where: { id: req.params.id } });
  return res.status(204).send();
}
