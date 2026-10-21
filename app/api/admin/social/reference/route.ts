import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { analyzeReference, dataUrlToBlock, sanitizeSpec } from "@/lib/ai/referenceStyle";
import { renderStyledPost } from "@/lib/social/styledPostImage";
import { POST_TAGS, type PostTag } from "@/lib/social/postImage";
import { getInstagramAccount } from "@/lib/social/instagram";
import { suggestCaption } from "@/lib/ai/caption";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";
import { AiError } from "@/lib/ai/client";

export const runtime = "nodejs";
export const maxDuration = 120;

const NOTES: Record<string, string> = {
  "NEW IN": "Es un post de nuevos ingresos: presentalos como recién llegados.",
  RESTOCK: "Volvieron a tener stock: avisá que volvieron.",
  SALE: "Están con precio rebajado: mencioná el precio de oferta que figura en los datos.",
  "ULTIMOS TALLES": "Quedan pocos talles: generá urgencia sin exagerar.",
};

// "Hacelo como este".
// action "analyze": { image } -> { spec }   (la IA lee la referencia; unica parte que cuesta)
// action "preview": { spec, productId, tag, format } -> { image }  (gratis, no guarda nada)
// action "draft":   { spec, productId, tag, format } -> { post }   (sube a Cloudinary y deja borrador; no publica)
export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const b = await request.json();
    if (b.action === "analyze") {
      return NextResponse.json({ spec: await analyzeReference(dataUrlToBlock(String(b.image || ""))) });
    }

    const spec = sanitizeSpec(b.spec);
    const productId = String(b.productId || "");
    if (!productId) throw new AiError("Elegí un producto", 400);
    const tag = b.tag && (POST_TAGS as readonly string[]).includes(b.tag) ? (b.tag as PostTag) : null;
    const format = b.format === "story" ? "story" : "post";
    const img = await renderStyledPost({ productId, spec, tag, format, photo: Number(b.photo || 0) });
    const buf = Buffer.from(await img.arrayBuffer());

    if (b.action === "preview") {
      return NextResponse.json({ image: "data:image/png;base64," + buf.toString("base64") });
    }
    if (b.action === "draft") {
      const account = await getInstagramAccount();
      if (!account) throw new AiError("Conectá Instagram primero", 400);
      const up = await cloudinary.uploader.upload("data:image/png;base64," + buf.toString("base64"), { folder: "member-os/social", format: "jpg" });
      const caption = format === "post" ? (await suggestCaption([productId], tag ? NOTES[tag] : undefined)).text : "";
      const post = await prisma.scheduledPost.create({
        data: { accountId: account.id, productIds: [productId], caption, mediaUrls: [up.secure_url], mediaType: format === "story" ? "story" : "image" },
      });
      return NextResponse.json({ post });
    }
    throw new AiError("Acción inválida", 400);
  } catch (e) {
    return aiErrorResponse(e);
  }
}
