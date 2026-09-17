import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";

const criarTicketSchema = z.object({
  clientId: z.string().min(1),
  addressId: z.string().min(1),
  serviceTypeId: z.string().min(1),
  userId: z.string().min(1).optional(),
  equipmentBrand: z.string().min(1),
  equipmentLocation: z.string().min(1),
  problem: z.string().min(1),
  scheduledAt: z.coerce.date().optional(),
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
  const ticket = await prisma.ticket.findUniqueOrThrow({
    where: { id: req.params.id },
    include: includeDetalhe,
  });
  return res.json(ticket);
}

export async function criar(req: Request, res: Response) {
  const dados = criarTicketSchema.parse(req.body);

  // Cria o chamado e o primeiro registro de histórico na mesma transação,
  // pra nunca existir chamado sem trilha de auditoria.
  const ticket = await prisma.$transaction(async (tx) => {
    const criado = await tx.ticket.create({ data: dados });
    await tx.ticketStatusHistory.create({
      data: {
        ticketId: criado.id,
        fromStatus: null,
        toStatus: criado.status,
        userId: req.userId,
        note: "Chamado aberto",
      },
    });
    return tx.ticket.findUniqueOrThrow({
      where: { id: criado.id },
      include: includeDetalhe,
    });
  });

  return res.status(201).json(ticket);
}

export async function atualizar(req: Request, res: Response) {
  const dados = atualizarTicketSchema.parse(req.body);
  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: dados,
    include: includeDetalhe,
  });
  return res.json(ticket);
}

export async function atualizarStatus(req: Request, res: Response) {
  const { status, note } = statusSchema.parse(req.body);
  const atual = await prisma.ticket.findUniqueOrThrow({
    where: { id: req.params.id },
  });

  // Técnico só move status de chamados atribuídos a ele mesmo.
  if (req.userRole === "TECNICO" && atual.userId !== req.userId) {
    throw new AppError("Você não pode alterar este chamado", 403);
  }

  if (atual.status === status) {
    throw new AppError("O chamado já está neste status", 400);
  }

  const ticket = await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: atual.id },
      data: {
        status,
        // Marca conclusão ao concluir; limpa se sair de CONCLUIDO (reabertura).
        completedAt:
          status === "CONCLUIDO"
            ? new Date()
            : atual.status === "CONCLUIDO"
              ? null
              : atual.completedAt,
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

  return res.json(ticket);
}

export async function atribuir(req: Request, res: Response) {
  const { userId } = atribuirSchema.parse(req.body);
  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: { userId },
    include: includeDetalhe,
  });
  return res.json(ticket);
}

export async function reagendar(req: Request, res: Response) {
  const { scheduledAt } = reagendarSchema.parse(req.body);
  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: { scheduledAt },
    include: includeDetalhe,
  });
  return res.json(ticket);
}

export async function remover(req: Request, res: Response) {
  await prisma.ticket.delete({ where: { id: req.params.id } });
  return res.status(204).send();
}

// --- Observações internas ---

export async function criarNota(req: Request, res: Response) {
  const { content } = notaSchema.parse(req.body);
  const nota = await prisma.ticketNote.create({
    data: { ticketId: req.params.id, userId: req.userId, content },
    include: { user: { select: { id: true, name: true } } },
  });
  return res.status(201).json(nota);
}

export async function removerNota(req: Request, res: Response) {
  const nota = await prisma.ticketNote.findUniqueOrThrow({
    where: { id: req.params.notaId },
  });

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
  const anexo = await prisma.ticketAttachment.create({
    data: { ...dados, ticketId: req.params.id, uploadedById: req.userId },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });
  return res.status(201).json(anexo);
}

export async function removerAnexo(req: Request, res: Response) {
  await prisma.ticketAttachment.delete({ where: { id: req.params.anexoId } });
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
