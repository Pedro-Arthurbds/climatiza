import { Router } from "express";
import { autenticar } from "../middlewares/auth";
import { verificarAssinatura } from "../middlewares/assinatura";
import authRoutes from "./auth.routes";
import assinaturaRoutes from "./assinatura.routes";
import clientRoutes, { enderecoRouter } from "./client.routes";
import companyRoutes from "./company.routes";
import dashboardRoutes from "./dashboard.routes";
import notificationLogRoutes from "./notificationLog.routes";
import serviceTypeRoutes from "./serviceType.routes";
import ticketRoutes from "./ticket.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use((req, res, next) => {
  if (
    req.path === "/auth/login" ||
    req.path === "/auth/me" ||
    req.path === "/auth/first-password" ||
    req.path === "/assinatura" ||
    req.path.startsWith("/assinatura/")
  ) {
    return next();
  }

  autenticar(req, res, (error) => {
    if (error) return next(error);
    verificarAssinatura(req, res, next);
  });
});

router.use("/auth", authRoutes);
router.use("/assinatura", assinaturaRoutes);
router.use("/usuarios", userRoutes);
router.use("/clientes", clientRoutes);
router.use("/enderecos", enderecoRouter);
router.use("/tipos-servico", serviceTypeRoutes);
router.use("/chamados", ticketRoutes);
router.use("/notificacoes", notificationLogRoutes);
router.use("/empresa", companyRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
