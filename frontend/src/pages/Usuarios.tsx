import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Role, Usuario } from "../types";

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("TECNICO");
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const { data } = await api.get<Usuario[]>("/usuarios");
      setUsuarios(data);
      setMensagemErro(null);
    } catch {
      setMensagemErro("Não foi possível carregar os usuários.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setMensagemErro("Preencha nome, e-mail e senha antes de salvar.");
      return;
    }

    if (password.length < 6) {
      setMensagemErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setEnviando(true);
    try {
      await api.post("/usuarios", {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      setName("");
      setEmail("");
      setPassword("");
      setRole("TECNICO");
      setMostrarForm(false);
      setMensagemSucesso("Usuário cadastrado com sucesso.");
      await carregar();
    } catch {
      setMensagemErro("Não foi possível criar o usuário. Verifique os dados e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function desativar(id: string) {
    const usuario = usuarios.find((item) => item.id === id);
    const confirmar = window.confirm(`Deseja desativar o usuário "${usuario?.name ?? "selecionado"}"?`);
    if (!confirmar) return;

    try {
      await api.delete(`/usuarios/${id}`);
      setMensagemSucesso("Usuário desativado com sucesso.");
      await carregar();
    } catch {
      setMensagemErro("Não foi possível desativar o usuário.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-inkMuted">Acesso</p>
          <h1 className="mt-2 text-4xl text-ink">Usuários</h1>
        </div>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-xl bg-[#2f4f48] px-4 py-2.5 text-sm font-semibold text-[#f9f5f0] shadow-[0_10px_25px_rgba(47,79,72,0.2)] transition hover:bg-[#24413d]"
        >
          {mostrarForm ? "Fechar" : "Novo usuário"}
        </button>
      </div>

      {mensagemErro && (
        <p className="rounded-2xl border border-[#d9a39b] bg-[#f6e1df] px-4 py-3 text-sm text-[#8c3d35]" role="alert" aria-live="assertive">
          {mensagemErro}
        </p>
      )}

      {mensagemSucesso && (
        <p className="rounded-2xl border border-[#94b89a] bg-[#dff0e2] px-4 py-3 text-sm text-[#2d6646]" role="status" aria-live="polite">
          {mensagemSucesso}
        </p>
      )}

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 rounded-[24px] border border-border bg-[#fffdf9] p-6 shadow-panel">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-inkMuted">Nome</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="campo-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-inkMuted">E-mail</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="campo-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-inkMuted">Senha</span>
            <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="campo-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-inkMuted">Papel</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="campo-select">
              <option value="TECNICO">Técnico</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <div className="col-span-2 flex justify-end">
            <button type="submit" disabled={enviando} className="rounded-xl bg-[#2f4f48] px-4 py-2.5 text-sm font-semibold text-[#f9f5f0] hover:bg-[#24413d] disabled:opacity-50">
              {enviando ? "Salvando..." : "Salvar usuário"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-[20px] border border-border bg-[#fffdf9] shadow-panel">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#efe6db] text-[10px] uppercase tracking-[0.16em] text-inkMuted">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-inkMuted">Carregando usuários...</td></tr>
            )}
            {!carregando && usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-inkMuted">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-base font-medium text-ink">Nenhum usuário cadastrado.</p>
                    <p className="text-sm">Crie o primeiro acesso para liberar a operação.</p>
                  </div>
                </td>
              </tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-border transition hover:bg-[#f8f1e6]">
                <td className="px-4 py-3 font-semibold text-ink">{u.name}</td>
                <td className="px-4 py-3 text-inkMuted">{u.email}</td>
                <td className="px-4 py-3 text-inkMuted">{u.role === "ADMIN" ? "Admin" : "Técnico"}</td>
                <td className="px-4 py-3 text-inkMuted">{u.isActive ? "Ativo" : "Inativo"}</td>
                <td className="px-4 py-3">
                  {u.isActive && (
                    <button onClick={() => desativar(u.id)} className="text-xs font-semibold text-[#8c3d35] hover:underline">
                      Desativar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
