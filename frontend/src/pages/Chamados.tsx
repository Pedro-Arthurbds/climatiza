import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { ChamadoDrawer } from "../components/ChamadoDrawer";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import type { Chamado, Cliente, TicketStatus, TipoServico, Usuario } from "../types";
import {
  dataHoraBrasilParaIso,
  formatarDataHoraBrasil,
  mascararDataBrasil,
  mascararHoraBrasil,
} from "../utils/dataBrasil";

const statusOptions: TicketStatus[] = [
  "ABERTO",
  "EM_ANDAMENTO",
  "CONCLUIDO",
  "CANCELADO",
];

const labelsStatus: Record<TicketStatus, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export function Chamados() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<TicketStatus | "">("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [selecionado, setSelecionado] = useState<string | null>(null);

  const resumo = useMemo(() => {
    const hoje = new Date();
    const total = chamados.length;
    const abertos = chamados.filter((item) => item.status === "ABERTO").length;
    const andamento = chamados.filter((item) => item.status === "EM_ANDAMENTO").length;
    const atrasados = chamados.filter((item) => {
      if (!item.scheduledAt || item.status === "CONCLUIDO" || item.status === "CANCELADO") return false;
      const data = new Date(item.scheduledAt);
      return data < hoje;
    }).length;
    const agendadosHoje = chamados.filter((item) => {
      if (!item.scheduledAt) return false;
      const data = new Date(item.scheduledAt);
      return data.toDateString() === hoje.toDateString();
    }).length;

    return { total, abertos, andamento, atrasados, agendadosHoje };
  }, [chamados]);

  function limparFiltros() {
    setFiltroStatus("");
    setSucesso(null);
  }

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const { data } = await api.get<Chamado[]>("/chamados", {
        params: filtroStatus ? { status: filtroStatus } : undefined,
      });
      setChamados(data);
    } catch {
      setErro("Não foi possível carregar os chamados. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus]);

  useEffect(() => {
    const ticketId = searchParams.get("ticket");
    if (ticketId) setSelecionado(ticketId);
  }, [searchParams]);

  function fecharDetalhe() {
    setSelecionado(null);
    if (searchParams.has("ticket")) {
      const parametros = new URLSearchParams(searchParams);
      parametros.delete("ticket");
      setSearchParams(parametros, { replace: true });
    }
  }

  async function mudarStatus(id: string, status: TicketStatus) {
    const proximo = labelsStatus[status];
    const confirmar = window.confirm(`Deseja alterar este chamado para "${proximo}"?`);
    if (!confirmar) return;

    setErro(null);
    setSucesso(null);

    try {
      await api.patch(`/chamados/${id}/status`, { status });
      setSucesso(`Status alterado para "${proximo}".`);
      await carregar();
    } catch {
      setErro("Não foi possível alterar o status do chamado.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-inkMuted">Operação</p>
          <h1 className="mt-2 text-4xl text-ink">Chamados</h1>
          <p className="mt-2 text-sm text-inkMuted">
            {user?.role === "TECNICO"
              ? "Seus chamados e os ainda sem técnico atribuído."
              : "Todos os chamados abertos na operação."}
          </p>
        </div>

        {user?.role === "ADMIN" && (
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="rounded-xl bg-[#2f4f48] px-4 py-2.5 text-sm font-semibold text-[#f9f5f0] shadow-[0_10px_25px_rgba(47,79,72,0.2)] transition hover:bg-[#24413d]"
          >
            {mostrarForm ? "Fechar" : "Novo chamado"}
          </button>
        )}
      </div>

      <div className="mb-1 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard titulo="Total" valor={resumo.total} destaque />
        <ResumoCard titulo="Abertos" valor={resumo.abertos} valorClasse="text-status-aberto" />
        <ResumoCard titulo="Em andamento" valor={resumo.andamento} valorClasse="text-status-andamento" />
        <ResumoCard titulo="Atrasados" valor={resumo.atrasados} valorClasse="text-status-cancelado" />
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

      {mostrarForm && (
        <NovoChamadoForm
          onCriado={(mensagem) => {
            setMostrarForm(false);
            setSucesso(mensagem ?? "Chamado aberto com sucesso.");
            carregar();
          }}
        />
      )}

      <div className="rounded-[24px] border border-border bg-[#fffdf9] p-4 shadow-panel">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFiltroStatus("")}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              filtroStatus === ""
                ? "border-[#2f4f48] bg-[#2f4f48] text-[#f7f2ea]"
                : "border-border bg-surfaceAlt text-inkMuted"
            }`}
          >
            Todos
          </button>
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                filtroStatus === s
                  ? "border-[#2f4f48] bg-[#2f4f48] text-[#f7f2ea]"
                  : "border-border bg-surfaceAlt text-inkMuted"
              }`}
            >
              {labelsStatus[s]}
            </button>
          ))}
          {filtroStatus && (
            <button
              type="button"
              onClick={limparFiltros}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-inkMuted"
            >
              Limpar filtro
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-[20px] border border-border bg-[#f9f4eb]">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-[#efe6db] text-[10px] uppercase tracking-[0.16em] text-inkMuted">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Equipamento</th>
                <th className="px-4 py-3">Técnico</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Agendado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-inkMuted">
                    Carregando chamados...
                  </td>
                </tr>
              )}
              {!carregando && chamados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-inkMuted">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-base font-medium text-ink">Nenhum chamado para este filtro.</p>
                      <p className="text-sm">Tente outro status ou limpe os filtros para continuar.</p>
                      <button
                        type="button"
                        onClick={limparFiltros}
                        className="rounded-md border border-border bg-surfaceAlt px-3 py-1.5 text-xs font-semibold text-inkMuted"
                      >
                        Limpar filtro
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {chamados.map((chamado) => (
                <tr
                  key={chamado.id}
                  onClick={() => setSelecionado(chamado.id)}
                  className="cursor-pointer border-t border-border transition hover:bg-[#f3eadb]"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{chamado.client.name}</p>
                    <p className="mt-1 text-xs text-inkMuted">{chamado.problem}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{chamado.equipmentBrand}</p>
                    <p className="mt-1 text-xs text-inkMuted">
                      {chamado.equipmentLocation}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-inkMuted">{chamado.user?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={chamado.status} />
                  </td>
                  <td className="px-4 py-3 text-inkMuted">
                    {chamado.scheduledAt
                      ? new Date(chamado.scheduledAt).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={chamado.status}
                      onChange={(e) =>
                        mudarStatus(chamado.id, e.target.value as TicketStatus)
                      }
                      className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-ink"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {labelsStatus[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selecionado && (
        <ChamadoDrawer
          chamadoId={selecionado}
          onFechar={fecharDetalhe}
          onMudou={carregar}
        />
      )}
    </div>
  );
}

function NovoChamadoForm({ onCriado }: { onCriado: (mensagem?: string) => void }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tipos, setTipos] = useState<TipoServico[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [addressId, setAddressId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [userId, setUserId] = useState("");
  const [equipmentBrand, setEquipmentBrand] = useState("");
  const [equipmentLocation, setEquipmentLocation] = useState("");
  const [problem, setProblem] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isPreventiveMaintenance, setIsPreventiveMaintenance] = useState(false);
  const [maintenanceReturnDays, setMaintenanceReturnDays] = useState("");
  const [modoClienteNovo, setModoClienteNovo] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState("");
  const [novoClienteEmail, setNovoClienteEmail] = useState("");
  const [novoClienteDoc, setNovoClienteDoc] = useState("");
  const [novoClientePhone, setNovoClientePhone] = useState("");
  const [novoClienteRua, setNovoClienteRua] = useState("");
  const [novoClienteNumero, setNovoClienteNumero] = useState("");
  const [novoClienteBairro, setNovoClienteBairro] = useState("");
  const [novoClienteCidade, setNovoClienteCidade] = useState("");
  const [novoClienteEstado, setNovoClienteEstado] = useState("");
  const [novoClienteCep, setNovoClienteCep] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState(0);

  function formatarCep(valor: string) {
    return valor.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
  }

  async function buscarEnderecoPorCepCliente(cep: string) {
    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) return;

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await resposta.json();

      if (dados.erro) {
        setErro("CEP não encontrado. Verifique o valor informado.");
        return;
      }

      setNovoClienteRua(dados.logradouro ?? "");
      setNovoClienteBairro(dados.bairro ?? "");
      setNovoClienteCidade(dados.localidade ?? "");
      setNovoClienteEstado((dados.uf ?? "").toUpperCase().slice(0, 2));
      setNovoClienteCep(formatarCep(cepLimpo));
      setErro(null);
    } catch {
      setErro("Não foi possível consultar o CEP. Tente novamente.");
    }
  }

  useEffect(() => {
    api.get<Cliente[]>("/clientes").then((r) => setClientes(r.data));
    api.get<TipoServico[]>("/tipos-servico").then((r) => setTipos(r.data));
    api
      .get<Usuario[]>("/usuarios")
      .then((r) => setTecnicos(r.data.filter((u) => u.role === 'TECNICO' || u.role === 'ADMIN')));
  }, []);

  const clienteSelecionado = clientes.find((c) => c.id === clientId);
  const temEnderecoUnico = Boolean(clienteSelecionado && clienteSelecionado.addresses.length === 1);
  const clientesFiltrados = clientes.filter((cliente) => {
    const termo = clientSearch.trim().toLowerCase();
    if (!termo) return true;
    return cliente.name.toLowerCase().includes(termo) || cliente.email.toLowerCase().includes(termo);
  });

  useEffect(() => {
    if (clientId && clientes.length > 0) {
      const cliente = clientes.find((c) => c.id === clientId);
      setClientSearch(cliente?.name ?? "");
    } else if (!clientId) {
      setClientSearch("");
    }
  }, [clientId, clientes]);

  useEffect(() => {
    if (clienteSelecionado && clienteSelecionado.addresses.length === 1) {
      setAddressId(clienteSelecionado.addresses[0].id);
    }
  }, [clienteSelecionado]);

  const etapas = [
    { titulo: "Cliente e endereço", descricao: "Selecione o cliente e o local de atendimento." },
    { titulo: "Serviço e técnico", descricao: "Defina o tipo de serviço e quem vai atender." },
    { titulo: "Equipamento e descrição", descricao: "Descreva o problema para abrir o chamado." },
  ];

  const podeProsseguir = () => {
    if (etapa === 0) {
      if (modoClienteNovo) {
        return Boolean(
          novoClienteNome.trim() &&
            novoClienteEmail.trim() &&
            novoClienteDoc.trim() &&
            novoClientePhone.trim() &&
            novoClienteRua.trim() &&
            novoClienteNumero.trim() &&
            novoClienteBairro.trim() &&
            novoClienteCidade.trim() &&
            novoClienteEstado.trim() &&
            novoClienteCep.trim()
        );
      }

      return Boolean(clientId && addressId);
    }
    if (etapa === 1) {
      if (!serviceTypeId) return false;
      if (!dataHoraBrasilParaIso(scheduledDate, scheduledTime)) return false;
      if (isPreventiveMaintenance && !maintenanceReturnDays.trim()) return false;
      return true;
    }
    return Boolean(equipmentBrand.trim() && equipmentLocation.trim() && problem.trim());
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    const scheduledAt = dataHoraBrasilParaIso(scheduledDate, scheduledTime);
    if (!scheduledAt) {
      setErro("Informe uma data válida no formato dd/mm/aaaa e o horário do atendimento.");
      setEtapa(1);
      return;
    }

    let clienteIdFinal = clientId;
    let addressIdFinal = addressId;

    if (modoClienteNovo) {
      if (!novoClienteNome.trim() || !novoClienteEmail.trim() || !novoClienteDoc.trim() || !novoClientePhone.trim()) {
        setErro("Preencha nome, e-mail, documento e telefone do cliente novo.");
        setEtapa(0);
        return;
      }

      if (!novoClienteRua.trim() || !novoClienteNumero.trim() || !novoClienteBairro.trim() || !novoClienteCidade.trim() || !novoClienteEstado.trim() || !novoClienteCep.trim()) {
        setErro("Preencha todos os dados do endereço do cliente novo.");
        setEtapa(0);
        return;
      }

      try {
        const { data: clienteNovo } = await api.post<Cliente>("/clientes", {
          name: novoClienteNome.trim(),
          email: novoClienteEmail.trim(),
          doc: novoClienteDoc.trim(),
          phone: novoClientePhone.trim(),
          addresses: [
            {
              street: novoClienteRua.trim(),
              number: novoClienteNumero.trim(),
              neighborhood: novoClienteBairro.trim(),
              city: novoClienteCidade.trim(),
              state: novoClienteEstado.trim().slice(0, 2).toUpperCase(),
              zipcode: novoClienteCep.trim(),
            },
          ],
        });

        clienteIdFinal = clienteNovo.id;
        addressIdFinal = clienteNovo.addresses[0]?.id ?? "";
        setClientId(clienteNovo.id);
        setAddressId(clienteNovo.addresses[0]?.id ?? "");
      } catch {
        setErro("Não foi possível cadastrar o cliente novo. Verifique os dados e tente novamente.");
        return;
      }
    }

    if (!clienteIdFinal || !addressIdFinal || !serviceTypeId) {
      setErro("Faltam informações essenciais antes de abrir o chamado.");
      setEtapa(1);
      return;
    }

    if (isPreventiveMaintenance && (!maintenanceReturnDays || Number(maintenanceReturnDays) <= 0)) {
      setErro("Informe em quantos dias deve ocorrer o retorno da manutenção preventiva.");
      setEtapa(1);
      return;
    }

    if (!equipmentBrand.trim() || !equipmentLocation.trim() || !problem.trim()) {
      setErro("Preencha marca, local e descrição do problema para continuar.");
      setEtapa(2);
      return;
    }

    setEnviando(true);
    try {
      await api.post("/chamados", {
        clientId: clienteIdFinal,
        addressId: addressIdFinal,
        serviceTypeId,
        userId: userId || undefined,
        equipmentBrand: equipmentBrand.trim(),
        equipmentLocation: equipmentLocation.trim(),
        problem: problem.trim(),
        scheduledAt,
        isPreventiveMaintenance,
        maintenanceReturnDays: isPreventiveMaintenance ? Number(maintenanceReturnDays) : null,
      });
      onCriado("Chamado aberto com sucesso.");
    } catch {
      setErro("Não foi possível abrir o chamado. Verifique os dados e tentar novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-xl border border-border bg-surface p-6 shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-inkMuted">Novo chamado</p>
          <h2 className="mt-1 text-xl font-bold text-ink">{etapas[etapa].titulo}</h2>
        </div>
        <span className="rounded-full border border-border bg-surfaceAlt px-2.5 py-1 text-xs font-semibold text-inkMuted">
          Etapa {etapa + 1} de {etapas.length}
        </span>
      </div>

      <p className="mb-5 text-sm text-inkMuted">{etapas[etapa].descricao}</p>

      {erro && (
        <p className="mb-4 rounded-md border border-status-cancelado/30 bg-status-cancelado/10 px-4 py-2 text-sm text-status-cancelado" role="alert">
          {erro}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {etapa === 0 && (
          <>
            <div className="md:col-span-2">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-inkMuted">Cliente</p>
                <button
                  type="button"
                  onClick={() => {
                    setModoClienteNovo((valor) => !valor);
                    setErro(null);
                    if (!modoClienteNovo) {
                      setClientId("");
                      setAddressId("");
                    }
                  }}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  {modoClienteNovo ? "Usar cliente cadastrado" : "Cadastrar cliente novo"}
                </button>
              </div>

              {!modoClienteNovo ? (
                <div className="relative">
                  <Campo label="Cliente cadastrado">
                    <input
                      value={clientSearch}
                      onChange={(e) => {
                        const valor = e.target.value;
                        setClientSearch(valor);
                        if (!valor.trim()) {
                          setClientId("");
                          setAddressId("");
                        }
                      }}
                      placeholder="Digite o nome do cliente"
                      className="campo-input"
                    />
                  </Campo>

                  {clientSearch.trim() && clientesFiltrados.length > 0 && (
                    <div className="mt-2 max-h-52 overflow-auto rounded-lg border border-border bg-surfaceAlt p-2 shadow-sm">
                      {clientesFiltrados.slice(0, 6).map((cliente) => (
                        <button
                          key={cliente.id}
                          type="button"
                          onClick={() => {
                            setClientId(cliente.id);
                            setClientSearch(cliente.name);
                            setAddressId("");
                          }}
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-ink transition hover:bg-surface"
                        >
                          <span className="font-medium">{cliente.name}</span>
                          <span className="text-xs text-inkMuted">{cliente.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <Campo label="Nome do cliente">
                    <input value={novoClienteNome} onChange={(e) => setNovoClienteNome(e.target.value)} className="campo-input" placeholder="Ex.: João da Silva" />
                  </Campo>
                  <Campo label="E-mail">
                    <input value={novoClienteEmail} onChange={(e) => setNovoClienteEmail(e.target.value)} className="campo-input" placeholder="cliente@email.com" />
                  </Campo>
                  <Campo label="Documento">
                    <input value={novoClienteDoc} onChange={(e) => setNovoClienteDoc(e.target.value)} className="campo-input" placeholder="CPF/CNPJ" />
                  </Campo>
                  <Campo label="Telefone">
                    <input value={novoClientePhone} onChange={(e) => setNovoClientePhone(e.target.value)} className="campo-input" placeholder="(11) 99999-9999" />
                  </Campo>
                  <Campo label="CEP">
                    <input
                      value={novoClienteCep}
                      onChange={(e) => setNovoClienteCep(formatarCep(e.target.value))}
                      onBlur={(e) => buscarEnderecoPorCepCliente(e.target.value)}
                      className="campo-input"
                      placeholder="01000-000"
                    />
                  </Campo>
                  <Campo label="Rua">
                    <input value={novoClienteRua} onChange={(e) => setNovoClienteRua(e.target.value)} className="campo-input" placeholder="Rua das Flores" />
                  </Campo>
                  <Campo label="Número">
                    <input value={novoClienteNumero} onChange={(e) => setNovoClienteNumero(e.target.value)} className="campo-input" placeholder="123" />
                  </Campo>
                  <Campo label="Bairro">
                    <input value={novoClienteBairro} onChange={(e) => setNovoClienteBairro(e.target.value)} className="campo-input" placeholder="Centro" />
                  </Campo>
                  <Campo label="Cidade">
                    <input value={novoClienteCidade} onChange={(e) => setNovoClienteCidade(e.target.value)} className="campo-input" placeholder="São Paulo" />
                  </Campo>
                  <Campo label="Estado">
                    <input value={novoClienteEstado} onChange={(e) => setNovoClienteEstado(e.target.value)} className="campo-input" maxLength={2} placeholder="SP" />
                  </Campo>
                </div>
              )}
            </div>

            <Campo label="Endereço do atendimento">
              <select
                required={!modoClienteNovo}
                value={addressId}
                onChange={(e) => setAddressId(e.target.value)}
                disabled={!clienteSelecionado || temEnderecoUnico}
                className="campo-select"
              >
                <option value="">
                  {!clienteSelecionado
                    ? "Escolha um cliente primeiro"
                    : temEnderecoUnico
                      ? "Endereço único do cliente"
                      : "Selecione o endereço"}
                </option>
                {clienteSelecionado?.addresses.map((end) => (
                  <option key={end.id} value={end.id}>
                    {end.street}, {end.number} · {end.city}
                  </option>
                ))}
              </select>
            </Campo>
          </>
        )}

        {etapa === 1 && (
          <>
            <Campo label="Tipo de serviço">
              <select
                required
                value={serviceTypeId}
                onChange={(e) => setServiceTypeId(e.target.value)}
                className="campo-select"
              >
                <option value="">Selecione</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo label="Data e hora do atendimento">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  inputMode="numeric"
                  lang="pt-BR"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(mascararDataBrasil(e.target.value))}
                  className="campo-input"
                  placeholder="dd/mm/aaaa"
                  aria-label="Data do atendimento, dia, mês e ano"
                  maxLength={10}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  lang="pt-BR"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(mascararHoraBrasil(e.target.value))}
                  className="campo-input"
                  placeholder="HH:MM"
                  aria-label="Horário de Brasília do atendimento"
                  maxLength={5}
                />
              </div>
            </Campo>

            <Campo label="Técnico responsável">
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="campo-select"
              >
                <option value="">Sem atribuição ainda</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Campo>

            <div className="md:col-span-2 rounded-xl border border-border bg-surfaceAlt p-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isPreventiveMaintenance}
                  onChange={(e) => setIsPreventiveMaintenance(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-accent"
                />
                <span className="text-sm font-medium text-ink">É manutenção preventiva</span>
              </label>

              {isPreventiveMaintenance && (
                <div className="mt-3 max-w-xs">
                  <Campo label="Retorno em quantos dias?">
                    <input
                      type="number"
                      min={1}
                      value={maintenanceReturnDays}
                      onChange={(e) => setMaintenanceReturnDays(e.target.value)}
                      className="campo-input"
                      placeholder="Ex.: 30"
                    />
                  </Campo>
                </div>
              )}
            </div>
          </>
        )}

        {etapa === 2 && (
          <>
            <Campo label="Marca do equipamento">
              <input
                required
                value={equipmentBrand}
                onChange={(e) => setEquipmentBrand(e.target.value)}
                placeholder="Ex.: LG, Samsung, Carrier"
                className="campo-input"
              />
            </Campo>

            <Campo label="Local do equipamento">
              <input
                required
                value={equipmentLocation}
                onChange={(e) => setEquipmentLocation(e.target.value)}
                placeholder="Ex.: sala comercial, quarto 2"
                className="campo-input"
              />
            </Campo>

            <div className="md:col-span-2">
              <Campo label="Problema relatado">
                <textarea
                  required
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows={4}
                  placeholder="Descreva o que está ocorrendo e o que o cliente relatou."
                  className="campo-input"
                />
              </Campo>
            </div>
          </>
        )}
      </div>

      {etapa === 2 && (
        <div className="mt-6 rounded-xl border border-border bg-surfaceAlt p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-inkMuted">Resumo</p>
          <div className="grid gap-2 text-sm text-inkMuted md:grid-cols-2">
            <p><span className="font-medium text-ink">Cliente:</span> {clientes.find((c) => c.id === clientId)?.name ?? "—"}</p>
            <p><span className="font-medium text-ink">Serviço:</span> {tipos.find((t) => t.id === serviceTypeId)?.name ?? "—"}</p>
            <p><span className="font-medium text-ink">Equipamento:</span> {equipmentBrand || "—"}</p>
            <p><span className="font-medium text-ink">Técnico:</span> {tecnicos.find((t) => t.id === userId)?.name ?? "Sem atribuição"}</p>
            <p><span className="font-medium text-ink">Atendimento:</span> {formatarDataHoraBrasil(dataHoraBrasilParaIso(scheduledDate, scheduledTime))}</p>
            <p><span className="font-medium text-ink">Manutenção preventiva:</span> {isPreventiveMaintenance ? `Sim · retorno em ${maintenanceReturnDays || 0} dias` : "Não"}</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setEtapa((v) => Math.max(0, v - 1))}
          disabled={etapa === 0}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-inkMuted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Voltar
        </button>

        {etapa < etapas.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              if (!podeProsseguir()) {
                setErro("Complete os campos desta etapa antes de continuar.");
                return;
              }
              setErro(null);
              setEtapa((v) => v + 1);
            }}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-base"
          >
            Continuar
          </button>
        ) : (
          <button
            type="submit"
            disabled={enviando}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-base disabled:opacity-60"
          >
            {enviando ? "Abrindo chamado..." : "Abrir chamado"}
          </button>
        )}
      </div>
    </form>
  );
}

function ResumoCard({
  titulo,
  valor,
  valorClasse,
  destaque,
}: {
  titulo: string;
  valor: number;
  valorClasse?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        destaque ? "border-accent/40 bg-accent/10" : "border-border bg-surface"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-inkMuted">{titulo}</p>
      <p className={`mt-3 text-3xl font-extrabold tracking-tight ${valorClasse ?? "text-ink"}`}>
        {valor}
      </p>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-inkMuted">
        {label}
      </span>
      {children}
    </label>
  );
}
