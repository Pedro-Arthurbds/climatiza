import { Router } from "express";
import {
  criar,
  listar,
  marcarResolvido,
} from "../controllers/notificationLog.controller";
import { autenticar, exigirAdmin } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

router.use(autenticar);

router.get("/", asyncHandler(listar));
router.post("/", exigirAdmin, asyncHandler(criar));
router.patch("/:id/resolver", exigirAdmin, asyncHandler(marcarResolvido));

export default router;
