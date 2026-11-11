import rateLimit from "express-rate-limit";

// Limite estrito para a rota de login contra ataques de força bruta
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo de 10 tentativas de login por IP dentro da janela
  standardHeaders: true, // Retorna RateLimit-* headers
  legacyHeaders: false, // Desativa X-RateLimit-* legados
  message: {
    error: "Muitas tentativas de login a partir deste IP. Tente novamente em 15 minutos.",
  },
});

// Limite geral para a API contra DoS e abuso de endpoints
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 300, // máximo de 300 requisições por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas requisições enviadas. Aguarde um instante antes de tentar novamente.",
  },
});

