import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Sesion de cliente para la tienda, separada por completo del login de
// admin (NextAuth). Es una cookie firmada a mano (HMAC), sin dependencias
// nuevas: mas simple que sumar un segundo provider a NextAuth y no hay
// riesgo de romper el login de admin.
export const SESSION_COOKIE = "member_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

function getSecret() {
  return process.env.NEXTAUTH_SECRET || "member-club-dev-secret";
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionCookieValue(customerId: string): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = customerId + "." + expiresAt;
  return payload + "." + sign(payload);
}

export function verifySessionCookieValue(cookieValue: string | undefined | null): string | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return null;
  const [customerId, expiresAtStr, signature] = parts;
  const payload = customerId + "." + expiresAtStr;
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }
  const expiresAt = Number(expiresAtStr);
  if (!expiresAt || Date.now() > expiresAt) return null;
  return customerId;
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

// Server-only: para usar en Server Components y Route Handlers.
export async function getCurrentCustomerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionCookieValue(value);
}

export async function getCurrentCustomer() {
  const customerId = await getCurrentCustomerId();
  if (!customerId) return null;
  return prisma.customer.findUnique({ where: { id: customerId } });
}
