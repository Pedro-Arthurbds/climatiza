import { Router } from "express";
import { autenticar } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";
import { criar, listar } from "../controllers/exemplo.controller";

const router = Router();

router.get("/", autenticar, asyncHandler(listar));
router.post("/", autenticar, asyncHandler(criar));

export default router;
