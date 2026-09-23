import cron from "node-cron";
import { verificarManutencoes } from "./manutencaoVencida";

// Roda todo dia às 8h. Sem fila/worker separado de propósito — o volume
// de um sistema single-tenant não justifica essa complexidade ainda.
export function iniciarJobs() {
  cron.schedule("0 8 * * *", async () => {
    try {
      const resultado = await verificarManutencoes();
      console.log(
        `[job] verificação de manutenções: ${resultado.criados} alerta(s) criado(s) de ${resultado.verificados} combinação(ões) cliente/serviço.`
      );
    } catch (err) {
      console.error("[job] falha ao verificar manutenções:", err);
    }
  });
}
