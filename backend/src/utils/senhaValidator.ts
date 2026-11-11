import { z } from "zod";

export const senhaForteSchema = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres.")
  .regex(/[a-zA-Z]/, "A senha deve conter ao menos uma letra.")
  .regex(/[0-9]/, "A senha deve conter ao menos um número.");

