import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { renderPostImage, POST_TAGS, type PostTag } from "@/lib/social/postImage";
import { socialDisabled } from "@/lib/ai/http";

export const runtime = "nodejs";

// Genera las imagenes finales del post y las guarda en Cloudinary
// (carpeta member-os/social, en jpg: el formato que acepta Instagram).
// Body: { slides: [{ productId, photo, tag }] }
export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const { slides, format } = await request.json();
    if (!Array.isArray(slides) || !slides.length || slides.length > 10) {
      return NextResponse.json({ error: "Entre 1 y 10 imagenes" }, { status: 400 });
    }
    const urls: string[] = [];
    for (const s of slides) {
      const tag = s.tag && (POST_TAGS as readonly string[]).includes(s.tag) ? (s.tag as PostTag) : null;
      const img = await renderPostImage({ productId: String(s.productId), photo: Number(s.photo || 0), tag, format: format === "story" ? "story" : "post" });
      const buf = Buffer.from(await img.arrayBuffer());
      const up = await cloudinary.uploader.upload("data:image/png;base64," + buf.toString("base64"), {
        folder: "member-os/social",
        format: "jpg",
      });
      urls.push(up.secure_url);
    }
    return NextResponse.json({ urls });
  } catch (e) {
    console.error("[social] guardar imagenes", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
