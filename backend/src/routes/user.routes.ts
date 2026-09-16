import { Router } from "express";
import {
  atualizar,
  buscar,
  criar,
  desativar,
  listar,
} from "../controllers/user.controller";
import { autenticar, exigirAdmin } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

// Gestão de usuários é exclusiva de ADMIN.
router.use(autenticar, exigirAdmin);

router.get("/", asyncHandler(listar));
router.get("/:id", asyncHandler(buscar));
router.post("/", asyncHandler(criar));
router.patch("/:id", asyncHandler(atualizar));
router.delete("/:id", asyncHandler(desativar));

export default router;
