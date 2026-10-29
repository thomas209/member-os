import { NextRequest, NextResponse } from "next/server";
import { createDraft } from "@/lib/social/drafts";
import { POST_TAGS, type PostTag } from "@/lib/social/postImage";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Borrador en un clic desde una sugerencia. No publica.
export const maxDuration = 120;
export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const b = await request.json();
    // Propuesta del plan semanal: fecha futura opcional.
    const when = b.scheduledAt ? new Date(String(b.scheduledAt)) : null;
    if (when && (isNaN(+when) || +when < Date.now())) return NextResponse.json({ error: "Fecha inválida o pasada" }, { status: 400 });
    const post = await createDraft({
      productIds: Array.isArray(b.productIds) ? b.productIds.map(String) : undefined,
      tag: b.tag && (POST_TAGS as readonly string[]).includes(b.tag) ? (b.tag as PostTag) : null,
      format: b.format === "story" ? "story" : "post",
      presetId: b.presetId ? String(b.presetId) : undefined,
      scheduledAt: when,
    });
    return NextResponse.json({ post });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
