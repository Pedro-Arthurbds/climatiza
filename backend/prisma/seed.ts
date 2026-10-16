import "dotenv/config";
import { z } from "zod";
import { prisma } from "../src/lib/prisma";
import { SUBSCRIPTION_SINGLETON_ID } from "../src/services/assinatura";
import { hashSenha } from "../src/utils/hash";
import { adicionarDias, dataAtualBrasil, dataUtc } from "../src/utils/dataBrasil";

const credenciais = z.object({
  email: z.string().email(),
  senha: z.string().min(8),
}).safeParse({
  email: process.env.SEED_ADMIN_EMAIL,
  senha: process.env.SEED_ADMIN_PASSWORD,
});

if (!credenciais.success) {
  throw new Error("Defina SEED_ADMIN_EMAIL válido e SEED_ADMIN_PASSWORD com pelo menos 16 caracteres.");
}

const { email, senha } = credenciais.data;

const configAssinatura = z.object({
  monthlyValue: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.number().positive().optional()
  ),
  mode: z.enum(["READ_ONLY", "FULL_BLOCK"]).default("READ_ONLY"),
}).parse({
  monthlyValue: process.env.SEED_SUBSCRIPTION_MONTHLY_VALUE,
  mode: process.env.SEED_SUBSCRIPTION_MODE,
});

async function main() {
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Administrador",
      email,
      password: await hashSenha(senha),
      role: "ADMIN",
    },
  });

  await prisma.subscription.upsert({
    where: { id: SUBSCRIPTION_SINGLETON_ID },
    update: {},
    create: {
      id: SUBSCRIPTION_SINGLETON_ID,
      paidUntil: dataUtc(adicionarDias(dataAtualBrasil(), 30)),
      monthlyValue: configAssinatura.monthlyValue,
      mode: configAssinatura.mode,
    },
  });

  console.log("Usuário admin pronto:");
  console.log(`  email: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
