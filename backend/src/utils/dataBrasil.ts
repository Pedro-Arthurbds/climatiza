const FUSO_BRASIL = "America/Sao_Paulo";

export function dataAtualBrasil(data = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_BRASIL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

export function dataUtc(data: string) {
  return new Date(`${data}T00:00:00.000Z`);
}

export function adicionarDias(data: string, dias: number) {
  const resultado = dataUtc(data);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}

export function adicionarMeses(data: string, meses: number) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const primeiroDoMesSeguinte = new Date(Date.UTC(ano, mes - 1 + meses, 1));
  const ultimoDia = new Date(
    Date.UTC(
      primeiroDoMesSeguinte.getUTCFullYear(),
      primeiroDoMesSeguinte.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();
  primeiroDoMesSeguinte.setUTCDate(Math.min(dia, ultimoDia));
  return primeiroDoMesSeguinte.toISOString().slice(0, 10);
}

export function diferencaDias(dataInicial: string, dataFinal: string) {
  return (
    (dataUtc(dataFinal).getTime() - dataUtc(dataInicial).getTime()) /
    86_400_000
  );
}
