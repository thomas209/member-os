import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { socialDisabled } from "@/lib/ai/http";

// Editar el texto de un borrador o de un post agendado (todavia no publicado).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const off = socialDisabled();
  if (off) return off;
  const { id } = await params;
  const { caption } = await request.json();
  const text = String(caption ?? "").slice(0, 2200);
  const r = await prisma.scheduledPost.updateMany({ where: { id, status: { in: ["draft", "approved", "paused", "failed"] } }, data: { caption: text } });
  if (!r.count) return NextResponse.json({ error: "Ya se publicó o no existe" }, { status: 409 });
  return NextResponse.json({ ok: true });
}

// Descartar un borrador (no toca nada publicado).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const off = socialDisabled();
  if (off) return off;
  const { id } = await params;
  await prisma.scheduledPost.deleteMany({ where: { id, status: { in: ["draft", "paused", "failed"] } } });
  return NextResponse.json({ ok: true });
}
