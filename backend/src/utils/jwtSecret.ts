const valor = process.env.JWT_SECRET;

if (!valor || Buffer.byteLength(valor, "utf8") < 32) {
  throw new Error("JWT_SECRET é obrigatório e deve ter pelo menos 32 bytes.");
}

export const jwtSecret = new TextEncoder().encode(valor);