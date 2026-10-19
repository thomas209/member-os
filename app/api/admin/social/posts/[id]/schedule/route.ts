import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { socialDisabled } from "@/lib/ai/http";

// Agendar = aprobar para una fecha. Requiere confirm: true (OK de Tommy).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const off = socialDisabled();
  if (off) return off;
  const { id } = await params;
  const b = await request.json();
  if (b.confirm !== true) return NextResponse.json({ error: "Falta la confirmación" }, { status: 400 });
  const when = new Date(String(b.scheduledAt));
  if (isNaN(+when)) return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  if (+when < Date.now() + 60_000) return NextResponse.json({ error: "Elegí una fecha y hora futura" }, { status: 400 });
  const r = await prisma.scheduledPost.updateMany({
    where: { id, status: { in: ["draft", "paused", "failed", "approved"] } },
    data: { status: "approved", approvedAt: new Date(), scheduledAt: when, lastError: null },
  });
  if (!r.count) return NextResponse.json({ error: "No se puede agendar (ya publicado o publicándose)" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
