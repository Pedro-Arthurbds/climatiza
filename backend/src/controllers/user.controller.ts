import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashSenha } from "../utils/hash";

const criarUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "TECNICO"]),
});

const atualizarUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "TECNICO"]).optional(),
  isActive: z.boolean().optional(),
});

// select sem o campo password em toda resposta
const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listar(req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: { name: "asc" },
  });
  return res.json(users);
}

export async function buscar(req: Request, res: Response) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.params.id },
    select: userSelect,
  });
  return res.json(user);
}

export async function criar(req: Request, res: Response) {
  const dados = criarUserSchema.parse(req.body);
  const user = await prisma.user.create({
    data: { ...dados, password: await hashSenha(dados.password) },
    select: userSelect,
  });
  return res.status(201).json(user);
}

export async function atualizar(req: Request, res: Response) {
  const dados = atualizarUserSchema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...dados,
      password: dados.password ? await hashSenha(dados.password) : undefined,
    },
    select: userSelect,
  });
  return res.json(user);
}

// Desativação lógica — mantém o histórico de tickets do técnico intacto.
export async function desativar(req: Request, res: Response) {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false },
    select: userSelect,
  });
  return res.json(user);
}
