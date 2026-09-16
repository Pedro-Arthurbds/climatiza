import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

// Company é um registro único (single-tenant) — usamos um id fixo pra
// garantir que nunca existe mais de uma linha, em vez de depender de
// convenção (findFirst poderia pegar qualquer uma se alguém criasse outra).
const COMPANY_SINGLETON_ID = "company-default";

const empresaSchema = z.object({
  name: z.string().min(1).optional(),
  cnpj: z.string().min(1).nullable().optional(),
  phone: z.string().min(1).nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().min(1).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  slaHours: z.number().int().min(1).optional(),
});

export async function obter(_req: Request, res: Response) {
  const empresa = await prisma.company.upsert({
    where: { id: COMPANY_SINGLETON_ID },
    update: {},
    create: { id: COMPANY_SINGLETON_ID, name: "Minha Empresa" },
  });
  return res.json(empresa);
}

export async function atualizar(req: Request, res: Response) {
  const dados = empresaSchema.parse(req.body);
  const empresa = await prisma.company.upsert({
    where: { id: COMPANY_SINGLETON_ID },
    update: dados,
    create: { id: COMPANY_SINGLETON_ID, name: dados.name ?? "Minha Empresa", ...dados },
  });
  return res.json(empresa);
}
