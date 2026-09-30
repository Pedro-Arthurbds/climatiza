import { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose";
import { jwtSecret } from "../utils/jwtSecret";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
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
    req.userId = payload.sub as string;
    req.userRole = payload.role as string | undefined;
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
