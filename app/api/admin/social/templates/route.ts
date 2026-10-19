import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDesignId, getDesignDataset } from "@/lib/social/canva";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";
import { validateDataset } from "@/lib/ai/canvaContent";

// Plantillas de Canva. Protegido por el middleware (/api/admin).
export async function GET() {
  const off = socialDisabled();
  if (off) return off;
  const templates = await prisma.socialTemplate.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const body = await request.json();
    const designId = parseDesignId(String(body.url || ""));
    if (!designId) return NextResponse.json({ error: "Pega el link del diseno de Canva" }, { status: 400 });
    const dataset = await getDesignDataset(designId);
    if (!Object.keys(dataset).length) {
      return NextResponse.json(
        { error: "Ese diseno no tiene campos de autocompletar. En Canva: Apps -> Data autofill -> conecta la foto y los textos." },
        { status: 400 }
      );
    }
    const invalid = validateDataset(dataset);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
    const name = String(body.name || "").trim() || "Plantilla";
    const template = await prisma.socialTemplate.upsert({
      where: { canvaDesignId: designId },
      create: { name, canvaDesignId: designId, dataset },
      update: { name, dataset, isActive: true },
    });
    return NextResponse.json({ template });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
