import { Router } from "express";
import { definirSenhaInicial, login, me } from "../controllers/auth.controller";
import { autenticar } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";
import { loginRateLimiter } from "../middlewares/rateLimit";

const router = Router();

router.post("/login", loginRateLimiter, asyncHandler(login));
router.get("/me", autenticar, asyncHandler(me));
router.post("/first-password", autenticar, asyncHandler(definirSenhaInicial));

export default router;