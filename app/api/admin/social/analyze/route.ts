import { NextResponse } from "next/server";
import { getActiveToken, markReauth, InstagramError } from "@/lib/social/instagram";
import { analyzeProfile } from "@/lib/ai/profileAnalysis";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Analiza el perfil conectado y devuelve una PROPUESTA de voz de marca.
// No guarda la voz: eso lo decide Tommy desde la pantalla.
export const maxDuration = 120;

export async function POST() {
  const off = socialDisabled();
  if (off) return off;
  let accountId: string | null = null;
  try {
    const { account, token } = await getActiveToken();
    accountId = account.id;
    const result = await analyzeProfile(token, account.handle);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof InstagramError && e.tokenInvalid && accountId) await markReauth(accountId);
    return aiErrorResponse(e);
  }
}
