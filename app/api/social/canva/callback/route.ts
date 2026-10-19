import { NextRequest, NextResponse } from "next/server";
import { handleCallback } from "@/lib/social/canva";
import { isSocialEnabled } from "@/lib/ai/config";

// Vuelta del login de Canva. Canva solo permite redirigir a 127.0.0.1 en
// desarrollo, donde no esta la sesion del admin: por eso esta ruta queda
// fuera de /api/admin y se valida con el "state" cifrado (vence en 15 min).
export async function GET(request: NextRequest) {
  if (!isSocialEnabled()) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const url = request.nextUrl;
  const back = new URL("/admin/social/crear", url.origin.replace("127.0.0.1", "localhost"));
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    back.searchParams.set("canva", "error");
    return NextResponse.redirect(back);
  }
  try {
    await handleCallback(code, state);
    back.searchParams.set("canva", "ok");
  } catch (e) {
    console.error("[canva] callback", e);
    back.searchParams.set("canva", "error");
  }
  return NextResponse.redirect(back);
}
