import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { socialDisabled } from "@/lib/ai/http";

// Saca una plantilla de la lista (no borra nada en Canva).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const off = socialDisabled();
  if (off) return off;
  const { id } = await params;
  await prisma.socialTemplate.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
