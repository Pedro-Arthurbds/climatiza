import { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose";
import { prisma } from "../lib/prisma";
import { jwtSecret } from "../utils/jwtSecret";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      mustChangePassword?: boolean;
    }
  }
}

// Front e back agora são origens diferentes, então o token vem no header
// Authorization: Bearer <token> em vez de cookie same-origin.
export async function autenticar(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token não informado" });
  }

  try {
    const { payload } = await jwtVerify(token, jwtSecret);
    const userId = payload.sub as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, role: true, mustChangePassword: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Usuário inativo ou inexistente" });
    }

    req.userId = user.id;
    req.userRole = user.role;
    req.mustChangePassword = user.mustChangePassword;

    if (req.mustChangePassword && req.path !== "/first-password") {
      return res.status(403).json({ error: "Defina sua senha antes de continuar" });
    }

    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

// Equivalente ao verificarAdmin() do monolito.
export function exigirAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== "ADMIN") {
    return res.status(403).json({ error: "Acesso restrito a administradores" });
  }
  next();
}
