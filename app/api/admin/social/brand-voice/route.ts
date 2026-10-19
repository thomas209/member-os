import { NextRequest, NextResponse } from "next/server";
import { getBrandVoice, saveBrandVoice } from "@/lib/ai/brandVoice";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Protegido por el middleware (/api/admin/:path*).
export async function GET() {
  const off = socialDisabled();
  if (off) return off;
  return NextResponse.json({ voice: await getBrandVoice() });
}

const list = (v: unknown) =>
  (Array.isArray(v) ? v : [])
    .map((x) => String(x).trim())
    .filter(Boolean)
    .slice(0, 50);

export async function PUT(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const body = await request.json();
    const voice = await saveBrandVoice({
      tone: String(body.tone || "").trim().slice(0, 2000),
      doWords: list(body.doWords),
      dontWords: list(body.dontWords),
      examples: list(body.examples).map((e) => e.slice(0, 2200)).slice(0, 15),
      ...(body.insights && typeof body.insights === "object" ? { insights: body.insights } : {}),
    });
    return NextResponse.json({ voice });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
