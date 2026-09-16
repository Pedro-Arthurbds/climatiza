import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// Modelo de controller — copie este padrão para cada recurso que existia
// como route.ts no App Router (clientes, ordens de serviço, equipamentos...).
// A query Prisma em si muda muito pouco; o que muda é req/res no lugar de
// NextRequest/NextResponse.

export async function listar(req: Request, res: Response) {
  // Exemplo: const itens = await prisma.cliente.findMany();
  return res.json({ mensagem: "Troque por prisma.<model>.findMany()" });
}

export async function criar(req: Request, res: Response) {
  const dados = req.body;
  // Exemplo: const item = await prisma.cliente.create({ data: dados });
  return res.status(201).json({ mensagem: "Troque por prisma.<model>.create()", dados });
}
