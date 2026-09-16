import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import type { TipoServico } from "../types";

export function TiposServico() {
  const [tipos, setTipos] = useState<TipoServico[]>([]);
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const { data } = await api.get<TipoServico[]>("/tipos-servico", { params: { all: "true" } });
    setTipos(data);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    await api.post("/tipos-servico", { name: nome.trim() });
    setNome("");
    carregar();
  }

  async function alternarAtivo(tipo: TipoServico) {
    await api.patch(`/tipos-servico/${tipo.id}`, { isActive: !tipo.isActive });
    carregar();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Tipos de serviço</h1>

      <form onSubmit={handleSubmit} className="mb-6 flex gap-3">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Manutenção preventiva"
          className="campo-input max-w-sm"
        />
        <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base hover:opacity-90">
          Adicionar
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surfaceAlt text-xs uppercase text-inkMuted">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-inkMuted">Carregando...</td></tr>
            )}
            {tipos.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-4 py-3">{t.name}</td>
                <td className="px-4 py-3 text-inkMuted">{t.isActive ? "Ativo" : "Inativo"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => alternarAtivo(t)} className="text-xs font-semibold text-accent hover:underline">
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
