import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAssinatura } from "../context/SubscriptionContext";
import type { Role, Usuario } from "../types";

export function Usuarios() {
  const { assinatura } = useAssinatura();
  const somenteLeitura =
    assinatura?.status === "SUSPENSA" && assinatura.mode === "READ_ONLY";
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

    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setMensagemErro("A senha deve ter pelo menos 8 caracteres contendo letras e números.");
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
      setMensagemSucesso("Usuário cadastrado. Ele deverá definir uma nova senha no primeiro acesso.");
      await carregar();
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { error?: string; detalhes?: Array<{ mensagem: string }> } } })?.response?.data;
      const detalheMsg = resp?.detalhes?.[0]?.mensagem;
      setMensagemErro(detalheMsg ?? resp?.error ?? "Não foi possível criar o usuário. Verifique os dados e tente novamente.");
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Equipe e Acessos</h1>
          <p className="mt-0.5 text-xs text-inkMuted">Gestão de técnicos de campo e administradores da Climatiza.</p>
        </div>
        {!somenteLeitura && <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-accentMuted transition self-start sm:self-auto"
        >
          {mostrarForm ? "Fechar formulário" : "+ Novo usuário"}
        </button>}
      </div>

      {mensagemErro && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-800" role="alert" aria-live="assertive">
          {mensagemErro}
        </p>
      )}

      {mensagemSucesso && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800" role="status" aria-live="polite">
          {mensagemSucesso}
        </p>
      )}

      {mostrarForm && !somenteLeitura && (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-surface p-5 shadow-subtle">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-inkMuted">Nome</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="campo-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-inkMuted">E-mail</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="campo-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-inkMuted">Senha temporária (mín. 8 caracteres com letras e números)</span>
            <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="campo-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-inkMuted">Papel</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="campo-select">
              <option value="TECNICO">Técnico</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <div className="col-span-2 flex justify-end">
            <button type="submit" disabled={enviando} className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-accentMuted disabled:opacity-50">
              {enviando ? "Salvando..." : "Salvar usuário"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-subtle">
        <table className="w-full text-left text-sm">
          <thead className="bg-surfaceAlt/70 border-b border-border text-xs font-semibold text-inkMuted">
            <tr>
              <th className="px-4 py-2.5">Nome</th>
              <th className="px-4 py-2.5">E-mail</th>
              <th className="px-4 py-2.5">Papel</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-xs text-inkMuted">Carregando usuários...</td></tr>
            )}
            {!carregando && usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-inkMuted">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-semibold text-ink">Nenhum usuário cadastrado.</p>
                    <p className="text-xs">Crie o primeiro acesso para liberar a operação.</p>
                  </div>
                </td>
              </tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-border transition hover:bg-surfaceAlt/50">
                <td className="px-4 py-2.5 font-semibold text-ink">{u.name}</td>
                <td className="px-4 py-2.5 text-xs text-inkMuted">{u.email}</td>
                <td className="px-4 py-2.5 text-xs text-inkMuted">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${u.role === "ADMIN" ? "bg-sky-50 text-sky-700 border border-sky-200" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                    {u.role === "ADMIN" ? "Admin" : "Técnico"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-inkMuted">{u.isActive ? "Ativo" : "Inativo"}</td>
                <td className="px-4 py-2.5 text-right">
                  {u.isActive && !somenteLeitura && (
                    <button onClick={() => desativar(u.id)} className="text-xs font-semibold text-rose-600 hover:underline">
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
