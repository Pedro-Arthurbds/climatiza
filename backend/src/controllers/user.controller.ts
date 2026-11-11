import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import { diffCampos, registrarAuditoria } from "../utils/audit";
import { hashSenha } from "../utils/hash";
import { senhaForteSchema } from "../utils/senhaValidator";

function emailDonoConfigurado(email: string) {
  const emailDono = process.env.BILLING_OWNER_EMAIL?.trim().toLowerCase();
  return Boolean(emailDono && email.trim().toLowerCase() === emailDono);
}

const criarUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: senhaForteSchema,
  role: z.enum(["ADMIN", "TECNICO"]),
});

const atualizarUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: senhaForteSchema.optional(),
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
  mustChangePassword: true,
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
    where: { id: (req.params.id as string) },
    select: userSelect,
  });
  return res.json(user);
}

export async function criar(req: Request, res: Response) {
  const dados = criarUserSchema.parse(req.body);
  if (emailDonoConfigurado(dados.email)) {
    throw new AppError("Este e-mail está reservado para a conta do proprietário", 409);
  }

  const user = await prisma.$transaction(async (tx) => {
    const criado = await tx.user.create({
      data: {
        ...dados,
        password: await hashSenha(dados.password),
        mustChangePassword: true,
      },
      select: userSelect,
    });

    await registrarAuditoria(tx, {
      entityType: "User",
      entityId: criado.id,
      action: "CREATED",
      userId: req.userId,
      changes: {
        name: dados.name,
        email: dados.email,
        role: dados.role,
      },
    });

    return criado;
  });

  return res.status(201).json(user);
}

export async function atualizar(req: Request, res: Response) {
  const dados = atualizarUserSchema.parse(req.body);
  const userId = req.params.id as string;
  const atual = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  const ehContaDono = emailDonoConfigurado(atual.email);

  if (emailDonoConfigurado(dados.email ?? "") && !ehContaDono) {
    throw new AppError("Este e-mail está reservado para a conta do proprietário", 409);
  }
  if (
    ehContaDono &&
    (req.userId !== atual.id ||
      dados.email !== undefined ||
      dados.role !== undefined ||
      dados.isActive !== undefined)
  ) {
    throw new AppError(
      "A conta do proprietário não pode ser editada por outro administrador",
      403
    );
  }

  const { before, after } = diffCampos(atual, {
    name: dados.name,
    email: dados.email,
    role: dados.role,
    isActive: dados.isActive,
  });

  if (dados.password) {
    after.passwordChanged = true;
  }

  const user = await prisma.$transaction(async (tx) => {
    const atualizado = await tx.user.update({
      where: { id: userId },
      data: {
        ...dados,
        password: dados.password ? await hashSenha(dados.password) : undefined,
        mustChangePassword: dados.password ? true : undefined,
      },
      select: userSelect,
    });

    if (Object.keys(after).length > 0) {
      await registrarAuditoria(tx, {
        entityType: "User",
        entityId: userId,
        action: "UPDATED",
        userId: req.userId,
        changes: { before, after },
      });
    }

    return atualizado;
  });

  return res.json(user);
}

// Desativação lógica — mantém o histórico de tickets do técnico intacto.
export async function desativar(req: Request, res: Response) {
  const userId = req.params.id as string;
  const atual = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });
  if (emailDonoConfigurado(atual.email)) {
    throw new AppError("A conta do proprietário não pode ser desativada", 403);
  }

  const user = await prisma.$transaction(async (tx) => {
    const desativado = await tx.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: userSelect,
    });

    await registrarAuditoria(tx, {
      entityType: "User",
      entityId: userId,
      action: "DEACTIVATED",
      userId: req.userId,
      changes: { isActive: false },
    });

    return desativado;
  });

  return res.json(user);
}
