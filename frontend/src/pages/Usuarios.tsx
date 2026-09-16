import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Role, Usuario } from "../types";

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("TECNICO");
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const { data } = await api.get<Usuario[]>("/usuarios");
    setUsuarios(data);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post("/usuarios", { name, email, password, role });
      setName("");
      setEmail("");
      setPassword("");
      setRole("TECNICO");
      setMostrarForm(false);
      carregar();
    } finally {
      setEnviando(false);
    }
  }

  async function desativar(id: string) {
    await api.delete(`/usuarios/${id}`);
    carregar();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Usuários</h1>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base hover:opacity-90"
        >
          {mostrarForm ? "Fechar" : "Novo usuário"}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-6">
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
            <button type="submit" disabled={enviando} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base hover:opacity-90 disabled:opacity-50">
              {enviando ? "Salvando..." : "Salvar usuário"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surfaceAlt text-xs uppercase text-inkMuted">
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
              <tr><td colSpan={5} className="px-4 py-6 text-center text-inkMuted">Carregando...</td></tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-inkMuted">{u.email}</td>
                <td className="px-4 py-3 text-inkMuted">{u.role === "ADMIN" ? "Admin" : "Técnico"}</td>
                <td className="px-4 py-3 text-inkMuted">{u.isActive ? "Ativo" : "Inativo"}</td>
                <td className="px-4 py-3">
                  {u.isActive && (
                    <button onClick={() => desativar(u.id)} className="text-xs font-semibold text-status-cancelado hover:underline">
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
