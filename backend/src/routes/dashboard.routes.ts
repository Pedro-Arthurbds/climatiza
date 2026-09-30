import { Router } from "express";
import {
  alertas,
  contatosPrioritarios,
  grafico,
  porTecnico,
  resumo,
  verificarManutencoesAgora,
} from "../controllers/dashboard.controller";
import { autenticar, exigirAdmin } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

// Leitura liberada pra ADMIN e TECNICO — cada um vê o panorama geral.
router.use(autenticar);

router.get("/resumo", asyncHandler(resumo));
router.get("/contatos-prioritarios", asyncHandler(contatosPrioritarios));
router.get("/por-tecnico", asyncHandler(porTecnico));
router.get("/grafico", asyncHandler(grafico));
router.get("/alertas", asyncHandler(alertas));

router.post(
  "/verificar-manutencoes",
  exigirAdmin,
  asyncHandler(verificarManutencoesAgora)
);

export default router;
