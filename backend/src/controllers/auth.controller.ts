import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import { compararSenha, hashSenha } from "../utils/hash";
import { emitirToken } from "../utils/jwt";

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
