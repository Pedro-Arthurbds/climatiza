import "dotenv/config";
import cors from "cors";
import express from "express";
import { iniciarJobs } from "./jobs";
import { errorHandler } from "./middlewares/errorHandler";
import routes from "./routes";

const app = express();

const origensPermitidas = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origensPermitidas.length ? origensPermitidas : true,
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", routes);

// Precisa vir depois de todas as rotas.
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3333;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Climatiza API rodando na porta ${PORT}`);
  iniciarJobs();
});
