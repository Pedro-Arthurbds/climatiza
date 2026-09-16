import { Router } from "express";
import { login } from "../controllers/auth.controller";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

router.post("/login", asyncHandler(login));

export default router;
