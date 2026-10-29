import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { socialDisabled } from "@/lib/ai/http";

// "Aprobar toda la semana": agenda todas las propuestas (borradores con
// fecha) de ese rango que todavia esten en el futuro. Requiere confirm: true.
export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  const b = await request.json().catch(() => ({}));
  if (b.confirm !== true) return NextResponse.json({ error: "Falta la confirmación" }, { status: 400 });
  const from = new Date(String(b.from)), to = new Date(String(b.to));
  if (isNaN(+from) || isNaN(+to)) return NextResponse.json({ error: "Rango inválido" }, { status: 400 });
  const gte = new Date(Math.max(+from, Date.now() + 60_000));
  const r = await prisma.scheduledPost.updateMany({
    where: { status: "draft", scheduledAt: { gte, lt: to } },
    data: { status: "approved", approvedAt: new Date(), lastError: null },
  });
  return NextResponse.json({ approved: r.count });
}
