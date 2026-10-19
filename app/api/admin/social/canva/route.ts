import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCanvaAccount } from "@/lib/social/canva";
import { socialDisabled } from "@/lib/ai/http";

// Estado de la conexion con Canva (sin tokens). Protegido por el middleware.
export async function GET() {
  const off = socialDisabled();
  if (off) return off;
  const a = await getCanvaAccount();
  return NextResponse.json({ connected: !!a });
}

export async function DELETE() {
  const off = socialDisabled();
  if (off) return off;
  await prisma.socialAccount.updateMany({
    where: { platform: "canva" },
    data: { status: "disconnected", accessTokenEnc: "" },
  });
  return NextResponse.json({ ok: true });
}
