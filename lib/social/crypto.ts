// Cifrado de tokens de redes sociales (AES-256-GCM).
// SOCIAL_TOKEN_KEY: 32 bytes en base64. Se genera con:
//   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
import crypto from "crypto";

function key(): Buffer {
  const raw = process.env.SOCIAL_TOKEN_KEY;
  if (!raw) throw new Error("Falta SOCIAL_TOKEN_KEY en el .env");
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("SOCIAL_TOKEN_KEY tiene que ser de 32 bytes en base64");
  return k;
}

export function encryptToken(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString("base64")).join(".");
}

export function decryptToken(stored: string): string {
  const [iv, tag, enc] = stored.split(".").map((s) => Buffer.from(s, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
