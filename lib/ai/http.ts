import { NextResponse } from "next/server";
import { AiError } from "./client";
import { isSocialEnabled } from "./config";
import { InstagramError } from "@/lib/social/instagram";
import { CanvaError } from "@/lib/social/canva";

// Si el modulo esta apagado, las rutas responden como si no existieran.
export function socialDisabled() {
  return isSocialEnabled() ? null : NextResponse.json({ error: "No encontrado" }, { status: 404 });
}

export function aiErrorResponse(e: unknown) {
  if (e instanceof AiError || e instanceof InstagramError || e instanceof CanvaError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error("[social]", e);
  return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
}
