import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Registrar por último, depois de todas as rotas.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Dados inválidos",
      detalhes: err.issues.map((i) => ({
        campo: i.path.join("."),
        mensagem: i.message,
      })),
    });
  }

  // Erros conhecidos do Prisma (P2025 = registro não encontrado,
  // P2002 = violação de unique) — o restante cai no 500 genérico.
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code?: string }).code;
    if (code === "P2025") {
      return res.status(404).json({ error: "Registro não encontrado" });
    }
    if (code === "P2002") {
      return res.status(409).json({ error: "Registro já existe (campo único duplicado)" });
    }
  }

  console.error(err);
  return res.status(500).json({ error: "Erro interno do servidor" });
}

// Evita precisar de try/catch em toda rota async.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
