import { Router } from "express";
import { atualizar, obter } from "../controllers/company.controller";
import { autenticar, exigirAdmin } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

router.use(autenticar);

router.get("/", asyncHandler(obter));
router.patch("/", exigirAdmin, asyncHandler(atualizar));

export default router;
