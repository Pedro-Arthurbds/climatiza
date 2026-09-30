import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import { diffCampos, registrarAuditoria } from "../utils/audit";
import { registrarNotificacao } from "../services/notificacoes";

const criarTicketSchema = z.object({
  clientId: z.string().min(1),
  addressId: z.string().min(1),
  serviceTypeId: z.string().min(1),
  userId: z.string().min(1).optional(),
  equipmentBrand: z.string().min(1),
  equipmentLocation: z.string().min(1),
  problem: z.string().min(1),
  scheduledAt: z.coerce.date().optional(),
  isPreventiveMaintenance: z.boolean().optional().default(false),
  maintenanceReturnDays: z.coerce.number().int().min(1).max(3650).nullable().optional(),
});

const atualizarTicketSchema = z.object({
  clientId: z.string().min(1).optional(),
  addressId: z.string().min(1).optional(),
  serviceTypeId: z.string().min(1).optional(),
  userId: z.string().min(1).nullable().optional(),
  equipmentBrand: z.string().min(1).optional(),
  equipmentLocation: z.string().min(1).optional(),
  problem: z.string().min(1).optional(),
  scheduledAt: z.coerce.date().nullable().optional(),
  isPreventiveMaintenance: z.boolean().optional(),
  maintenanceReturnDays: z.coerce.number().int().min(1).max(3650).nullable().optional(),
});

const statusSchema = z.object({
  status: z.enum(["ABERTO", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"]),
  note: z.string().min(1).optional(),
});

const atribuirSchema = z.object({
  userId: z.string().min(1).nullable(),
});

const reagendarSchema = z.object({
  scheduledAt: z.coerce.date().nullable(),
});

const notaSchema = z.object({
  content: z.string().min(1),
});

// Anexo recebe URL, não binário — o upload depende de definir um provedor
// de storage (S3, Cloudinary...). Trocar isso não exige mudar o schema.
const anexoSchema = z.object({
  filename: z.string().min(1),
  url: z.string().url(),
  mimeType: z.string().min(1).optional(),
});

const include = {
  client: true,
  address: true,
  serviceType: true,
  user: { select: { id: true, name: true } },
} as const;

const includeDetalhe = {
  ...include,
  // O formulário de edição precisa da lista de endereços do cliente,
  // que `client: true` sozinho não traz.
  client: { include: { addresses: true } },
  statusHistory: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  },
  notes: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  },
  attachments: {
    include: { uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  },
} as const;

// Técnico só enxerga chamados próprios ou ainda sem responsável.
function filtroPorPapel(req: Request) {
  return req.userRole === "TECNICO"
    ? { OR: [{ userId: req.userId }, { userId: null }] }
    : {};
}

async function exigirAcessoAoChamado(req: Request, ticketId: string) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      ...filtroPorPapel(req),
    },
  });

  if (!ticket) {
    throw new AppError("Chamado não encontrado", 404);
  }

  return ticket;
}

export async function listar(req: Request, res: Response) {
  const { status, userId } = req.query;

  const tickets = await prisma.ticket.findMany({
    where: {
      ...filtroPorPapel(req),
      status: typeof status === "string" ? (status as never) : undefined,
      userId: typeof userId === "string" ? userId : undefined,
    },
    include,
    orderBy: { createdAt: "desc" },
  });
  return res.json(tickets);
}

export async function buscar(req: Request, res: Response) {
  const ticketAcessivel = await exigirAcessoAoChamado(req, (req.params.id as string));
  const ticket = await prisma.ticket.findUniqueOrThrow({
    where: { id: ticketAcessivel.id },
    include: includeDetalhe,
  });

  // AuditLog é polimórfico (entityType + entityId), não dá pra trazer via
  // include do Prisma — busca à parte e anexa na resposta.
  const auditLog = await prisma.auditLog.findMany({
    where: { entityType: "Ticket", entityId: ticket.id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ ...ticket, auditLog });
}

function calcularProximaManutencao(dataBase: Date | undefined, dias: number | null | undefined) {
  if (!dias || dias <= 0) return null;
  const base = dataBase ? new Date(dataBase) : new Date();
  const retorno = new Date(base);
  retorno.setDate(retorno.getDate() + dias);
  return retorno;
}

export async function criar(req: Request, res: Response) {
  const dados = criarTicketSchema.parse(req.body);

  // Cria o chamado, o primeiro registro de histórico de status e a entrada
  // de auditoria na mesma transação, pra nunca existir chamado sem rastro.
  const ticket = await prisma.$transaction(async (tx) => {
    const criado = await tx.ticket.create({
      data: {
        ...dados,
        maintenanceNextAt: null,
      },
    });
    await tx.ticketStatusHistory.create({
      data: {
        ticketId: criado.id,
        fromStatus: null,
        toStatus: criado.status,
        userId: req.userId,
        note: "Chamado aberto",
      },
    });
    await registrarAuditoria(tx, {
      entityType: "Ticket",
      entityId: criado.id,
      action: "CREATED",
      userId: req.userId,
      changes: dados,
    });
    return tx.ticket.findUniqueOrThrow({
      where: { id: criado.id },
      include: includeDetalhe,
    });
  });

  // Fora da transação — é I/O externo (canal de envio), não deve travar
  // nem reverter a criação do chamado se falhar.
  if (dados.scheduledAt) {
    await registrarNotificacao({
      clientId: ticket.clientId,
      type: "AGENDAMENTO",
      mensagem: `Seu atendimento foi agendado para ${new Date(dados.scheduledAt).toLocaleString("pt-BR")}.`,
    });
  }
  if (dados.userId && ticket.user) {
    await registrarNotificacao({
      clientId: ticket.clientId,
      type: "TECNICO_ATRIBUIDO",
      mensagem: `O técnico ${ticket.user.name} foi designado para o seu atendimento.`,
    });
  }

  return res.status(201).json(ticket);
}

export async function atualizar(req: Request, res: Response) {
  const dados = atualizarTicketSchema.parse(req.body);
  const atual = await prisma.ticket.findUniqueOrThrow({
    where: { id: (req.params.id as string) },
  });

  const dadosAtualizados: Record<string, unknown> = { ...dados };
  if (dados.isPreventiveMaintenance !== undefined || dados.maintenanceReturnDays !== undefined) {
    const isPreventive = dados.isPreventiveMaintenance ?? atual.isPreventiveMaintenance;
    const dias = dados.maintenanceReturnDays ?? atual.maintenanceReturnDays ?? null;
    dadosAtualizados.maintenanceNextAt = isPreventive && atual.completedAt
      ? calcularProximaManutencao(atual.completedAt, dias)
      : null;
  }

  const { before, after } = diffCampos(atual, dadosAtualizados);

  const ticket = await prisma.$transaction(async (tx) => {
    await tx.ticket.update({ where: { id: atual.id }, data: dadosAtualizados });

    // Só grava auditoria se algo de fato mudou (evita ruído em PATCHs vazios).
    if (Object.keys(after).length > 0) {
      await registrarAuditoria(tx, {
        entityType: "Ticket",
        entityId: atual.id,
        action: "UPDATED",
        userId: req.userId,
        changes: { before, after },
      });
    }

    return tx.ticket.findUniqueOrThrow({
      where: { id: atual.id },
      include: includeDetalhe,
    });
  });

  return res.json(ticket);
}


export async function atualizarStatus(req: Request, res: Response) {
  const { status, note } = statusSchema.parse(req.body);
  const atual = await prisma.ticket.findUniqueOrThrow({
    where: { id: (req.params.id as string) },
  });

  // Técnico só move status de chamados atribuídos a ele mesmo.
  if (req.userRole === "TECNICO" && atual.userId !== req.userId) {
    throw new AppError("Você não pode alterar este chamado", 403);
  }

  if (atual.status === status) {
    throw new AppError("O chamado já está neste status", 400);
  }

  const completedAt =
    status === "CONCLUIDO"
      ? new Date()
      : atual.status === "CONCLUIDO"
        ? null
        : atual.completedAt;
  const maintenanceNextAt =
    status === "CONCLUIDO" && atual.isPreventiveMaintenance
      ? calcularProximaManutencao(completedAt ?? undefined, atual.maintenanceReturnDays)
      : status !== "CONCLUIDO" && atual.status === "CONCLUIDO"
        ? null
        : atual.maintenanceNextAt;

  const ticket = await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: atual.id },
      data: {
        status,
        // Marca conclusão ao concluir; limpa se sair de CONCLUIDO (reabertura).
        completedAt,
        maintenanceNextAt,
      },
    });
    await tx.ticketStatusHistory.create({
      data: {
        ticketId: atual.id,
        fromStatus: atual.status,
        toStatus: status,
        userId: req.userId,
        note,
      },
    });
    return tx.ticket.findUniqueOrThrow({
      where: { id: atual.id },
      include: includeDetalhe,
    });
  });

  if (status === "CONCLUIDO") {
    await registrarNotificacao({
      clientId: atual.clientId,
      serviceTypeId: atual.serviceTypeId,
      type: "CHAMADO_CONCLUIDO",
      mensagem: "Seu atendimento foi concluído.",
    });
  }

  return res.json(ticket);
}

export async function atribuir(req: Request, res: Response) {
  const { userId } = atribuirSchema.parse(req.body);
  const atual = await prisma.ticket.findUniqueOrThrow({
    where: { id: (req.params.id as string) },
    select: { userId: true, clientId: true },
  });

  // Resolve os nomes pra a entrada de auditoria ficar legível (em vez de
  // guardar só o id, que não diz nada quando lido depois).
  const [tecnicoAntes, tecnicoDepois] = await Promise.all([
    atual.userId
      ? prisma.user.findUnique({ where: { id: atual.userId }, select: { name: true } })
      : null,
    userId
      ? prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
      : null,
  ]);

  const ticket = await prisma.$transaction(async (tx) => {
    await tx.ticket.update({ where: { id: (req.params.id as string) }, data: { userId } });
    await registrarAuditoria(tx, {
      entityType: "Ticket",
      entityId: (req.params.id as string),
      action: "ASSIGNED_TECHNICIAN",
      userId: req.userId,
      changes: {
        before: tecnicoAntes?.name ?? "Sem técnico",
        after: tecnicoDepois?.name ?? "Sem técnico",
      },
    });
    return tx.ticket.findUniqueOrThrow({
      where: { id: (req.params.id as string) },
      include: includeDetalhe,
    });
  });

  if (userId && tecnicoDepois) {
    await registrarNotificacao({
      clientId: atual.clientId,
      type: "TECNICO_ATRIBUIDO",
      mensagem: `O técnico ${tecnicoDepois.name} foi designado para o seu atendimento.`,
    });
  }

  return res.json(ticket);
}

export async function reagendar(req: Request, res: Response) {
  const { scheduledAt } = reagendarSchema.parse(req.body);
  const atual = await prisma.ticket.findUniqueOrThrow({
    where: { id: (req.params.id as string) },
    select: { scheduledAt: true, clientId: true },
  });

  const ticket = await prisma.$transaction(async (tx) => {
    await tx.ticket.update({ where: { id: (req.params.id as string) }, data: { scheduledAt } });
    await registrarAuditoria(tx, {
      entityType: "Ticket",
      entityId: (req.params.id as string),
      action: "RESCHEDULED",
      userId: req.userId,
      changes: {
        before: atual.scheduledAt?.toISOString() ?? null,
        after: scheduledAt?.toISOString() ?? null,
      },
    });
    return tx.ticket.findUniqueOrThrow({
      where: { id: (req.params.id as string) },
      include: includeDetalhe,
    });
  });

  if (scheduledAt) {
    await registrarNotificacao({
      clientId: atual.clientId,
      type: "AGENDAMENTO",
      mensagem: `Seu atendimento foi reagendado para ${scheduledAt.toLocaleString("pt-BR")}.`,
    });
  }

  return res.json(ticket);
}

export async function remover(req: Request, res: Response) {
  // Auditoria não tem FK pro Ticket (é por id solto), então sobrevive à
  // exclusão de propósito — é o único jeito de saber depois que um chamado
  // existiu e foi apagado.
  await prisma.$transaction(async (tx) => {
    await registrarAuditoria(tx, {
      entityType: "Ticket",
      entityId: (req.params.id as string),
      action: "DELETED",
      userId: req.userId,
    });
    await tx.ticket.delete({ where: { id: (req.params.id as string) } });
  });
  return res.status(204).send();
}

// --- Observações internas ---

export async function criarNota(req: Request, res: Response) {
  const { content } = notaSchema.parse(req.body);
  const ticket = await exigirAcessoAoChamado(req, (req.params.id as string));
  const nota = await prisma.ticketNote.create({
    data: { ticketId: ticket.id, userId: req.userId, content },
    include: { user: { select: { id: true, name: true } } },
  });
  return res.status(201).json(nota);
}

export async function removerNota(req: Request, res: Response) {
  const nota = await prisma.ticketNote.findUniqueOrThrow({
    where: { id: (req.params.notaId as string) },
  });

  if (nota.ticketId !== (req.params.id as string)) {
    throw new AppError("Observação não encontrada neste chamado", 404);
  }
  await exigirAcessoAoChamado(req, nota.ticketId);

  // Técnico só apaga a própria observação; admin apaga qualquer uma.
  if (req.userRole === "TECNICO" && nota.userId !== req.userId) {
    throw new AppError("Você não pode remover esta observação", 403);
  }

  await prisma.ticketNote.delete({ where: { id: nota.id } });
  return res.status(204).send();
}

// --- Anexos ---

export async function criarAnexo(req: Request, res: Response) {
  const dados = anexoSchema.parse(req.body);
  const ticket = await exigirAcessoAoChamado(req, (req.params.id as string));
  const anexo = await prisma.ticketAttachment.create({
    data: { ...dados, ticketId: ticket.id, uploadedById: req.userId },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });
  return res.status(201).json(anexo);
}

export async function removerAnexo(req: Request, res: Response) {
  await prisma.ticketAttachment.delete({ where: { id: (req.params.anexoId as string) } });
  return res.status(204).send();
}

// --- Agenda ---

const agendaQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  userId: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  status: z.enum(["ABERTO", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"]).optional(),
  serviceTypeId: z.string().min(1).optional(),
});

export async function agenda(req: Request, res: Response) {
  const { from, to, userId, city, status, serviceTypeId } =
    agendaQuerySchema.parse(req.query);

  const tickets = await prisma.ticket.findMany({
    where: {
      ...filtroPorPapel(req),
      scheduledAt: { gte: from, lte: to },
      userId: userId ?? undefined,
      status: status ?? undefined,
      serviceTypeId: serviceTypeId ?? undefined,
      address: city ? { city: { contains: city, mode: "insensitive" } } : undefined,
    },
    include,
    orderBy: { scheduledAt: "asc" },
  });

  const agora = new Date();

  // Conflito = mesmo técnico com dois chamados na mesma hora cheia.
  // Sem campo de duração no schema, a janela de 1h é a melhor aproximação
  // possível; se depois existir "duração estimada", trocar por sobreposição real.
  const slots = new Map<string, string[]>();
  for (const t of tickets) {
    if (!t.userId || !t.scheduledAt) continue;
    const chave = `${t.userId}|${new Date(t.scheduledAt).toISOString().slice(0, 13)}`;
    slots.set(chave, [...(slots.get(chave) ?? []), t.id]);
  }
  const emConflito = new Set(
    [...slots.values()].filter((ids) => ids.length > 1).flat()
  );

  return res.json(
    tickets.map((t) => ({
      ...t,
      atrasado:
        t.scheduledAt != null &&
        t.scheduledAt < agora &&
        (t.status === "ABERTO" || t.status === "EM_ANDAMENTO"),
      conflito: emConflito.has(t.id),
    }))
  );
}
