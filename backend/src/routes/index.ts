import { Router } from "express";
import authRoutes from "./auth.routes";
import clientRoutes, { enderecoRouter } from "./client.routes";
import companyRoutes from "./company.routes";
import dashboardRoutes from "./dashboard.routes";
import notificationLogRoutes from "./notificationLog.routes";
import serviceTypeRoutes from "./serviceType.routes";
import ticketRoutes from "./ticket.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/usuarios", userRoutes);
router.use("/clientes", clientRoutes);
router.use("/enderecos", enderecoRouter);
router.use("/tipos-servico", serviceTypeRoutes);
router.use("/chamados", ticketRoutes);
router.use("/notificacoes", notificationLogRoutes);
router.use("/empresa", companyRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
