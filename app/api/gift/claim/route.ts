import { NextResponse } from "next/server";
import { claimGift } from "@/lib/giftCard";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const b = await request.json();
    const s = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const input = { token: s(b.token, 64), firstName: s(b.firstName), lastName: s(b.lastName), email: s(b.email, 200), phone: s(b.phone, 40) };
    if (!input.token) return NextResponse.json({ error: "Link inválido" }, { status: 400 });
    if (!input.firstName || !input.lastName) return NextResponse.json({ error: "Completá tu nombre y apellido" }, { status: 400 });
    if (!EMAIL_REGEX.test(input.email)) return NextResponse.json({ error: "Ingresá un email válido" }, { status: 400 });
    if (input.phone && input.phone.replace(/\D/g, "").length < 8) return NextResponse.json({ error: "Ingresá un teléfono válido (con código de área)" }, { status: 400 });
    const r = await claimGift(input);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status || 400 });
    return NextResponse.json({ ok: true, email: r.email, code: r.code, validUntil: r.validUntil ? r.validUntil.toISOString() : null, alreadyClaimed: !!r.alreadyClaimed });
  } catch (e) {
    console.error("[gift] claim", e);
    return NextResponse.json({ error: "Algo salió mal, probá de nuevo en un rato." }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
