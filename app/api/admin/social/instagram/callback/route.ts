import { NextRequest, NextResponse } from "next/server";
import { socialDisabled } from "@/lib/ai/http";
import { exchangeCode, siteUrl } from "@/lib/social/instagramOAuth";
import { connectInstagram, subscribeWebhooks } from "@/lib/social/instagram";

// Vuelta de Instagram: valida el state, cambia el codigo por un token largo y
// lo guarda cifrado (reemplaza al anterior). Despues activa los avisos.
export async function GET(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  const back = (q: string) => {
    const res = NextResponse.redirect(siteUrl() + "/admin/social/comentarios?" + q);
    res.cookies.delete({ name: "ig_oauth_state", path: "/api/admin/social/instagram" });
    return res;
  };
  const p = request.nextUrl.searchParams;
  if (p.get("error")) return back("ig=error&msg=" + encodeURIComponent(p.get("error_description") || "Cancelaste el permiso"));
  const code = p.get("code") || "";
  const state = p.get("state") || "";
  const saved = request.cookies.get("ig_oauth_state")?.value;
  if (!code || !state || !saved || saved !== state) return back("ig=error&msg=" + encodeURIComponent("El link venció, probá de nuevo"));
  try {
    const token = await exchangeCode(code);
    await connectInstagram(token);
    try { await subscribeWebhooks(token); } catch (e) { console.error("[instagram] subscribe", e); }
    return back("ig=ok");
  } catch (e) {
    console.error("[instagram] oauth", e);
    return back("ig=error&msg=" + encodeURIComponent(e instanceof Error ? e.message : "Error"));
  }
}
export const dynamic = "force-dynamic";
