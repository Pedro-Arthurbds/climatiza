import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Cliente } from "../types";

const enderecoVazio = {
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  zipcode: "",
};

export function Clientes() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [doc, setDoc] = useState("");
  const [phone, setPhone] = useState("");
  const [endereco, setEndereco] = useState(enderecoVazio);
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const { data } = await api.get<Cliente[]>("/clientes");
    setClientes(data);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post("/clientes", {
        name,
        email,
        doc,
        phone,
        addresses: [endereco],
      });
      setName("");
      setEmail("");
      setDoc("");
      setPhone("");
      setEndereco(enderecoVazio);
      setMostrarForm(false);
      carregar();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Clientes</h1>
        {user?.role === "ADMIN" && (
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base hover:opacity-90"
          >
            {mostrarForm ? "Fechar" : "Novo cliente"}
          </button>
        )}
      </div>

      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-6"
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-inkMuted">Nome</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="campo-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-inkMuted">E-mail</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="campo-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-inkMuted">CPF/CNPJ</span>
            <input required value={doc} onChange={(e) => setDoc(e.target.value)} className="campo-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-inkMuted">Telefone</span>
            <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="campo-input" />
          </label>

          <div className="col-span-2 mt-2 border-t border-border pt-4">
            <p className="mb-3 text-sm font-semibold">Endereço</p>
            <div className="grid grid-cols-3 gap-3">
              <input required placeholder="Rua" value={endereco.street} onChange={(e) => setEndereco({ ...endereco, street: e.target.value })} className="campo-input" />
              <input required placeholder="Número" value={endereco.number} onChange={(e) => setEndereco({ ...endereco, number: e.target.value })} className="campo-input" />
              <input required placeholder="Bairro" value={endereco.neighborhood} onChange={(e) => setEndereco({ ...endereco, neighborhood: e.target.value })} className="campo-input" />
              <input required placeholder="Cidade" value={endereco.city} onChange={(e) => setEndereco({ ...endereco, city: e.target.value })} className="campo-input" />
              <input required placeholder="UF" maxLength={2} value={endereco.state} onChange={(e) => setEndereco({ ...endereco, state: e.target.value.toUpperCase() })} className="campo-input" />
              <input required placeholder="CEP" value={endereco.zipcode} onChange={(e) => setEndereco({ ...endereco, zipcode: e.target.value })} className="campo-input" />
            </div>
          </div>

          <div className="col-span-2 flex justify-end">
            <button type="submit" disabled={enviando} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base hover:opacity-90 disabled:opacity-50">
              {enviando ? "Salvando..." : "Salvar cliente"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surfaceAlt text-xs uppercase text-inkMuted">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">CPF/CNPJ</th>
              <th className="px-4 py-3">Endereços</th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-inkMuted">Carregando...</td>
              </tr>
            )}
            {!carregando && clientes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-inkMuted">Nenhum cliente cadastrado.</td>
              </tr>
            )}
            {clientes.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-inkMuted">
                  <p>{c.email}</p>
                  <p>{c.phone}</p>
                </td>
                <td className="px-4 py-3 text-inkMuted">{c.doc}</td>
                <td className="px-4 py-3 text-inkMuted">
                  {c.addresses.length} endereço(s)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
