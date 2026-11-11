import { FormEvent, useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useAssinatura } from "../context/SubscriptionContext";
import { ChamadoDrawer } from "../components/ChamadoDrawer";
import { HistoricoCliente } from "../components/HistoricoCliente";
import type { Cliente } from "../types";
import { obterLinkWhatsApp } from "../utils/whatsapp";

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
  const { assinatura } = useAssinatura();
  const somenteLeitura =
    assinatura?.status === "SUSPENSA" && assinatura.mode === "READ_ONLY";
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [clienteEditandoId, setClienteEditandoId] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Histórico de chamados do cliente clicado + chamado aberto a partir dele.
  const [clienteHistorico, setClienteHistorico] = useState<Cliente | null>(null);
  const [chamadoAberto, setChamadoAberto] = useState<string | null>(null);
  const [versaoHistorico, setVersaoHistorico] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [doc, setDoc] = useState("");
  const [phone, setPhone] = useState("");
  const [endereco, setEndereco] = useState(enderecoVazio);
  const [enviando, setEnviando] = useState(false);

  function formatarCep(valor: string) {
    return valor.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
  }

  async function buscarEnderecoPorCep(cep: string) {
    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) return;

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await resposta.json();

      if (dados.erro) {
        setMensagemErro("CEP não encontrado. Verifique o valor informado.");
        return;
      }

      setEndereco((prev) => ({
        ...prev,
        street: dados.logradouro ?? prev.street,
        neighborhood: dados.bairro ?? prev.neighborhood,
        city: dados.localidade ?? prev.city,
        state: (dados.uf ?? prev.state).toUpperCase().slice(0, 2),
        zipcode: formatarCep(cepLimpo),
      }));
      setMensagemErro(null);
    } catch {
      setMensagemErro("Não foi possível consultar o CEP. Tente novamente.");
    }
  }

  function limparFormulario() {
    setName("");
    setEmail("");
    setDoc("");
    setPhone("");
    setEndereco(enderecoVazio);
    setClienteEditandoId(null);
    setMensagemErro(null);
  }

  function abrirFormulario(cliente?: Cliente) {
    if (cliente) {
      setClienteEditandoId(cliente.id);
      setName(cliente.name);
      setEmail(cliente.email);
      setDoc(cliente.doc);
      setPhone(cliente.phone);
      setEndereco(cliente.addresses[0] ?? enderecoVazio);
    } else {
      limparFormulario();
    }
    setMostrarForm(true);
  }

  async function carregar() {
    setCarregando(true);
    setErroCarregamento(null);
    try {
      const { data } = await api.get<Cliente[]>("/clientes");
      setClientes(data);
    } catch {
      setErroCarregamento("Não foi possível carregar os clientes. Tente novamente.");
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

    if (!name.trim() || !email.trim() || !doc.trim() || !phone.trim()) {
      setMensagemErro("Preencha todos os dados do cliente antes de salvar.");
      return;
    }

    if (Object.values(endereco).some((valor) => !valor.trim())) {
      setMensagemErro("Preencha todos os campos do endereço antes de salvar.");
      return;
    }

    setEnviando(true);
    try {
      if (clienteEditandoId) {
        const clienteAtual = clientes.find((cliente) => cliente.id === clienteEditandoId);

        await api.patch(`/clientes/${clienteEditandoId}`, {
          name: name.trim(),
          email: email.trim(),
          doc: doc.trim(),
          phone: phone.trim(),
        });

        const enderecoAtual = clienteAtual?.addresses[0];
        const dadosEndereco = {
          street: endereco.street.trim(),
          number: endereco.number.trim(),
          neighborhood: endereco.neighborhood.trim(),
          city: endereco.city.trim(),
          state: endereco.state.trim(),
          zipcode: endereco.zipcode.trim(),
        };

        if (enderecoAtual) {
          await api.patch(`/enderecos/${enderecoAtual.id}`, dadosEndereco);
        } else {
          await api.post(`/clientes/${clienteEditandoId}/enderecos`, dadosEndereco);
        }

        setMensagemSucesso("Cliente atualizado com sucesso.");
      } else {
        await api.post("/clientes", {
          name: name.trim(),
          email: email.trim(),
          doc: doc.trim(),
          phone: phone.trim(),
          addresses: [{ ...endereco, street: endereco.street.trim(), number: endereco.number.trim(), neighborhood: endereco.neighborhood.trim(), city: endereco.city.trim(), state: endereco.state.trim(), zipcode: endereco.zipcode.trim() }],
        });
        setMensagemSucesso("Cliente cadastrado com sucesso.");
      }

      limparFormulario();
      setMostrarForm(false);
      await carregar();
    } catch {
      setMensagemErro("Não foi possível salvar o cliente. Verifique os dados e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  const clientesFiltrados = clientes.filter((cliente) => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return true;

    const termoNumerico = termo.replace(/\D/g, "");
    const dadosTexto = `${cliente.name} ${cliente.email} ${cliente.phone} ${cliente.doc} ${cliente.addresses
      .map((address) => `${address.city} ${address.state} ${address.street}`)
      .join(" ")}`.toLocaleLowerCase("pt-BR");
    const dadosNumericos = `${cliente.phone} ${cliente.doc}`.replace(/\D/g, "");

    return dadosTexto.includes(termo) || (termoNumerico.length > 0 && dadosNumericos.includes(termoNumerico));
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Base de Clientes</h1>
          <p className="mt-0.5 text-xs text-inkMuted">Contatos, endereços e histórico de equipamentos instalados.</p>
        </div>
        {user?.role === "ADMIN" && !somenteLeitura && (
          <button
            type="button"
            onClick={() => {
              if (mostrarForm && !clienteEditandoId) {
                limparFormulario();
              }
              setMostrarForm((v) => !v);
              if (!mostrarForm) {
                limparFormulario();
              }
            }}
            className="w-full rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-accentMuted transition sm:w-auto self-start sm:self-auto"
          >
            {mostrarForm ? "Fechar formulário" : "+ Novo cliente"}
          </button>
        )}
      </div>

      {mensagemSucesso && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status" aria-live="polite">
          {mensagemSucesso}
        </p>
      )}

      {mensagemErro && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert" aria-live="assertive">
          {mensagemErro}
        </p>
      )}

      {mostrarForm && !somenteLeitura && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-5 shadow-subtle sm:p-6 md:grid-cols-2"
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

          <div className="mt-2 border-t border-border pt-4 md:col-span-2">
            <p className="mb-3 text-sm font-semibold text-ink">Endereço</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input
                required
                placeholder="CEP"
                value={endereco.zipcode}
                onChange={(e) => setEndereco({ ...endereco, zipcode: formatarCep(e.target.value) })}
                onBlur={(e) => buscarEnderecoPorCep(e.target.value)}
                className="campo-input"
              />
              <input required placeholder="Rua" value={endereco.street} onChange={(e) => setEndereco({ ...endereco, street: e.target.value })} className="campo-input" />
              <input required placeholder="Número" value={endereco.number} onChange={(e) => setEndereco({ ...endereco, number: e.target.value })} className="campo-input" />
              <input required placeholder="Bairro" value={endereco.neighborhood} onChange={(e) => setEndereco({ ...endereco, neighborhood: e.target.value })} className="campo-input" />
              <input required placeholder="Cidade" value={endereco.city} onChange={(e) => setEndereco({ ...endereco, city: e.target.value })} className="campo-input" />
              <input required placeholder="UF" maxLength={2} value={endereco.state} onChange={(e) => setEndereco({ ...endereco, state: e.target.value.toUpperCase() })} className="campo-input" />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end md:col-span-2">
            {clienteEditandoId && (
              <button
                type="button"
                onClick={() => {
                  setMostrarForm(false);
                  limparFormulario();
                }}
                className="w-full rounded-lg border border-border px-4 py-2 text-xs font-semibold text-inkMuted hover:text-ink sm:w-auto"
              >
                Cancelar
              </button>
            )}
            <button type="submit" disabled={enviando} className="w-full rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-accentMuted disabled:opacity-50 sm:w-auto">
              {enviando ? "Salvando..." : clienteEditandoId ? "Salvar alterações" : "Salvar cliente"}
            </button>
          </div>
        </form>
      )}

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-subtle">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Clientes Cadastrados</h2>
            <p className="text-xs text-inkMuted">
              {carregando ? "Carregando registros..." : `${clientesFiltrados.length} de ${clientes.length} clientes`}
            </p>
          </div>
          <label className="w-full sm:max-w-sm">
            <span className="sr-only">Buscar clientes</span>
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome, contato, documento ou cidade"
              className="campo-input"
            />
          </label>
        </div>

        {erroCarregamento && (
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <p className="text-sm text-status-cancelado">{erroCarregamento}</p>
            <button type="button" onClick={carregar} className="botao-nav self-start sm:self-auto">
              Tentar novamente
            </button>
          </div>
        )}

        {!carregando && !erroCarregamento && clientes.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <p className="text-base font-medium text-ink">Nenhum cliente cadastrado ainda.</p>
            <p className="text-sm text-inkMuted">Cadastre o primeiro cliente para começar a operação.</p>
            {user?.role === "ADMIN" && !somenteLeitura && (
              <button
                type="button"
                onClick={() => abrirFormulario()}
                className="mt-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-accentMuted"
              >
                Adicionar cliente
              </button>
            )}
          </div>
        )}

        {!carregando && !erroCarregamento && clientes.length > 0 && clientesFiltrados.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-inkMuted">
            Nenhum cliente corresponde a “{busca}”. Tente outro nome, telefone ou documento.
          </p>
        )}

        {!carregando && !erroCarregamento && clientesFiltrados.length > 0 && (
          <div className="divide-y divide-border md:hidden">
            {clientesFiltrados.map((cliente) => (
              <article
                key={cliente.id}
                onClick={() => setClienteHistorico(cliente)}
                className="flex cursor-pointer items-start justify-between gap-3 p-4 hover:bg-surfaceAlt/60"
              >
                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-ink">
                    <button
                      type="button"
                      onClick={() => setClienteHistorico(cliente)}
                      className="text-left hover:underline"
                    >
                      {cliente.name}
                    </button>
                  </h3>
                  <p className="mt-1 break-all text-sm text-inkMuted">{cliente.email}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-inkMuted">{cliente.phone}</span>
                    {cliente.phone && (
                      <a
                        href={obterLinkWhatsApp(cliente.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded bg-[#25D366]/15 px-2 py-0.5 text-xs font-semibold text-[#128C7E] hover:bg-[#25D366]/25 transition"
                        title="Conversar no WhatsApp"
                      >
                        <FaWhatsapp className="text-sm text-[#25D366]" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-inkMuted">
                    {cliente.doc} · {cliente.addresses.length} endereço(s)
                  </p>
                  {cliente.addresses[0] && (
                    <p className="mt-1 text-xs text-inkMuted">
                      {cliente.addresses[0].city}/{cliente.addresses[0].state}
                    </p>
                  )}
                </div>
                {user?.role === "ADMIN" && !somenteLeitura && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirFormulario(cliente);
                    }}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-accent hover:border-accent"
                  >
                    Editar
                  </button>
                )}
              </article>
            ))}
          </div>
        )}

        {!carregando && !erroCarregamento && clientesFiltrados.length > 0 && (
          <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surfaceAlt/70 border-b border-border text-xs font-semibold text-inkMuted">
            <tr>
              <th className="px-4 py-2.5">Nome</th>
              <th className="px-4 py-2.5">Contato</th>
              <th className="px-4 py-2.5">CPF/CNPJ</th>
              <th className="px-4 py-2.5">Endereços</th>
              {user?.role === "ADMIN" && <th className="px-4 py-2.5">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map((c) => (
              <tr
                key={c.id}
                onClick={() => setClienteHistorico(c)}
                className="cursor-pointer border-t border-border transition hover:bg-surfaceAlt/50"
              >
                <td className="px-4 py-3 font-semibold text-ink">
                  <button
                    type="button"
                    onClick={() => setClienteHistorico(c)}
                    className="text-left hover:underline"
                  >
                    {c.name}
                  </button>
                </td>
                <td className="px-4 py-3 text-inkMuted">
                  <p>{c.email}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span>{c.phone}</span>
                    {c.phone && (
                      <a
                        href={obterLinkWhatsApp(c.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded bg-[#25D366]/15 px-2 py-0.5 text-xs font-semibold text-[#128C7E] hover:bg-[#25D366]/25 transition"
                        title="Conversar no WhatsApp"
                      >
                        <FaWhatsapp className="text-sm text-[#25D366]" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-inkMuted">{c.doc}</td>
                <td className="px-4 py-3 text-inkMuted">
                  {c.addresses.length} endereço(s)
                </td>
                {user?.role === "ADMIN" && !somenteLeitura && (
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirFormulario(c);
                      }}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      Editar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        )}
      </section>

      {clienteHistorico && (
        <HistoricoCliente
          cliente={clienteHistorico}
          versao={versaoHistorico}
          onAbrirChamado={setChamadoAberto}
          onFechar={() => setClienteHistorico(null)}
        />
      )}

      {/* Renderizado depois do histórico para abrir por cima dele. */}
      {chamadoAberto && (
        <ChamadoDrawer
          chamadoId={chamadoAberto}
          onFechar={() => setChamadoAberto(null)}
          onMudou={() => setVersaoHistorico((v) => v + 1)}
        />
      )}
    </div>
  );
}
