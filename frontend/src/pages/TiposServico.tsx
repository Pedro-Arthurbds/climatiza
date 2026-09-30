import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import type { TipoServico } from "../types";

export function TiposServico() {
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
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-inkMuted">Configurador</p>
        <h1 className="mt-2 text-4xl text-ink">Tipos de serviço</h1>
      </div>

      {erro && (
        <p className="rounded-2xl border border-[#d9a39b] bg-[#f6e1df] px-4 py-3 text-sm text-[#8c3d35]" role="alert">
          {erro}
        </p>
      )}

      {mensagemSucesso && (
        <p className="rounded-2xl border border-[#94b89a] bg-[#dff0e2] px-4 py-3 text-sm text-[#2d6646]" role="status" aria-live="polite">
          {mensagemSucesso}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-[24px] border border-border bg-[#fffdf9] p-5 shadow-panel sm:flex-row">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Manutenção preventiva"
          className="campo-input max-w-sm"
        />
        <button type="submit" className="rounded-xl bg-[#2f4f48] px-4 py-2.5 text-sm font-semibold text-[#f9f5f0] hover:bg-[#24413d]">
          Adicionar
        </button>
      </form>

      <div className="overflow-hidden rounded-[20px] border border-border bg-[#fffdf9] shadow-panel">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#efe6db] text-[10px] uppercase tracking-[0.16em] text-inkMuted">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-inkMuted">Carregando tipos...</td></tr>
            )}
            {!carregando && tipos.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-inkMuted">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-base font-medium text-ink">Nenhum tipo de serviço cadastrado.</p>
                    <p className="text-sm">Adicione o primeiro item para começar a operação.</p>
                    <button
                      type="button"
                      onClick={() => setNome("Manutenção preventiva")}
                      className="mt-2 rounded-xl bg-[#2f4f48] px-3 py-2 text-xs font-semibold text-[#f9f5f0]"
                    >
                      Criar primeiro tipo
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {tipos.map((t) => (
              <tr key={t.id} className="border-t border-border transition hover:bg-[#f8f1e6]">
                <td className="px-4 py-3 font-semibold text-ink">{t.name}</td>
                <td className="px-4 py-3 text-inkMuted">{t.isActive ? "Ativo" : "Inativo"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => alternarAtivo(t)} className="text-xs font-semibold text-[#2f4f48] hover:underline">
                    {t.isActive ? "Desativar" : "Reativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
