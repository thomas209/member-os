import { NextRequest, NextResponse } from "next/server";
import { renderPostImage, POST_TAGS, type PostTag } from "@/lib/social/postImage";
import { socialDisabled } from "@/lib/ai/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vista previa de la imagen del post (PNG). Protegido por el middleware.
export async function GET(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  const sp = request.nextUrl.searchParams;
  const tag = sp.get("tag");
  try {
    return await renderPostImage({
      productId: sp.get("productId") || "",
      photo: Number(sp.get("photo") || 0),
      tag: tag && (POST_TAGS as readonly string[]).includes(tag) ? (tag as PostTag) : null,
      format: sp.get("format") === "story" ? "story" : "post",
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 400 });
  }
}
