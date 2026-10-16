import { useAssinatura } from "../context/SubscriptionContext";

function dataLimite(paidUntil: string, graceDays: number) {
  const [ano, mes, dia] = paidUntil.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia + graceDays));
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
  }).format(data);
}

export function BannerAssinatura() {
  const { assinatura, carregando, erro } = useAssinatura();
  if (carregando || !assinatura) {
    if (!erro) return null;
    return (
      <div className="mx-auto w-full max-w-[1500px] px-4 pt-4 sm:px-6 lg:px-8">
        <p className="rounded-xl border border-[#d9a39b] bg-[#f6e1df] px-4 py-3 text-sm text-[#8c3d35]" role="alert">
          {erro}
        </p>
      </div>
    );
  }

  if (assinatura.status === "EM_ATRASO") {
    return (
      <div className="mx-auto w-full max-w-[1500px] px-4 pt-4 sm:px-6 lg:px-8">
        <p className="rounded-xl border border-[#d9a39b] bg-[#f6e1df] px-4 py-3 text-sm font-medium text-[#8c3d35]" role="alert">
          Mensalidade vencida há {assinatura.diasAtraso}{" "}
          {assinatura.diasAtraso === 1 ? "dia" : "dias"}; regularize até{" "}
          {dataLimite(assinatura.paidUntil, assinatura.graceDays)} para evitar a suspensão.
        </p>
      </div>
    );
  }

  if (assinatura.status === "SUSPENSA" && assinatura.mode === "READ_ONLY") {
    return (
      <div className="mx-auto w-full max-w-[1500px] px-4 pt-4 sm:px-6 lg:px-8">
        <p className="rounded-xl border border-[#d9a39b] bg-[#f6e1df] px-4 py-3 text-sm font-medium text-[#8c3d35]" role="alert">
          Assinatura suspensa: o sistema está em modo somente leitura até a regularização.
        </p>
      </div>
    );
  }

  return null;
}
