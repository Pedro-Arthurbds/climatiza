import { Router } from "express";
import {
  atualizarAssinatura,
  estado,
  painelAdmin,
  registrarPagamento,
} from "../controllers/assinatura.controller";
import { autenticar } from "../middlewares/auth";
import { exigirDonoAssinatura } from "../middlewares/assinatura";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

router.get("/", autenticar, asyncHandler(estado));
router.get("/admin", autenticar, exigirDonoAssinatura, asyncHandler(painelAdmin));
router.patch("/admin", autenticar, exigirDonoAssinatura, asyncHandler(atualizarAssinatura));
router.post(
  "/pagamentos",
  autenticar,
  exigirDonoAssinatura,
  asyncHandler(registrarPagamento)
);

export default router;
