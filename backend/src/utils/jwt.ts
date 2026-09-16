import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);

export async function emitirToken(userId: string, role: string) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}
