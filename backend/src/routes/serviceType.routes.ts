import { Router } from "express";
import {
  atualizar,
  criar,
  desativar,
  listar,
} from "../controllers/serviceType.controller";
import { autenticar, exigirAdmin } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

router.use(autenticar);

router.get("/", asyncHandler(listar));
router.post("/", exigirAdmin, asyncHandler(criar));
router.patch("/:id", exigirAdmin, asyncHandler(atualizar));
router.delete("/:id", exigirAdmin, asyncHandler(desativar));

export default router;
