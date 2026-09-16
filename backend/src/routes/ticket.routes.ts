import { Router } from "express";
import {
  agenda,
  atribuir,
  atualizar,
  atualizarStatus,
  buscar,
  criar,
  criarAnexo,
  criarNota,
  listar,
  reagendar,
  remover,
  removerAnexo,
  removerNota,
} from "../controllers/ticket.controller";
import { autenticar, exigirAdmin } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

router.use(autenticar);

// Precisa vir antes de /:id, senão "agenda" é capturado como id.
router.get("/agenda", asyncHandler(agenda));

router.get("/", asyncHandler(listar));
router.get("/:id", asyncHandler(buscar));

router.post("/", exigirAdmin, asyncHandler(criar));
router.patch("/:id", exigirAdmin, asyncHandler(atualizar));
router.delete("/:id", exigirAdmin, asyncHandler(remover));

// Status: ADMIN sempre; TECNICO só no chamado dele (checado no controller).
router.patch("/:id/status", asyncHandler(atualizarStatus));

router.patch("/:id/atribuir", exigirAdmin, asyncHandler(atribuir));
router.patch("/:id/reagendar", exigirAdmin, asyncHandler(reagendar));

// Observações internas: técnico pode registrar o que viu em campo.
router.post("/:id/notas", asyncHandler(criarNota));
router.delete("/:id/notas/:notaId", asyncHandler(removerNota));

router.post("/:id/anexos", asyncHandler(criarAnexo));
router.delete("/:id/anexos/:anexoId", exigirAdmin, asyncHandler(removerAnexo));

export default router;
