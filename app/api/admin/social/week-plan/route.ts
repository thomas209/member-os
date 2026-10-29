import { NextRequest, NextResponse } from "next/server";
import { planWeek } from "@/lib/social/weekPlan";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Plan de la semana: que pieza va cada dia (no crea nada ni usa IA).
export async function GET(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const weekStart = new Date(String(request.nextUrl.searchParams.get("weekStart")));
    if (isNaN(+weekStart)) return NextResponse.json({ error: "Semana inválida" }, { status: 400 });
    const exclude = (request.nextUrl.searchParams.get("exclude") || "").split(",").filter(Boolean).slice(0, 200);
    return NextResponse.json({ slots: await planWeek(weekStart, exclude) });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
