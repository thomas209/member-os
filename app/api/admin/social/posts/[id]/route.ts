import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { socialDisabled } from "@/lib/ai/http";

// Editar el texto (y en borradores, la imagen) de un borrador o de un post agendado (todavia no publicado).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const off = socialDisabled();
  if (off) return off;
  const { id } = await params;
  const { caption, mediaUrls } = await request.json();
  const text = String(caption ?? "").slice(0, 2200);
  // Opcional: reemplazar la imagen de un BORRADOR (ej. se edito el anuncio y se volvio a previsualizar).
  const urls = Array.isArray(mediaUrls) ? mediaUrls.map(String).filter((u: string) => u.startsWith("https://res.cloudinary.com/")).slice(0, 10) : null;
  if (urls && urls.length) {
    const m = await prisma.scheduledPost.updateMany({ where: { id, status: "draft" }, data: { caption: text, mediaUrls: urls } });
    if (!m.count) return NextResponse.json({ error: "Ya se agendó o publicó" }, { status: 409 });
    return NextResponse.json({ ok: true });
  }
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
