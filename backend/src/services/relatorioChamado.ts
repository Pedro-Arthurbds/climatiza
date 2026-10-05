import PDFDocument from "pdfkit";

// Tipos próprios (estruturais) em vez dos tipos gerados pelo Prisma: o
// gerador PDF fica independente do client e é fácil de testar com dados falsos.
type Status = "ABERTO" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";

export interface DadosRelatorioChamado {
  empresa: {
    name: string;
    cnpj: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    slaHours: number;
  } | null;
  ticket: {
    id: string;
    status: Status;
    equipmentBrand: string;
    equipmentLocation: string;
    problem: string;
    scheduledAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    isPreventiveMaintenance: boolean;
    maintenanceReturnDays: number | null;
    maintenanceNextAt: Date | null;
    client: {
      name: string;
      doc: string;
      phone: string;
      email: string;
      isActive: boolean;
    };
    address: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
      zipcode: string;
    };
    serviceType: { name: string };
    user: { name: string } | null;
    statusHistory: {
      fromStatus: Status | null;
      toStatus: Status;
      note: string | null;
      createdAt: Date;
      user: { name: string } | null;
    }[];
    notes: { content: string; createdAt: Date; user: { name: string } | null }[];
    attachments: {
      filename: string;
      url: string;
      createdAt: Date;
      uploadedBy: { name: string } | null;
    }[];
  };
  auditLog: {
    action: string;
    changes: unknown;
    createdAt: Date;
    user: { name: string } | null;
  }[];
  geradoPor: string;
  incluirNotas: boolean;
}

// Paleta do próprio sistema (tailwind.config.js) para o PDF parecer parte dele.
const COR = {
  tinta: "#1F2A2A",
  suave: "#5F6A62",
  linha: "#D9CBB4",
  fundo: "#F6F1E8",
  fundoAlt: "#FFFDF9",
  acento: "#2F4F48",
  status: {
    ABERTO: "#C8892E",
    EM_ANDAMENTO: "#5A7D9E",
    CONCLUIDO: "#3C7A5B",
    CANCELADO: "#B85A4C",
  } as Record<Status, string>,
};

const ROTULO_STATUS: Record<Status, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const ROTULO_CAMPO: Record<string, string> = {
  clientId: "Cliente",
  addressId: "Endereço",
  serviceTypeId: "Tipo de serviço",
  userId: "Técnico",
  equipmentBrand: "Marca do equipamento",
  equipmentLocation: "Local do equipamento",
  problem: "Problema relatado",
  scheduledAt: "Agendamento",
  isPreventiveMaintenance: "Manutenção preventiva",
  maintenanceReturnDays: "Dias para retorno",
};

const FUSO = "America/Sao_Paulo";
const MARGEM = 40;

type Doc = InstanceType<typeof PDFDocument>;

function fmtDataHora(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(d)
    .replace(",", " às");
}

function fmtDuracao(ms: number) {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const dias = Math.floor(totalMin / 1440);
  const horas = Math.floor((totalMin % 1440) / 60);
  const min = totalMin % 60;
  if (dias > 0) return `${dias}d ${horas}h ${min}min`;
  if (horas > 0) return `${horas}h ${min}min`;
  return `${min}min`;
}

function protocolo(id: string) {
  return id.slice(-8).toUpperCase();
}

function larguraUtil(doc: Doc) {
  return doc.page.width - MARGEM * 2;
}

function limiteInferior(doc: Doc) {
  return doc.page.height - doc.page.margins.bottom;
}

// Garante `altura` livre na página; senão abre outra.
function garantirEspaco(doc: Doc, altura: number) {
  if (doc.y + altura > limiteInferior(doc)) {
    doc.addPage();
  }
}

function titulo(doc: Doc, texto: string) {
  garantirEspaco(doc, 60);
  doc.moveDown(0.8);
  const y = doc.y;
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COR.acento)
    .text(texto.toUpperCase(), MARGEM, y, { characterSpacing: 1 });
  const yLinha = doc.y + 3;
  doc
    .moveTo(MARGEM, yLinha)
    .lineTo(MARGEM + larguraUtil(doc), yLinha)
    .lineWidth(0.8)
    .strokeColor(COR.linha)
    .stroke();
  doc.y = yLinha + 8;
  doc.x = MARGEM;
}

function campo(
  doc: Doc,
  x: number,
  y: number,
  largura: number,
  rotulo: string,
  valor: string
) {
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COR.suave)
    .text(rotulo.toUpperCase(), x, y, { width: largura, characterSpacing: 0.6 });
  const yValor = doc.y + 1;
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COR.tinta)
    .text(valor || "—", x, yValor, { width: largura });
  return doc.y - y;
}

// Grade de campos curtos em `colunas` colunas.
function grade(doc: Doc, pares: [string, string][], colunas = 2) {
  const gap = 16;
  const largura = (larguraUtil(doc) - gap * (colunas - 1)) / colunas;
  for (let i = 0; i < pares.length; i += colunas) {
    const linha = pares.slice(i, i + colunas);
    // Estima a altura da linha antes de desenhar, pra não quebrar no meio.
    const alturas = linha.map(([r, v]) => {
      doc.font("Helvetica").fontSize(7.5);
      const hr = doc.heightOfString(r.toUpperCase(), { width: largura });
      doc.font("Helvetica").fontSize(10);
      const hv = doc.heightOfString(v || "—", { width: largura });
      return hr + hv + 1;
    });
    garantirEspaco(doc, Math.max(...alturas) + 10);
    const y = doc.y;
    let maior = 0;
    linha.forEach(([r, v], idx) => {
      const h = campo(doc, MARGEM + idx * (largura + gap), y, largura, r, v);
      maior = Math.max(maior, h);
    });
    doc.y = y + maior + 10;
    doc.x = MARGEM;
  }
}

// Campo de largura total (texto longo, como o problema relatado).
function blocoTexto(doc: Doc, rotulo: string, valor: string) {
  doc.font("Helvetica").fontSize(10);
  const h = doc.heightOfString(valor || "—", { width: larguraUtil(doc) - 20 });
  garantirEspaco(doc, h + 34);
  const y = doc.y;
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COR.suave)
    .text(rotulo.toUpperCase(), MARGEM, y, { characterSpacing: 0.6 });
  const yCaixa = doc.y + 3;
  doc
    .roundedRect(MARGEM, yCaixa, larguraUtil(doc), h + 16, 4)
    .fillAndStroke(COR.fundoAlt, COR.linha);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COR.tinta)
    .text(valor || "—", MARGEM + 10, yCaixa + 8, { width: larguraUtil(doc) - 20 });
  doc.y = yCaixa + h + 16 + 10;
  doc.x = MARGEM;
}

function tabela(
  doc: Doc,
  colunas: { titulo: string; largura: number }[],
  linhas: string[][]
) {
  const pad = 5;
  const cabecalho = () => {
    garantirEspaco(doc, 40);
    const y = doc.y;
    doc.rect(MARGEM, y, larguraUtil(doc), 18).fill(COR.acento);
    let x = MARGEM;
    colunas.forEach((c) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#FFFFFF")
        .text(c.titulo, x + pad, y + 5, { width: c.largura - pad * 2, lineBreak: false });
      x += c.largura;
    });
    doc.y = y + 18;
  };

  cabecalho();
  linhas.forEach((cels, idx) => {
    doc.font("Helvetica").fontSize(9);
    const alturas = cels.map((t, i) =>
      doc.heightOfString(t || "—", { width: colunas[i].largura - pad * 2 })
    );
    const h = Math.max(...alturas) + pad * 2;
    if (doc.y + h > limiteInferior(doc)) {
      doc.addPage();
      cabecalho();
    }
    const y = doc.y;
    if (idx % 2 === 0) {
      doc.rect(MARGEM, y, larguraUtil(doc), h).fill(COR.fundoAlt);
    }
    let x = MARGEM;
    cels.forEach((t, i) => {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(COR.tinta)
        .text(t || "—", x + pad, y + pad, { width: colunas[i].largura - pad * 2 });
      x += colunas[i].largura;
    });
    doc
      .moveTo(MARGEM, y + h)
      .lineTo(MARGEM + larguraUtil(doc), y + h)
      .lineWidth(0.4)
      .strokeColor(COR.linha)
      .stroke();
    doc.y = y + h;
  });
  doc.x = MARGEM;
  doc.moveDown(0.5);
}

function vazio(doc: Doc, texto: string) {
  doc.font("Helvetica-Oblique").fontSize(9).fillColor(COR.suave).text(texto, MARGEM, doc.y);
  doc.moveDown(0.5);
}

function cabecalhoPagina(doc: Doc, d: DadosRelatorioChamado) {
  const larg = doc.page.width;
  doc.rect(0, 0, larg, 78).fill(COR.acento);
  doc
    .font("Helvetica-Bold")
    .fontSize(17)
    .fillColor("#FFFFFF")
    .text(d.empresa?.name ?? "Climatiza", MARGEM, 22, {
      width: larg - MARGEM * 2 - 160,
      lineBreak: false,
      ellipsis: true,
    });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#C9D7CC")
    .text("Relatório de chamado de serviço", MARGEM, 46);

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#C9D7CC")
    .text("PROTOCOLO", larg - MARGEM - 150, 22, { width: 150, align: "right", characterSpacing: 0.8 });
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#FFFFFF")
    .text(protocolo(d.ticket.id), larg - MARGEM - 150, 34, { width: 150, align: "right" });

  doc.y = 92;
  doc.x = MARGEM;

  const contatos = [
    d.empresa?.cnpj ? `CNPJ ${d.empresa.cnpj}` : null,
    d.empresa?.phone,
    d.empresa?.email,
    d.empresa?.address,
  ].filter(Boolean) as string[];
  if (contatos.length) {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COR.suave)
      .text(contatos.join("  |  "), MARGEM, doc.y, { width: larguraUtil(doc) });
    doc.moveDown(0.6);
  }
}

function chipStatus(doc: Doc, status: Status) {
  const texto = ROTULO_STATUS[status].toUpperCase();
  doc.font("Helvetica-Bold").fontSize(9);
  const w = doc.widthOfString(texto, { characterSpacing: 0.8 }) + 20;
  const y = doc.y;
  doc.roundedRect(MARGEM, y, w, 20, 10).fill(COR.status[status]);
  doc
    .fillColor("#FFFFFF")
    .text(texto, MARGEM + 10, y + 5.5, { characterSpacing: 0.8, lineBreak: false });
  doc.y = y + 28;
  doc.x = MARGEM;
}

function descreverAuditoria(a: DadosRelatorioChamado["auditLog"][number]): string | null {
  const ch = (a.changes ?? {}) as { before?: unknown; after?: unknown };
  switch (a.action) {
    case "CREATED":
      return "Chamado criado";
    case "UPDATED": {
      const campos = Object.keys((ch.after ?? {}) as Record<string, unknown>).map(
        (k) => ROTULO_CAMPO[k] ?? k
      );
      return campos.length ? `Dados alterados: ${campos.join(", ")}` : "Dados alterados";
    }
    case "ASSIGNED_TECHNICIAN":
      return `Técnico alterado: ${String(ch.before ?? "Sem técnico")} para ${String(ch.after ?? "Sem técnico")}`;
    case "RESCHEDULED": {
      const antes = ch.before ? fmtDataHora(new Date(String(ch.before))) : "sem data";
      const depois = ch.after ? fmtDataHora(new Date(String(ch.after))) : "sem data";
      return `Reagendado: ${antes} para ${depois}`;
    }
    default:
      return null;
  }
}

// Escreve o PDF no stream informado (ex.: a própria resposta HTTP).
export function gerarRelatorioChamadoPdf(
  d: DadosRelatorioChamado,
  saida: NodeJS.WritableStream
) {
  const t = d.ticket;
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: MARGEM, bottom: 56, left: MARGEM, right: MARGEM },
    bufferPages: true,
    info: {
      Title: `Relatório do chamado ${protocolo(t.id)}`,
      Author: d.empresa?.name ?? "Climatiza",
      Subject: `Chamado de ${t.client.name}`,
    },
  });
  doc.pipe(saida);

  cabecalhoPagina(doc, d);
  chipStatus(doc, t.status);

  // --- Cliente ---
  titulo(doc, "Dados do cliente");
  grade(doc, [
    ["Nome", t.client.name],
    ["CPF/CNPJ", t.client.doc],
    ["Telefone", t.client.phone],
    ["E-mail", t.client.email],
    ["Situação do cadastro", t.client.isActive ? "Ativo" : "Inativo"],
  ]);

  // --- Endereço ---
  titulo(doc, "Local do atendimento");
  grade(doc, [
    ["Endereço", `${t.address.street}, ${t.address.number}`],
    ["Bairro", t.address.neighborhood],
    ["Cidade/UF", `${t.address.city}/${t.address.state}`],
    ["CEP", t.address.zipcode],
  ]);

  // --- Equipamento ---
  titulo(doc, "Equipamento e problema");
  grade(doc, [
    ["Marca", t.equipmentBrand],
    ["Local do equipamento", t.equipmentLocation],
  ]);
  blocoTexto(doc, "Problema relatado", t.problem);

  // --- Atendimento ---
  titulo(doc, "Registro do atendimento");
  const sla = d.empresa?.slaHours ?? 24;
  const pares: [string, string][] = [
    ["Tipo de serviço", t.serviceType.name],
    ["Técnico responsável", t.user?.name ?? "Não atribuído"],
    ["Aberto em", fmtDataHora(t.createdAt)],
    ["Agendado para", fmtDataHora(t.scheduledAt)],
    ["Concluído em", fmtDataHora(t.completedAt)],
  ];
  if (t.completedAt) {
    const ms = t.completedAt.getTime() - t.createdAt.getTime();
    const dentro = ms <= sla * 3600 * 1000;
    pares.push([
      "Tempo até a conclusão",
      `${fmtDuracao(ms)} (${dentro ? "dentro" : "fora"} do SLA de ${sla}h)`,
    ]);
  }
  pares.push(["Manutenção preventiva", t.isPreventiveMaintenance ? "Sim" : "Não"]);
  if (t.isPreventiveMaintenance) {
    pares.push([
      "Retorno previsto",
      t.maintenanceReturnDays ? `${t.maintenanceReturnDays} dias` : "—",
    ]);
    pares.push(["Próxima manutenção", fmtDataHora(t.maintenanceNextAt)]);
  }
  grade(doc, pares);

  // --- Histórico de status ---
  titulo(doc, "Histórico de status");
  const w = larguraUtil(doc);
  if (t.statusHistory.length === 0) {
    vazio(doc, "Nenhuma mudança de status registrada.");
  } else {
    const ordenado = [...t.statusHistory].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
    tabela(
      doc,
      [
        { titulo: "Data e hora", largura: w * 0.24 },
        { titulo: "Alteração", largura: w * 0.26 },
        { titulo: "Responsável", largura: w * 0.2 },
        { titulo: "Observação", largura: w * 0.3 },
      ],
      ordenado.map((h) => [
        fmtDataHora(h.createdAt),
        h.fromStatus
          ? `${ROTULO_STATUS[h.fromStatus]} para ${ROTULO_STATUS[h.toStatus]}`
          : ROTULO_STATUS[h.toStatus],
        h.user?.name ?? "Sistema",
        h.note ?? "",
      ])
    );
  }

  // --- Outras alterações (auditoria) ---
  const alteracoes = [...d.auditLog]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((a) => ({ a, texto: descreverAuditoria(a) }))
    .filter((x): x is { a: (typeof d.auditLog)[number]; texto: string } => x.texto !== null);
  if (alteracoes.length > 0) {
    titulo(doc, "Alterações no chamado");
    tabela(
      doc,
      [
        { titulo: "Data e hora", largura: w * 0.24 },
        { titulo: "Alteração", largura: w * 0.56 },
        { titulo: "Responsável", largura: w * 0.2 },
      ],
      alteracoes.map(({ a, texto }) => [
        fmtDataHora(a.createdAt),
        texto,
        a.user?.name ?? "Sistema",
      ])
    );
  }

  // --- Observações internas ---
  if (d.incluirNotas) {
    titulo(doc, "Observações internas da equipe");
    if (t.notes.length === 0) {
      vazio(doc, "Nenhuma observação registrada.");
    } else {
      const notas = [...t.notes].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      notas.forEach((n) => {
        doc.font("Helvetica").fontSize(9.5);
        const h = doc.heightOfString(n.content, { width: w - 20 });
        garantirEspaco(doc, h + 40);
        const y = doc.y;
        doc.roundedRect(MARGEM, y, w, h + 32, 4).fillAndStroke(COR.fundoAlt, COR.linha);
        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .fillColor(COR.suave)
          .text(
            `${n.user?.name ?? "Sistema"}  |  ${fmtDataHora(n.createdAt)}`,
            MARGEM + 10,
            y + 8,
            { width: w - 20 }
          );
        doc
          .font("Helvetica")
          .fontSize(9.5)
          .fillColor(COR.tinta)
          .text(n.content, MARGEM + 10, y + 22, { width: w - 20 });
        doc.y = y + h + 32 + 8;
        doc.x = MARGEM;
      });
    }
  }

  // --- Anexos ---
  titulo(doc, "Anexos");
  if (t.attachments.length === 0) {
    vazio(doc, "Nenhum anexo registrado.");
  } else {
    t.attachments.forEach((a) => {
      doc.font("Helvetica-Bold").fontSize(9.5);
      const h1 = doc.heightOfString(a.filename, { width: w });
      doc.font("Helvetica").fontSize(8.5);
      const h2 = doc.heightOfString(a.url, { width: w });
      garantirEspaco(doc, h1 + h2 + 24);
      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(COR.tinta)
        .text(a.filename, MARGEM, doc.y, { width: w });
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#2B5F9E")
        .text(a.url, MARGEM, doc.y, { width: w, link: a.url, underline: true });
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COR.suave)
        .text(
          `Enviado por ${a.uploadedBy?.name ?? "Sistema"} em ${fmtDataHora(a.createdAt)}`,
          MARGEM,
          doc.y,
          { width: w }
        );
      doc.moveDown(0.7);
    });
  }

  // --- Rodapé em todas as páginas (precisa ser depois, pra saber o total) ---
  const paginas = doc.bufferedPageRange();
  for (let i = 0; i < paginas.count; i++) {
    doc.switchToPage(paginas.start + i);
    const pag = doc.page;
    const margemOriginal = pag.margins.bottom;
    // Zera a margem inferior só durante o rodapé; senão o pdfkit abre outra
    // página ao escrever na área da margem.
    pag.margins.bottom = 0;
    const yRodape = pag.height - 36;
    doc
      .moveTo(MARGEM, yRodape - 6)
      .lineTo(pag.width - MARGEM, yRodape - 6)
      .lineWidth(0.5)
      .strokeColor(COR.linha)
      .stroke();
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(COR.suave)
      .text(
        `Gerado em ${fmtDataHora(new Date())} por ${d.geradoPor}  |  Chamado ${t.id}`,
        MARGEM,
        yRodape,
        { width: larguraUtil(doc) - 70, lineBreak: false, ellipsis: true }
      );
    doc.text(`Página ${i + 1} de ${paginas.count}`, pag.width - MARGEM - 70, yRodape, {
      width: 70,
      align: "right",
      lineBreak: false,
    });
    pag.margins.bottom = margemOriginal;
  }

  doc.end();
}
