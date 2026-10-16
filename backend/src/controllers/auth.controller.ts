import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import { compararSenha, hashSenha } from "../utils/hash";
import { emitirToken } from "../utils/jwt";
import { obterEstadoAssinatura } from "../services/assinatura";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new AppError("Credenciais inválidas", 401);
  }

  const senhaOk = await compararSenha(password, user.password);
  if (!senhaOk) {
    throw new AppError("Credenciais inválidas", 401);
  }

  if (!user.subscriptionActive) {
    throw new AppError(
      "A mensalidade deste usuário está vencida. Entre em contato com o responsável pelo sistema.",
      402
    );
  }

  if ((process.env.BILLING_ENFORCEMENT ?? "off").trim().toLowerCase() === "on") {
    const assinatura = await obterEstadoAssinatura();
    if (assinatura.status === "CANCELADA") {
      throw new AppError(
        "O contrato foi encerrado. Entre em contato para obter suporte.",
        402
      );
    }
  }

  const token = await emitirToken(user.id, user.role, user.mustChangePassword);

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  });
}

export async function me(req: Request, res: Response) {
  if (!req.userId) throw new AppError("Token inválido", 401);

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      mustChangePassword: true,
    },
  });
  if (!user) throw new AppError("Usuário não encontrado", 401);
  return res.json(user);
}

const firstPasswordSchema = z.object({
  password: z.string().min(6),
  passwordConfirmation: z.string().min(6),
});

export async function definirSenhaInicial(req: Request, res: Response) {
  if (!req.userId || !req.mustChangePassword) {
    throw new AppError("A troca de senha inicial não está disponível", 403);
  }

  const dados = firstPasswordSchema.parse(req.body);
  if (dados.password !== dados.passwordConfirmation) {
    throw new AppError("As senhas não conferem", 400);
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      password: await hashSenha(dados.password),
      mustChangePassword: false,
    },
  });

  const token = await emitirToken(user.id, user.role);
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: false,
    },
  });
}
