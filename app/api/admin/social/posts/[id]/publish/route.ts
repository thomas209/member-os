import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishPost } from "@/lib/social/publish";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Aprueba y publica YA. Requiere confirm: true (el OK explícito de Tommy).
// Protegido por el middleware (/api/admin).
export const maxDuration = 120;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    if (body.confirm !== true) return NextResponse.json({ error: "Falta la confirmación" }, { status: 400 });
    await prisma.scheduledPost.updateMany({
      where: { id, status: { in: ["draft", "failed", "paused"] } },
      data: { status: "approved", approvedAt: new Date() },
    });
    const post = await publishPost(id);
    return NextResponse.json({ post });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
