import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/social/canva";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Arranca el login de Canva. Protegido por el middleware (/api/admin).
export async function GET() {
  const off = socialDisabled();
  if (off) return off;
  try {
    return NextResponse.redirect(buildAuthUrl());
  } catch (e) {
    return aiErrorResponse(e);
  }
}
