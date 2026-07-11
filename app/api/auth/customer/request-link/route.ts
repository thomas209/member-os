import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendLoginLinkEmail } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL_MINUTES = 15;

// Pide (o crea) la cuenta por email y manda el link magico de acceso.
// Siempre responde { ok: true } exista o no el email, para no revelar
// si un email esta o no registrado.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Ingresa un email valido" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const loginTokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

    const customer = await prisma.customer.upsert({
      where: { email },
      update: { loginToken: token, loginTokenExpiresAt },
      create: { email, firstName: "", lastName: "", loginToken: token, loginTokenExpiresAt },
    });

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const loginUrl = baseUrl + "/api/auth/customer/verify?token=" + token;

    try {
      await sendLoginLinkEmail({ to: customer.email, loginUrl });
    } catch (emailError) {
      console.error("No se pudo enviar el email de login:", emailError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en request-link:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
