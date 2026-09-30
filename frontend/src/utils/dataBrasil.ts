const fusoBrasil = "America/Sao_Paulo";

function obterParteData(valor: string | Date, tipo: Intl.DateTimeFormatPartTypes) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: fusoBrasil,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(new Date(valor))
    .find((parte) => parte.type === tipo)?.value ?? "";
}

export function formatarDataHoraBrasil(valor: string | Date | null) {
  if (!valor) return "—";
  return `${obterParteData(valor, "day")}/${obterParteData(valor, "month")}/${obterParteData(valor, "year")} às ${obterParteData(valor, "hour")}:${obterParteData(valor, "minute")}`;
}

export function formatarDataBrasil(valor: string | Date | null) {
  if (!valor) return "";
  return `${obterParteData(valor, "day")}/${obterParteData(valor, "month")}/${obterParteData(valor, "year")}`;
}

export function formatarHoraBrasil(valor: string | Date | null) {
  if (!valor) return "";
  return `${obterParteData(valor, "hour")}:${obterParteData(valor, "minute")}`;
}

export function mascararDataBrasil(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

export function mascararHoraBrasil(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 4);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
}

export function dataHoraBrasilParaIso(data: string, hora: string) {
  const correspondenciaData = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const correspondenciaHora = hora.match(/^(\d{2}):(\d{2})$/);
  if (!correspondenciaData || !correspondenciaHora) return null;

  const [, dia, mes, ano] = correspondenciaData;
  const [, horas, minutos] = correspondenciaHora;
  const dataUtc = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
  if (
    dataUtc.getUTCFullYear() !== Number(ano) ||
    dataUtc.getUTCMonth() !== Number(mes) - 1 ||
    dataUtc.getUTCDate() !== Number(dia) ||
    Number(horas) > 23 ||
    Number(minutos) > 59
  ) {
    return null;
  }

  return new Date(`${ano}-${mes}-${dia}T${horas}:${minutos}:00-03:00`).toISOString();
}