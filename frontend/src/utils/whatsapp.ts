/**
 * Utilitários para integração Click-to-Chat com o WhatsApp.
 * Gera URLs no formato oficial wa.me sem requerer infraestrutura de servidor.
 */

export function limparTelefoneParaWhatsApp(telefone: string): string {
  let digitos = telefone.replace(/\D/g, "");

  // Se começou com zero (ex: 011999999999), remove o zero inicial
  if (digitos.startsWith("0")) {
    digitos = digitos.substring(1);
  }

  // DDD (2 dígitos) + 8 ou 9 dígitos = 10 ou 11 dígitos -> adiciona DDI Brasil (55)
  if (digitos.length === 10 || digitos.length === 11) {
    digitos = `55${digitos}`;
  }

  return digitos;
}

export function obterLinkWhatsApp(telefone: string, mensagem?: string): string {
  const numeroLimpo = limparTelefoneParaWhatsApp(telefone);
  if (!numeroLimpo) return "";

  if (!mensagem || !mensagem.trim()) {
    return `https://wa.me/${numeroLimpo}`;
  }

  return `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem.trim())}`;
}

export function gerarMensagemAgendamento({
  clienteNome,
  protocolo,
  tipoServico,
  dataHora,
  tecnicoNome,
  endereco,
}: {
  clienteNome: string;
  protocolo: string;
  tipoServico?: string;
  dataHora: string;
  tecnicoNome?: string | null;
  endereco?: string;
}): string {
  const partes: string[] = [
    `Olá, *${clienteNome}*! Tudo bem?`,
    `Aqui é da equipe da *Climatiza*. Confirmamos o agendamento do seu chamado *#${protocolo.slice(-8).toUpperCase()}*${tipoServico ? ` (${tipoServico})` : ""}:`,
    `📅 *Data e Horário:* ${dataHora}`,
  ];

  if (tecnicoNome) {
    partes.push(`👨‍🔧 *Técnico responsável:* ${tecnicoNome}`);
  }

  if (endereco) {
    partes.push(`📍 *Endereço:* ${endereco}`);
  }

  partes.push(`Qualquer dúvida ou caso precise remarcar, é só nos responder por aqui!`);

  return partes.join("\n\n");
}

export function gerarMensagemStatus({
  clienteNome,
  protocolo,
  tipoServico,
  statusRotulo,
  tecnicoNome,
}: {
  clienteNome: string;
  protocolo: string;
  tipoServico?: string;
  statusRotulo: string;
  tecnicoNome?: string | null;
}): string {
  const partes: string[] = [
    `Olá, *${clienteNome}*! Tudo bem?`,
    `Aqui é da equipe da *Climatiza*. O seu atendimento *#${protocolo.slice(-8).toUpperCase()}*${tipoServico ? ` (${tipoServico})` : ""} teve uma atualização:`,
    `📌 *Status atual:* ${statusRotulo}`,
  ];

  if (tecnicoNome) {
    partes.push(`👨‍🔧 *Técnico responsável:* ${tecnicoNome}`);
  }

  partes.push(`Estamos à disposição!`);

  return partes.join("\n\n");
}

export function gerarMensagemConclusao({
  clienteNome,
  protocolo,
  tipoServico,
}: {
  clienteNome: string;
  protocolo: string;
  tipoServico?: string;
}): string {
  return [
    `Olá, *${clienteNome}*! Tudo bem?`,
    `Informamos que o seu atendimento *#${protocolo.slice(-8).toUpperCase()}*${tipoServico ? ` (${tipoServico})` : ""} foi *concluído com sucesso*! ✅`,
    `Agradecemos pela preferência nos serviços da *Climatiza*. Se precisar de novas manutenções ou suporte, conte conosco!`,
  ].join("\n\n");
}

