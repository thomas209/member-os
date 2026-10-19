// Analiza los posts propios de Instagram y PROPONE una voz de marca.
// No guarda nada en BrandVoice: la propuesta vuelve a la pantalla y Tommy
// decide si la usa. Solo lee Instagram (API oficial, sin scraping).
import { prisma } from "@/lib/prisma";
import { callModel, AiError, type ContentBlock } from "./client";
import { listMedia, type IgMedia } from "@/lib/social/instagram";

export type VoiceProposal = {
  tone: string;
  doWords: string[];
  dontWords: string[];
  examples: string[];
  insights: {
    resumen: string;
    estiloVisual: string;
    hashtagsFrecuentes: string[];
    queRindeMas: string[];
    queRindeMenos: string[];
    recomendaciones: string[];
  };
};

// Descarga la imagen desde nuestro servidor y la manda embebida (base64).
// El CDN de Instagram no siempre deja que la IA la baje directo por URL.
export async function toImageBlock(url: string): Promise<ContentBlock | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") || "image/jpeg").split(";")[0];
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 4_500_000) return null; // limite de la API por imagen
    return { type: "image", source: { type: "base64", media_type: type, data: buf.toString("base64") } };
  } catch {
    return null;
  }
}

export const engagement = (m: IgMedia) => (m.like_count ?? 0) + 3 * (m.comments_count ?? 0);

function parseJson(text: string): VoiceProposal {
  const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  const obj = JSON.parse(clean.slice(start, end + 1));
  const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
  return {
    tone: String(obj.tone || ""),
    doWords: arr(obj.doWords),
    dontWords: arr(obj.dontWords),
    examples: arr(obj.examples).slice(0, 6),
    insights: {
      resumen: String(obj.insights?.resumen || ""),
      estiloVisual: String(obj.insights?.estiloVisual || ""),
      hashtagsFrecuentes: arr(obj.insights?.hashtagsFrecuentes),
      queRindeMas: arr(obj.insights?.queRindeMas),
      queRindeMenos: arr(obj.insights?.queRindeMenos),
      recomendaciones: arr(obj.insights?.recomendaciones),
    },
  };
}

export async function analyzeProfile(token: string, handle: string | null) {
  const media = await listMedia(token, 120);
  if (media.length < 3) throw new AiError("La cuenta tiene muy pocos posts para analizar", 400);

  const posts = media.map((m) => ({
    fecha: m.timestamp.slice(0, 10),
    tipo: m.media_type,
    likes: m.like_count ?? null,
    comentarios: m.comments_count ?? null,
    caption: (m.caption || "").slice(0, 800),
  }));

  // Las 8 fotos con mas interaccion, para que la IA vea el estilo visual.
  const top = [...media]
    .sort((a, b) => engagement(b) - engagement(a))
    .map((m) => (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url))
    .filter((u): u is string => !!u)
    .slice(0, 8);

  const content: ContentBlock[] = [
    {
      type: "text",
      text: [
        `Analiza la cuenta de Instagram @${handle || "la tienda"} (Member Club, sneakers y streetwear premium en Pinamar, Argentina).`,
        `Estos son sus ultimos ${posts.length} posts con metricas (JSON):`,
        JSON.stringify(posts),
        "A continuacion van las fotos de los posts con mas interaccion.",
      ].join("\n\n"),
    },
    ...(await Promise.all(top.map(toImageBlock))).filter((b): b is ContentBlock => b !== null),
    {
      type: "text",
      text: `Devolve SOLO un JSON valido, sin texto extra, con esta forma:
{
  "tone": "descripcion del tono en 2 a 4 oraciones, en espanol rioplatense, como instruccion para alguien que va a escribir los captions",
  "doWords": ["expresiones, palabras o emojis que la cuenta usa seguido"],
  "dontWords": ["cosas que la cuenta NO hace o que desentonarian"],
  "examples": ["3 a 5 captions reales COPIADOS TEXTUALES de los posts que mejor representan la voz y rindieron bien"],
  "insights": {
    "resumen": "2 oraciones sobre la identidad de la cuenta",
    "estiloVisual": "como son las fotos: fondos, encuadres, si hay gente, colores",
    "hashtagsFrecuentes": ["#..."],
    "queRindeMas": ["patrones concretos de los posts con mas interaccion, con numeros si se puede"],
    "queRindeMenos": ["patrones de los que rinden menos"],
    "recomendaciones": ["3 a 5 recomendaciones concretas"]
  }
}
Basate solo en los datos. Si no hay metricas suficientes para comparar, decilo en queRindeMas.`,
    },
  ];

  const result = await callModel({
    system: "Sos un estratega de contenido de Instagram para marcas de moda. Respondes solo con JSON valido.",
    user: content,
    maxTokens: 2500,
  });

  let proposal: VoiceProposal;
  try {
    proposal = parseJson(result.text);
  } catch {
    console.error("[ai] analisis no devolvio JSON valido:", result.text.slice(0, 300));
    throw new AiError("La IA no devolvio un formato valido. Proba de nuevo.", 502);
  }

  const gen = await prisma.aiGeneration.create({
    data: {
      kind: "profile_analysis",
      input: { handle, posts: posts.length, images: top.length },
      output: result.text,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd: result.costUsd,
    },
  });

  return { generationId: gen.id, postsAnalyzed: posts.length, proposal };
}
