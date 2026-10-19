import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { socialDisabled } from "@/lib/ai/http";

// Saca un post de la agenda (vuelve a borrador). No toca lo ya publicado.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const off = socialDisabled();
  if (off) return off;
  const { id } = await params;
  const r = await prisma.scheduledPost.updateMany({ where: { id, status: "approved" }, data: { status: "draft", approvedAt: null, scheduledAt: null } });
  if (!r.count) return NextResponse.json({ error: "Ya se está publicando o no estaba agendado" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
