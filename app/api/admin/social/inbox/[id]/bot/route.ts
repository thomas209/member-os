import { NextRequest, NextResponse } from "next/server";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";
import { returnToBot } from "@/lib/social/autoReply";

// "Devolver al bot". Protegido por el middleware (/api/admin).
export const maxDuration = 60;
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const { id } = await params;
    return NextResponse.json({ result: await returnToBot(id) });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
