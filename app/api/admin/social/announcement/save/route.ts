import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { renderAnnouncement, cleanAnnouncement, LAYOUTS, type Layout } from "@/lib/social/announcementImage";
import { socialDisabled } from "@/lib/ai/http";

export const runtime = "nodejs";

// Guarda la imagen del anuncio en Cloudinary (jpg, lista para Instagram).
export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const body = await request.json();
    const a = cleanAnnouncement(body.announcement || {});
    if (!a.titulo) return NextResponse.json({ error: "Falta el título" }, { status: 400 });
    const img = await renderAnnouncement(a, { format: body.format === "post" ? "post" : "story", tema: body.tema === "oscuro" ? "oscuro" : "claro", layout: (LAYOUTS as readonly string[]).includes(body.layout) ? (body.layout as Layout) : "tabla" });
    const buf = Buffer.from(await img.arrayBuffer());
    const up = await cloudinary.uploader.upload("data:image/png;base64," + buf.toString("base64"), { folder: "member-os/social", format: "jpg" });
    return NextResponse.json({ url: up.secure_url });
  } catch (e) {
    console.error("[social] anuncio", e);
    return NextResponse.json({ error: "No se pudo guardar la imagen" }, { status: 500 });
  }
}
