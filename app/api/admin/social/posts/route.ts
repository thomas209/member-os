import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInstagramAccount } from "@/lib/social/instagram";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Crea un borrador de post (no publica). Protegido por el middleware.
export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const body = await request.json();
    const mediaUrls: string[] = (Array.isArray(body.mediaUrls) ? body.mediaUrls : []).map(String).filter((u: string) => u.startsWith("https://res.cloudinary.com/"));
    const isStory = body.kind === "story";
    // Las historias no llevan texto: Instagram no muestra caption en stories.
    const caption = isStory ? "" : String(body.caption || "").trim();
    const productIds: string[] = (Array.isArray(body.productIds) ? body.productIds : []).map(String);
    if (!mediaUrls.length || mediaUrls.length > 10) return NextResponse.json({ error: "Faltan las imágenes (1 a 10)" }, { status: 400 });
    if (!isStory && !caption) return NextResponse.json({ error: "Falta el texto del post" }, { status: 400 });
    if (caption.length > 2200) return NextResponse.json({ error: "El texto supera los 2200 caracteres de Instagram" }, { status: 400 });
    const account = await getInstagramAccount();
    if (!account) return NextResponse.json({ error: "No hay cuenta de Instagram conectada" }, { status: 400 });
    const post = await prisma.scheduledPost.create({
      data: { accountId: account.id, productIds, caption, mediaUrls, mediaType: isStory ? "story" : mediaUrls.length > 1 ? "carousel" : "image" },
    });
    return NextResponse.json({ post });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
