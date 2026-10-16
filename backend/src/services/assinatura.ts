import { prisma } from "../lib/prisma";
import { dataAtualBrasil, diferencaDias } from "../utils/dataBrasil";
import { AppError } from "../middlewares/errorHandler";

const SUBSCRIPTION_SINGLETON_ID = "subscription-default";
const CACHE_MS = 60_000;

export type StatusAssinatura =
  | "ATIVA"
  | "EM_ATRASO"
  | "SUSPENSA"
  | "CANCELADA";

export type ModoAssinatura = "READ_ONLY" | "FULL_BLOCK";

export interface EstadoAssinatura {
  status: StatusAssinatura;
  paidUntil: string;
  diasAtraso: number;
  graceDays: number;
  monthlyValue: number | null;
  mode: ModoAssinatura;
  paymentInstructions: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

let cache: { expiresAt: number; value: EstadoAssinatura } | undefined;

function dataIso(data: Date) {
  return data.toISOString().slice(0, 10);
}

export async function obterEstadoAssinatura(): Promise<EstadoAssinatura> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.value;
  }

  let assinatura;
  try {
    assinatura = await prisma.subscription.findUnique({
      where: { id: SUBSCRIPTION_SINGLETON_ID },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2021"
    ) {
      throw new AppError(
        "Tabelas de assinatura ausentes. Aplique a migração add_subscription antes de habilitar o faturamento.",
        503
      );
    }
    throw error;
  }
  if (!assinatura) {
    throw new AppError("Assinatura não configurada. Execute o seed do sistema.", 503);
  }

  const paidUntil = dataIso(assinatura.paidUntil);
  const diasAtraso = Math.max(0, diferencaDias(paidUntil, dataAtualBrasil()));
  const status: StatusAssinatura = assinatura.cancelledAt
    ? "CANCELADA"
    : diasAtraso === 0
      ? "ATIVA"
      : diasAtraso <= assinatura.graceDays
        ? "EM_ATRASO"
        : "SUSPENSA";

  const value: EstadoAssinatura = {
    status,
    paidUntil,
    diasAtraso,
    graceDays: assinatura.graceDays,
    monthlyValue:
      assinatura.monthlyValue === null
        ? null
        : Number(assinatura.monthlyValue),
    mode: assinatura.mode,
    paymentInstructions: process.env.BILLING_PAYMENT_INSTRUCTIONS || null,
    contactEmail: process.env.BILLING_CONTACT_EMAIL || null,
    contactPhone: process.env.BILLING_CONTACT_PHONE || null,
  };
  cache = { expiresAt: Date.now() + CACHE_MS, value };
  return value;
}

export function invalidarCacheAssinatura() {
  cache = undefined;
}

export { SUBSCRIPTION_SINGLETON_ID };
