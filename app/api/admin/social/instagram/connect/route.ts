import { NextResponse } from "next/server";
import crypto from "crypto";
import { socialDisabled } from "@/lib/ai/http";
import { authorizeUrl } from "@/lib/social/instagramOAuth";

// Arranca "Conectar con Instagram". Protegido por el middleware (/api/admin).
export async function GET() {
  const off = socialDisabled();
  if (off) return off;
  const state = crypto.randomBytes(16).toString("hex");
  const res = NextResponse.redirect(authorizeUrl(state));
  res.cookies.set("ig_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/admin/social/instagram", maxAge: 600 });
  return res;
}
export const dynamic = "force-dynamic";
