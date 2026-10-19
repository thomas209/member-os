import { NextRequest, NextResponse } from "next/server";
import { recommendDesign } from "@/lib/ai/designAdvisor";
import { getActiveToken } from "@/lib/social/instagram";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Recomienda diseño, foto y etiqueta mirando los mejores posts de Instagram.
// Protegido por el middleware (/api/admin).
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const body = await request.json();
    const productIds: string[] = Array.isArray(body.productIds) ? body.productIds.map(String).slice(0, 10) : [];
    let token: string | null = null;
    try {
      token = (await getActiveToken()).token;
    } catch {
      token = null; // sin Instagram conectado recomienda igual, con menos contexto
    }
    return NextResponse.json(await recommendDesign(productIds, token));
  } catch (e) {
    return aiErrorResponse(e);
  }
}
