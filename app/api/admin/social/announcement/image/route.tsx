import { NextRequest, NextResponse } from "next/server";
import { renderAnnouncement, cleanAnnouncement, LAYOUTS, type Layout } from "@/lib/social/announcementImage";
import { socialDisabled } from "@/lib/ai/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vista previa del anuncio. ?d=<json en base64url>&format=story|post&tema=claro|oscuro
export async function GET(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  const sp = request.nextUrl.searchParams;
  try {
    const a = cleanAnnouncement(JSON.parse(Buffer.from(sp.get("d") || "", "base64url").toString("utf8")));
    if (!a.titulo) return NextResponse.json({ error: "Falta el título" }, { status: 400 });
    return await renderAnnouncement(a, { format: sp.get("format") === "post" ? "post" : "story", tema: sp.get("tema") === "oscuro" ? "oscuro" : "claro", layout: (LAYOUTS as readonly string[]).includes(sp.get("layout") || "") ? (sp.get("layout") as Layout) : "tabla" });
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
}
