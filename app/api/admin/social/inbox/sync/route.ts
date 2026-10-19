import { NextResponse } from "next/server";
import { syncInstagram } from "@/lib/social/inbox";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Trae mensajes nuevos de Instagram. Protegido por el middleware.
export const maxDuration = 60;
export async function POST() {
  const off = socialDisabled();
  if (off) return off;
  try {
    return NextResponse.json(await syncInstagram());
  } catch (e) {
    return aiErrorResponse(e);
  }
}
