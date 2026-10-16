import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import { ehDonoAssinatura } from "../middlewares/assinatura";
import {
  invalidarCacheAssinatura,
  obterEstadoAssinatura,
  SUBSCRIPTION_SINGLETON_ID,
} from "../services/assinatura";
import {
  adicionarDias,
  adicionarMeses,
  dataUtc,
} from "../utils/dataBrasil";

const pagamentoSchema = z.object({
  amount: z.number().positive(),
  paidAt: z.coerce.date(),
  method: z.string().trim().min(1).max(40),
  externalId: z.string().trim().min(1).max(255),
  note: z.string().trim().max(1000).optional(),
});

const atualizarAssinaturaSchema = z.object({
  paidUntil: z.string().date(),
  monthlyValue: z.number().positive().nullable(),
  graceDays: z.number().int().min(0).max(90),
  mode: z.enum(["READ_ONLY", "FULL_BLOCK"]),
  cancelled: z.boolean(),
});

function ehUniqueConstraint(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function ehConflitoTransacional(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

export async function estado(req: Request, res: Response) {
  return res.json({
    ...(await obterEstadoAssinatura()),
    canManage: await ehDonoAssinatura(req.userId),
  });
}

export async function painelAdmin(_req: Request, res: Response) {
  const [subscription, payments] = await Promise.all([
    obterEstadoAssinatura(),
    prisma.subscriptionPayment.findMany({
      where: { subscriptionId: SUBSCRIPTION_SINGLETON_ID },
      orderBy: { paidAt: "desc" },
      take: 24,
      select: {
        id: true,
        amount: true,
        paidAt: true,
        periodStart: true,
        periodEnd: true,
        method: true,
        externalId: true,
        note: true,
      },
    }),
  ]);
  return res.json({
    subscription: { ...subscription, cancelled: subscription.status === "CANCELADA" },
    payments: payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
    })),
  });
}

export async function atualizarAssinatura(req: Request, res: Response) {
  const dados = atualizarAssinaturaSchema.parse(req.body);
  const subscription = await prisma.subscription.update({
    where: { id: SUBSCRIPTION_SINGLETON_ID },
    data: {
      paidUntil: dataUtc(dados.paidUntil),
      monthlyValue: dados.monthlyValue,
      graceDays: dados.graceDays,
      mode: dados.mode,
      cancelledAt: dados.cancelled ? dataUtc(dados.paidUntil) : null,
    },
  });
  invalidarCacheAssinatura();
  return res.json({
    paidUntil: subscription.paidUntil.toISOString().slice(0, 10),
    monthlyValue:
      subscription.monthlyValue === null
        ? null
        : Number(subscription.monthlyValue),
    graceDays: subscription.graceDays,
    mode: subscription.mode,
    cancelled: subscription.cancelledAt !== null,
  });
}

export async function registrarPagamento(req: Request, res: Response) {
  const dados = pagamentoSchema.parse(req.body);
  const pagamentoExistente = await prisma.subscriptionPayment.findUnique({
    where: { externalId: dados.externalId },
  });
  if (pagamentoExistente) {
    return res.status(200).json({ payment: pagamentoExistente, duplicate: true });
  }

  try {
    const resultado = await prisma.$transaction(
      async (tx) => {
        const existente = await tx.subscriptionPayment.findUnique({
          where: { externalId: dados.externalId },
        });
        if (existente) return { payment: existente, duplicate: true };

        const assinatura = await tx.subscription.findUnique({
          where: { id: SUBSCRIPTION_SINGLETON_ID },
        });
        if (!assinatura) {
          throw new AppError(
            "Assinatura não configurada. Execute o seed do sistema.",
            503
          );
        }
        if (assinatura.cancelledAt) {
          throw new AppError(
            "Não é possível registrar pagamentos para um contrato cancelado",
            409
          );
        }

        const vencimentoAnterior = assinatura.paidUntil.toISOString().slice(0, 10);
        const periodStart = adicionarDias(vencimentoAnterior, 1);
        const periodEnd = adicionarMeses(vencimentoAnterior, 1);
        const payment = await tx.subscriptionPayment.create({
          data: {
            subscriptionId: SUBSCRIPTION_SINGLETON_ID,
            amount: dados.amount,
            paidAt: dados.paidAt,
            periodStart: dataUtc(periodStart),
            periodEnd: dataUtc(periodEnd),
            method: dados.method,
            externalId: dados.externalId,
            note: dados.note,
          },
        });
        await tx.subscription.update({
          where: { id: SUBSCRIPTION_SINGLETON_ID },
          data: { paidUntil: dataUtc(periodEnd) },
        });
        return { payment, duplicate: false };
      },
      { isolationLevel: "Serializable" }
    );

    if (!resultado.duplicate) invalidarCacheAssinatura();
    return res.status(200).json(resultado);
  } catch (error) {
    if (ehUniqueConstraint(error) || ehConflitoTransacional(error)) {
      const existente = await prisma.subscriptionPayment.findUnique({
        where: { externalId: dados.externalId },
      });
      if (existente) return res.status(200).json({ payment: existente, duplicate: true });
      if (ehConflitoTransacional(error)) {
        throw new AppError("Outro pagamento foi registrado ao mesmo tempo. Tente novamente.", 409);
      }
    }
    throw error;
  }
}
