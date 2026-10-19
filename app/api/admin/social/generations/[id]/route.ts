import { NextRequest, NextResponse } from "next/server";
import { markGeneration } from "@/lib/ai/caption";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Marca una sugerencia como aceptada, editada o descartada (para mejorar las
// instrucciones con el tiempo). Protegido por el middleware.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const { id } = await params;
    const { status } = await request.json();
    if (!["accepted", "edited", "discarded"].includes(status)) {
      return NextResponse.json({ error: "Estado invalido" }, { status: 400 });
    }
    await markGeneration(id, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
