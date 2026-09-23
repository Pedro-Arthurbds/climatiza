export type Role = "ADMIN" | "TECNICO";

export type TicketStatus = "ABERTO" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Usuario {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface Endereco {
  id: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  clientId: string;
}

export interface Cliente {
  id: string;
  name: string;
  email: string;
  doc: string;
  phone: string;
  isActive: boolean;
  addresses: Endereco[];
}

export interface TipoServico {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Chamado {
  id: string;
  clientId: string;
  addressId: string;
  serviceTypeId: string;
  userId: string | null;
  equipmentBrand: string;
  equipmentLocation: string;
  problem: string;
  status: TicketStatus;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  client: Cliente;
  address: Endereco;
  serviceType: TipoServico;
  user: { id: string; name: string } | null;
}

export interface Empresa {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  slaHours: number;
}

export interface DashboardResumo {
  abertos: number;
  emAndamento: number;
  concluidos: number;
  cancelados: number;
  atrasados: number;
  agendadosHoje: number;
  semTecnico: number;
  tempoMedioAtendimentoHoras: number | null;
  slaHoras: number;
}

export interface TecnicoCarga {
  userId: string;
  nome: string;
  cargaAtual: number;
  concluidos: number;
}

export interface GraficoDashboard {
  porPeriodo: { periodo: string; total: number }[];
  porTipoServico: { tipo: string; total: number }[];
}

export interface AlertaManutencao {
  id: string;
  clientId: string;
  message: string;
  resolution: boolean;
  createdAt: string;
  client: { id: string; name: string };
}

export interface HistoricoStatus {
  id: string;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus;
  note: string | null;
  createdAt: string;
  user: { id: string; name: string } | null;
}

export interface NotaChamado {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string } | null;
}

export interface AnexoChamado {
  id: string;
  filename: string;
  url: string;
  mimeType: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string } | null;
}

export interface ChamadoDetalhe extends Chamado {
  statusHistory: HistoricoStatus[];
  notes: NotaChamado[];
  attachments: AnexoChamado[];
  auditLog: AuditLogEntry[];
}

export interface ChamadoAgenda extends Chamado {
  atrasado: boolean;
  conflito: boolean;
}

export interface AuditLogEntry {
  id: string;
  entityType: "Ticket" | "Client" | "Address";
  entityId: string;
  action: string;
  changes: { before?: unknown; after?: unknown } | null;
  createdAt: string;
  user: { id: string; name: string } | null;
}

export type TipoNotificacao =
  | "MANUTENCAO_VENCIDA"
  | "LEMBRETE_MANUTENCAO"
  | "AGENDAMENTO"
  | "TECNICO_ATRIBUIDO"
  | "CHAMADO_CONCLUIDO";

export interface Notificacao {
  id: string;
  type: TipoNotificacao;
  message: string;
  resolution: boolean;
  createdAt: string;
  client: { id: string; name: string };
  serviceType: { id: string; name: string } | null;
}
