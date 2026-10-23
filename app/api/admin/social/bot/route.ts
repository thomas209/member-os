import { NextRequest, NextResponse } from "next/server";
import { socialDisabled } from "@/lib/ai/http";
import { autoReplyMode, setAutoReplyMode, type AutoReplyMode } from "@/lib/social/autoReply";

// Interruptor del bot de Instagram. Protegido por el middleware (/api/admin).
export async function GET() {
  const off = socialDisabled();
  if (off) return off;
  return NextResponse.json({ mode: await autoReplyMode() });
}

export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  const { mode } = await request.json().catch(() => ({}));
  if (!["off", "test", "on"].includes(mode)) return NextResponse.json({ error: "Modo inválido" }, { status: 400 });
  try {
    await setAutoReplyMode(mode as AutoReplyMode);
  } catch (e) {
    console.error("[bot] set", e);
    return NextResponse.json({ error: "No se pudo guardar: falta crear la tabla AppSetting en la base (npm run db:deploy-prod)." }, { status: 500 });
  }
  return NextResponse.json({ mode });
}
