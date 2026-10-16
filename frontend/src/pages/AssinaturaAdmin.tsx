import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAssinatura } from "../context/SubscriptionContext";

interface Pagamento {
  id: string;
  amount: number;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  method: string;
  externalId: string;
  note: string | null;
}

interface DadosPainel {
  subscription: {
    paidUntil: string;
    graceDays: number;
    monthlyValue: number | null;
    mode: "READ_ONLY" | "FULL_BLOCK";
    cancelled: boolean;
    status: string;
    diasAtraso: number;
  };
  payments: Pagamento[];
}

function dataLegivel(valor: string) {
  const data = valor.slice(0, 10);
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR").format(new Date(ano, mes - 1, dia));
}

function dinheiro(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function AssinaturaAdmin() {
  const { assinatura } = useAssinatura();
  const [painel, setPainel] = useState<DadosPainel | null>(null);
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [carencia, setCarencia] = useState("5");
  const [modo, setModo] = useState<"READ_ONLY" | "FULL_BLOCK">("READ_ONLY");
  const [cancelada, setCancelada] = useState(false);
  const [valorPagamento, setValorPagamento] = useState("");
  const [dataPagamento, setDataPagamento] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [metodo, setMetodo] = useState("Pix");
  const [referencia, setReferencia] = useState("");
  const [observacao, setObservacao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const { data } = await api.get<DadosPainel>("/assinatura/admin");
      setPainel(data);
      setValor(data.subscription.monthlyValue?.toString() ?? "");
      setVencimento(data.subscription.paidUntil);
      setCarencia(data.subscription.graceDays.toString());
      setModo(data.subscription.mode);
      setCancelada(data.subscription.cancelled);
      setValorPagamento(data.subscription.monthlyValue?.toString() ?? "");
    } catch (error) {
      const resposta = (
        error as { response?: { data?: { error?: unknown } } }
      ).response;
      setErro(
        typeof resposta?.data?.error === "string"
          ? resposta.data.error
          : "Não foi possível carregar o painel de cobrança."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function salvarConfiguracao(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSucesso(null);
    if (cancelada && painel && !painel.subscription.cancelled) {
      if (!window.confirm("Confirmar o cancelamento do contrato? O acesso será bloqueado.")) {
        return;
      }
    }

    setSalvando(true);
    try {
      await api.patch("/assinatura/admin", {
        paidUntil: vencimento,
        monthlyValue: valor.trim() ? Number(valor) : null,
        graceDays: Number(carencia),
        mode: modo,
        cancelled: cancelada,
      });
      setSucesso("Configurações da assinatura salvas.");
      await carregar();
    } catch (error) {
      const resposta = (
        error as { response?: { data?: { error?: unknown } } }
      ).response;
      setErro(
        typeof resposta?.data?.error === "string"
          ? resposta.data.error
          : "Não foi possível salvar as configurações."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function registrarPagamento(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSucesso(null);
    setSalvando(true);
    try {
      const { data } = await api.post<{ duplicate: boolean }>("/assinatura/pagamentos", {
        amount: Number(valorPagamento),
        paidAt: new Date(`${dataPagamento}T12:00:00.000Z`).toISOString(),
        method: metodo,
        externalId: referencia.trim(),
        note: observacao.trim() || undefined,
      });
      setSucesso(
        data.duplicate
          ? "Este pagamento já havia sido registrado; a assinatura não foi renovada novamente."
          : "Pagamento registrado e vencimento renovado."
      );
      setReferencia("");
      setObservacao("");
      await carregar();
    } catch (error) {
      const resposta = (
        error as { response?: { data?: { error?: unknown } } }
      ).response;
      setErro(
        typeof resposta?.data?.error === "string"
          ? resposta.data.error
          : "Não foi possível registrar o pagamento."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-inkMuted">
          Administração do sistema
        </p>
        <h1 className="mt-2 text-4xl text-ink">Mensalidade</h1>
        <p className="mt-2 text-sm text-inkMuted">
          Configure as regras de cobrança e registre pagamentos confirmados.
        </p>
      </div>

      {erro && (
        <p className="rounded-2xl border border-[#d9a39b] bg-[#f6e1df] px-4 py-3 text-sm text-[#8c3d35]" role="alert">
          {erro}
        </p>
      )}
      {sucesso && (
        <p className="rounded-2xl border border-[#94b89a] bg-[#dff0e2] px-4 py-3 text-sm text-[#2d6646]" role="status">
          {sucesso}
        </p>
      )}

      {carregando && <p className="text-sm text-inkMuted">Carregando dados da cobrança...</p>}

      {!carregando && painel && (
        <>
          <section className="panel">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink">Configuração</h2>
                <p className="mt-1 text-sm text-inkMuted">
                  Estado calculado: {painel.subscription.status}
                  {painel.subscription.diasAtraso > 0 &&
                    ` · ${painel.subscription.diasAtraso} dia(s) de atraso`}
                </p>
              </div>
              <span className="rounded-full border border-border bg-surfaceAlt px-3 py-1.5 text-xs font-semibold text-inkMuted">
                {assinatura?.canManage ? "Acesso de proprietário" : "Acesso administrativo"}
              </span>
            </div>

            <form onSubmit={salvarConfiguracao} className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-inkMuted">Valor mensal (R$)</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={valor}
                  onChange={(event) => setValor(event.target.value)}
                  className="campo-input"
                  placeholder="Não definido"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-inkMuted">Próximo vencimento</span>
                <input
                  type="date"
                  required
                  value={vencimento}
                  onChange={(event) => setVencimento(event.target.value)}
                  className="campo-input"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-inkMuted">Carência (dias)</span>
                <input
                  type="number"
                  min="0"
                  max="90"
                  required
                  value={carencia}
                  onChange={(event) => setCarencia(event.target.value)}
                  className="campo-input"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-inkMuted">Modo após a carência</span>
                <select
                  value={modo}
                  onChange={(event) => setModo(event.target.value as typeof modo)}
                  className="campo-select"
                >
                  <option value="READ_ONLY">Somente leitura</option>
                  <option value="FULL_BLOCK">Bloqueio total</option>
                </select>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm text-ink sm:col-span-2">
                <input
                  type="checkbox"
                  checked={cancelada}
                  onChange={(event) => setCancelada(event.target.checked)}
                />
                Contrato cancelado (bloqueia também o login)
              </label>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded-xl bg-[#2f4f48] px-4 py-2.5 text-sm font-semibold text-[#f9f5f0] disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Salvar configurações"}
                </button>
              </div>
            </form>
          </section>

          <section className="panel">
            <h2 className="text-xl font-semibold text-ink">Registrar pagamento</h2>
            <p className="mt-1 text-sm text-inkMuted">
              O registro é idempotente. A renovação avança um mês a partir do vencimento cadastrado.
            </p>
            <form onSubmit={registrarPagamento} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-inkMuted">Valor recebido (R$)</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={valorPagamento}
                  onChange={(event) => setValorPagamento(event.target.value)}
                  className="campo-input"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-inkMuted">Data do pagamento</span>
                <input
                  type="date"
                  required
                  value={dataPagamento}
                  onChange={(event) => setDataPagamento(event.target.value)}
                  className="campo-input"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-inkMuted">Forma de pagamento</span>
                <input
                  required
                  maxLength={40}
                  value={metodo}
                  onChange={(event) => setMetodo(event.target.value)}
                  className="campo-input"
                  placeholder="Pix, transferência..."
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-inkMuted">Identificador único / comprovante</span>
                <input
                  required
                  maxLength={255}
                  value={referencia}
                  onChange={(event) => setReferencia(event.target.value)}
                  className="campo-input"
                  placeholder="Ex.: código da transação Pix"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-inkMuted">Observação (opcional)</span>
                <input
                  maxLength={1000}
                  value={observacao}
                  onChange={(event) => setObservacao(event.target.value)}
                  className="campo-input"
                />
              </label>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded-xl bg-[#2f4f48] px-4 py-2.5 text-sm font-semibold text-[#f9f5f0] disabled:opacity-50"
                >
                  {salvando ? "Registrando..." : "Confirmar pagamento"}
                </button>
              </div>
            </form>
          </section>

          <section className="panel">
            <h2 className="text-xl font-semibold text-ink">Pagamentos recentes</h2>
            {painel.payments.length === 0 ? (
              <p className="mt-3 text-sm text-inkMuted">Nenhum pagamento registrado.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="text-[10px] uppercase tracking-[0.16em] text-inkMuted">
                    <tr>
                      <th className="pb-2">Data</th>
                      <th className="pb-2">Valor</th>
                      <th className="pb-2">Forma</th>
                      <th className="pb-2">Período renovado</th>
                      <th className="pb-2">Referência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {painel.payments.map((payment) => (
                      <tr key={payment.id} className="border-t border-border">
                        <td className="py-3">{dataLegivel(payment.paidAt)}</td>
                        <td className="py-3">{dinheiro(payment.amount)}</td>
                        <td className="py-3">{payment.method}</td>
                        <td className="py-3">
                          {dataLegivel(payment.periodStart)} – {dataLegivel(payment.periodEnd)}
                        </td>
                        <td className="py-3">{payment.externalId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
