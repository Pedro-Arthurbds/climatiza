import { Router } from "express";
import {
  alertas,
  grafico,
  porTecnico,
  resumo,
} from "../controllers/dashboard.controller";
import { autenticar } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

// Leitura liberada pra ADMIN e TECNICO — cada um vê o panorama geral.
router.use(autenticar);

router.get("/resumo", asyncHandler(resumo));
router.get("/por-tecnico", asyncHandler(porTecnico));
router.get("/grafico", asyncHandler(grafico));
router.get("/alertas", asyncHandler(alertas));

export default router;
