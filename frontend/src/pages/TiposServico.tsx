import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAssinatura } from "../context/SubscriptionContext";
import type { TipoServico } from "../types";

export function TiposServico() {
  const { assinatura } = useAssinatura();
  const somenteLeitura =
    assinatura?.status === "SUSPENSA" && assinatura.mode === "READ_ONLY";
  const [tipos, setTipos] = useState<TipoServico[]>([]);
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const { data } = await api.get<TipoServico[]>('/tipos-servico', { params: { all: "true" } });
      setTipos(data);
    } catch {
      setErro('Não foi possível carregar os tipos de serviço.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagemSucesso(null);

    if (!nome.trim()) {
      setErro('Digite o nome do tipo de serviço antes de salvar.');
      return;
    }

    try {
      await api.post('/tipos-servico', { name: nome.trim() });
      setNome("");
      setMensagemSucesso('Tipo de serviço criado com sucesso.');
      await carregar();
    } catch {
      setErro('Não foi possível criar o tipo de serviço.');
    }
  }

  async function alternarAtivo(tipo: TipoServico) {
    const acao = tipo.isActive ? 'desativar' : 'reativar';
    const confirmar = window.confirm(`Deseja ${acao} o tipo de serviço "${tipo.name}"?`);
    if (!confirmar) return;

    setErro(null);
    setMensagemSucesso(null);

    try {
      await api.patch(`/tipos-servico/${tipo.id}`, { isActive: !tipo.isActive });
      setMensagemSucesso(`Tipo de serviço ${tipo.isActive ? 'desativado' : 'reativado'} com sucesso.`);
      await carregar();
    } catch {
      setErro('Não foi possível alterar o status do tipo de serviço.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border/80 pb-3">
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Tipos de Serviço</h1>
        <p className="mt-0.5 text-xs text-inkMuted">Categorias operacionais para ordens de serviço e manutenções de climatização.</p>
      </div>

      {erro && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-800" role="alert">
          {erro}
        </p>
      )}

      {mensagemSucesso && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800" role="status" aria-live="polite">
          {mensagemSucesso}
        </p>
      )}

      {!somenteLeitura && <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-subtle sm:flex-row">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Manutenção preventiva"
          className="campo-input max-w-sm"
        />
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-accentMuted transition">
          Adicionar tipo
        </button>
      </form>}

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-subtle">
        <table className="w-full text-left text-sm">
          <thead className="bg-surfaceAlt/70 border-b border-border text-xs font-semibold text-inkMuted">
            <tr>
              <th className="px-4 py-2.5">Nome</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-xs text-inkMuted">Carregando tipos...</td></tr>
            )}
            {!carregando && tipos.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-inkMuted">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-semibold text-ink">Nenhum tipo de serviço cadastrado.</p>
                    <p className="text-xs">Adicione o primeiro item para começar a operação.</p>
                    {!somenteLeitura && <button
                      type="button"
                      onClick={() => setNome("Manutenção preventiva")}
                      className="mt-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-accentMuted"
                    >
                      Criar primeiro tipo
                    </button>}
                  </div>
                </td>
              </tr>
            )}
            {tipos.map((t) => (
              <tr key={t.id} className="border-t border-border transition hover:bg-surfaceAlt/50">
                <td className="px-4 py-2.5 font-semibold text-ink">{t.name}</td>
                <td className="px-4 py-2.5 text-xs text-inkMuted">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${t.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {t.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {!somenteLeitura && <button onClick={() => alternarAtivo(t)} className="text-xs font-semibold text-accent hover:underline">
                    {t.isActive ? "Desativar" : "Reativar"}
                  </button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
