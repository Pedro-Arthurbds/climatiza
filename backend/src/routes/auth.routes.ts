import { Router } from "express";
import { definirSenhaInicial, login } from "../controllers/auth.controller";
import { autenticar } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

router.post("/login", asyncHandler(login));
router.post("/first-password", autenticar, asyncHandler(definirSenhaInicial));

export default router;