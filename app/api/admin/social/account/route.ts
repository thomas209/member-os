import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { connectInstagram, getInstagramAccount } from "@/lib/social/instagram";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Cuenta de Instagram conectada. Protegido por el middleware (/api/admin).
// El token nunca vuelve al navegador: solo handle, estado y vencimiento.
export async function GET() {
  const off = socialDisabled();
  if (off) return off;
  const a = await getInstagramAccount();
  return NextResponse.json({
    account: a
      ? { handle: a.handle, picture: a.profilePictureUrl, status: a.status, tokenExpiresAt: a.tokenExpiresAt }
      : null,
  });
}

export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const { token } = await request.json();
    const t = String(token || "").trim();
    if (t.length < 20) return NextResponse.json({ error: "Pega el token completo" }, { status: 400 });
    const a = await connectInstagram(t);
    return NextResponse.json({ account: { handle: a.handle, picture: a.profilePictureUrl, status: a.status, tokenExpiresAt: a.tokenExpiresAt } });
  } catch (e) {
    return aiErrorResponse(e);
  }
}

export async function DELETE() {
  const off = socialDisabled();
  if (off) return off;
  const a = await getInstagramAccount();
  if (a) await prisma.socialAccount.update({ where: { id: a.id }, data: { status: "disconnected", accessTokenEnc: "" } });
  return NextResponse.json({ ok: true });
}
