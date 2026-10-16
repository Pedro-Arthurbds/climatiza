import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAssinatura } from "../context/SubscriptionContext";
import { useAuth } from "../context/AuthContext";

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
    new Date(ano, mes - 1, dia)
  );
}

export function AssinaturaPendente() {
  const { assinatura, carregando, erro } = useAssinatura();
  const { logout } = useAuth();
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    setMensagem(sessionStorage.getItem("climatiza:billing-message") ?? "");
    sessionStorage.removeItem("climatiza:billing-message");
  }, []);

  const somenteLeitura =
    assinatura?.status === "SUSPENSA" && assinatura.mode === "READ_ONLY";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f1e8] p-4">
      <section className="w-full max-w-2xl rounded-[24px] border border-border bg-[#fffdf9] p-6 shadow-panel sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c3d35]">
          Assinatura pendente
        </p>
        <h1 className="mt-3 text-3xl text-ink sm:text-4xl">
          Regularize sua mensalidade
        </h1>
        <p className="mt-4 text-sm leading-6 text-inkMuted">
          {mensagem ||
            "Algumas ações estão restritas porque a mensalidade da empresa está pendente."}
        </p>

        {carregando && <p className="mt-6 text-sm text-inkMuted">Carregando dados da assinatura...</p>}
        {erro && <p className="mt-6 text-sm text-[#8c3d35]" role="alert">{erro}</p>}

        {assinatura && (
          <dl className="mt-6 grid gap-4 rounded-2xl bg-[#f6f1e8] p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-inkMuted">Vencimento</dt>
              <dd className="mt-1 font-semibold text-ink">{formatarData(assinatura.paidUntil)}</dd>
            </div>
            <div>
              <dt className="text-inkMuted">Valor mensal</dt>
              <dd className="mt-1 font-semibold text-ink">
                {assinatura.monthlyValue === null
                  ? "A confirmar"
                  : new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(assinatura.monthlyValue)}
              </dd>
            </div>
          </dl>
        )}

        {assinatura?.paymentInstructions && (
          <div className="mt-5 rounded-2xl border border-border p-4">
            <h2 className="font-semibold text-ink">Como pagar</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-inkMuted">
              {assinatura.paymentInstructions}
            </p>
          </div>
        )}

        {(assinatura?.contactEmail || assinatura?.contactPhone) && (
          <div className="mt-5 text-sm text-inkMuted">
            <h2 className="font-semibold text-ink">Contato</h2>
            {assinatura.contactEmail && (
              <p className="mt-2">
                E-mail:{" "}
                <a className="text-accent underline" href={`mailto:${assinatura.contactEmail}`}>
                  {assinatura.contactEmail}
                </a>
              </p>
            )}
            {assinatura.contactPhone && (
              <p className="mt-1">
                Telefone:{" "}
                <a className="text-accent underline" href={`tel:${assinatura.contactPhone}`}>
                  {assinatura.contactPhone}
                </a>
              </p>
            )}
          </div>
        )}

        {!assinatura?.paymentInstructions &&
          !assinatura?.contactEmail &&
          !assinatura?.contactPhone && (
            <p className="mt-5 text-sm text-inkMuted">
              As instruções de pagamento e contato ainda não foram configuradas. Entre em contato com o suporte do sistema.
            </p>
          )}

        <div className="mt-8 flex flex-wrap gap-3">
          {somenteLeitura && (
            <Link
              to="/"
              className="rounded-xl bg-[#2f4f48] px-4 py-2.5 text-sm font-semibold text-[#f9f5f0]"
            >
              Voltar ao sistema em modo de leitura
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-inkMuted"
          >
            Sair
          </button>
        </div>
      </section>
    </main>
  );
}
