import { NextResponse } from "next/server";
import { announcementPresets } from "@/lib/storeInfo";
import { socialDisabled } from "@/lib/ai/http";

// Anuncios precargados con los datos reales del local (horarios, dirección...).
export async function GET() {
  const off = socialDisabled();
  if (off) return off;
  return NextResponse.json({ presets: announcementPresets() });
}
