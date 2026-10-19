import { NextRequest, NextResponse } from "next/server";
import { sendInstagramReply } from "@/lib/social/inbox";
import { markGeneration } from "@/lib/ai/caption";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Envia la respuesta que escribio/aprobo Tommy. Protegido por el middleware.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const { id } = await params;
    const body = await request.json();
    const msg = await sendInstagramReply(id, String(body.text || ""), "tommy");
    if (body.generationId) {
      await markGeneration(String(body.generationId), body.edited ? "edited" : "accepted").catch(() => {});
    }
    return NextResponse.json({ message: msg });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
