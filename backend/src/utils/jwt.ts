import { SignJWT } from "jose";
import { jwtSecret } from "./jwtSecret";

export async function emitirToken(userId: string, role: string) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(jwtSecret);
}
