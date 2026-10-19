import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callModel } from "@/lib/ai/client";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Ordena el texto que escribio Tommy en titulo + renglones. NO agrega datos.
export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const { text } = await request.json();
    const t = String(text || "").trim().slice(0, 1500);
    if (!t) return NextResponse.json({ error: "Escribí el texto del anuncio" }, { status: 400 });
    const r = await callModel({
      system: "Ordenás textos para una placa de Instagram. Usás SOLO la información que te dan: no agregás días, horarios, direcciones, precios ni frases que no estén. Respondés solo JSON válido.",
      user: `Texto de Tommy:\n${t}\n\nDevolvé {"titulo": "título corto (ej: HORARIOS)", "subtitulo": "opcional, solo si está en el texto (ej: una fecha o 'temporada de verano')", "lineas": ["una línea por dato, formato 'Clave: valor' cuando aplique, ej 'Lunes a viernes: 10 a 20 h'"]}. Máximo 12 líneas.`,
      maxTokens: 500,
    });
    await prisma.aiGeneration.create({
      data: { kind: "announcement", input: { text: t }, output: r.text, model: r.model, inputTokens: r.inputTokens, outputTokens: r.outputTokens, costUsd: r.costUsd },
    });
    const s = r.text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    return NextResponse.json(JSON.parse(s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1)));
  } catch (e) {
    return aiErrorResponse(e);
  }
}
