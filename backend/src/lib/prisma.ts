import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

// Uma única instância reutilizada em toda a aplicação (evita esgotar conexões
// em dev com hot-reload do ts-node-dev).
export const prisma = new PrismaClient({ adapter });

// Tipo do client dentro de prisma.$transaction(async (tx) => ...) — extraído
// da própria assinatura em vez de importado do client gerado, pra não
// depender de um nome de tipo interno do Prisma que pode mudar de versão.
export type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
