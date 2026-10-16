import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "./errorHandler";
import { obterEstadoAssinatura } from "../services/assinatura";

export async function ehDonoAssinatura(userId: string | undefined) {
  const emailConfigurado = process.env.BILLING_OWNER_EMAIL?.trim().toLowerCase();
  if (!emailConfigurado || !userId) return false;

  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true, isActive: true },
  });

  return Boolean(
    usuario?.isActive &&
      usuario.role === "ADMIN" &&
      usuario.email.trim().toLowerCase() === emailConfigurado
  );
}

export async function exigirDonoAssinatura(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!process.env.BILLING_OWNER_EMAIL?.trim()) {
    return next(new AppError("BILLING_OWNER_EMAIL não está configurado no servidor", 503));
  }

  try {
    if (!(await ehDonoAssinatura(req.userId))) {
      return next(new AppError("Acesso restrito ao proprietário do sistema", 403));
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function verificarAssinatura(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const enforcement = (process.env.BILLING_ENFORCEMENT ?? "off")
    .trim()
    .toLowerCase();
  if (enforcement === "off") return next();
  if (enforcement !== "on") {
    return res.status(503).json({
      error: "BILLING_ENFORCEMENT deve ser configurado como on ou off",
    });
  }

  try {
    const assinatura = await obterEstadoAssinatura();
    if (assinatura.status === "ATIVA" || assinatura.status === "EM_ATRASO") {
      return next();
    }

    if (
      assinatura.status === "SUSPENSA" &&
      assinatura.mode === "READ_ONLY" &&
      (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS")
    ) {
      return next();
    }

    return res.status(402).json({
      error:
        assinatura.status === "CANCELADA"
          ? "O contrato foi encerrado. Entre em contato para obter suporte."
          : "A assinatura está suspensa. Regularize o pagamento para continuar.",
      status: assinatura.status,
      mode: assinatura.mode,
    });
  } catch (error) {
    return next(error);
  }
}
