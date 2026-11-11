import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { iniciarJobs } from "./jobs";
import { errorHandler } from "./middlewares/errorHandler";
import { apiRateLimiter } from "./middlewares/rateLimit";
import routes from "./routes";

const app = express();

const isProducao = process.env.NODE_ENV === "production";
const origensConfiguradas = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

const origensPadraoDev = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

const origensPermitidas = origensConfiguradas.length
  ? origensConfiguradas
  : isProducao
    ? []
    : origensPadraoDev;

app.disable("x-powered-by");
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (como mobile apps, curl ou jobs)
      if (!origin) return callback(null, true);

      if (origensPermitidas.includes(origin)) {
        return callback(null, true);
      }

      // Em ambiente de desenvolvimento, aceita portas locais
      if (!isProducao && (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin))) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(apiRateLimiter);
app.use(express.json({ limit: "1mb" }));

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
