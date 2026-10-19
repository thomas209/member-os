import { NextRequest, NextResponse } from "next/server";
import { generateCanvaPost } from "@/lib/ai/canvaContent";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Genera imagen (Canva) + caption (IA) como borrador. No publica nada.
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const body = await request.json();
    const slides = (Array.isArray(body.slides) ? body.slides : []).slice(0, 10).map((s: { productId: unknown; photo?: unknown; tag?: unknown }) => ({
      productId: String(s.productId),
      photo: Number(s.photo || 0),
      tag: s.tag ? String(s.tag) : null,
    }));
    const result = await generateCanvaPost({
      slides,
      templateId: String(body.templateId || ""),
      note: body.note ? String(body.note).slice(0, 500) : undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    return aiErrorResponse(e);
  }
}
