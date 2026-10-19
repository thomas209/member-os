import { NextRequest, NextResponse } from "next/server";
import { suggestReply } from "@/lib/ai/replyAssistant";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Borrador de respuesta con datos reales. No envia nada.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const { id } = await params;
    return NextResponse.json(await suggestReply(id));
  } catch (e) {
    return aiErrorResponse(e);
  }
}
