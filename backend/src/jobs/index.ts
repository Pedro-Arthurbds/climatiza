import cron from "node-cron";
import { verificarRetornosPreventivos } from "./manutencaoVencida";

async function executarVerificacoes() {
  try {
    const retornos = await verificarRetornosPreventivos();
    console.log(
      `[job] retornos preventivos: ${retornos.criados} alerta(s) criado(s) de ${retornos.verificados} retorno(s) pendente(s).`
    );
  } catch (err) {
    console.error("[job] falha ao verificar manutenções:", err);
  }
}

// Executa ao iniciar e diariamente às 8h; evita depender do próximo cron.
export function iniciarJobs() {
  void executarVerificacoes();
  cron.schedule("0 8 * * *", () => {
    void executarVerificacoes();
  });
}
