import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import { compararSenha } from "../utils/hash";
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

  const token = await emitirToken(user.id, user.role);

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
