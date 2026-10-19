import { NextRequest, NextResponse } from "next/server";
import { suggestCaption } from "@/lib/ai/caption";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Genera un caption sugerido. Protegido por el middleware (/api/admin/:path*).
export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const body = await request.json();
    const productIds: string[] = Array.isArray(body.productIds) ? body.productIds.map(String).slice(0, 10) : [];
    const note = body.note ? String(body.note).slice(0, 500) : undefined;
    const result = await suggestCaption(productIds, note);
    return NextResponse.json({ generationId: result.generationId, text: result.text });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
