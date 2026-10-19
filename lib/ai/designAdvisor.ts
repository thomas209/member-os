// Recomienda COMO armar un post mirando lo que ya funciono en el Instagram.
// Solo elige entre opciones reales: plantillas cargadas (o el diseno propio
// de Member OS), fotos que ya tiene el producto en Cloudinary y etiquetas
// fijas. No genera imagenes ni textos de placa.
import { prisma } from "@/lib/prisma";
import { callModel, AiError, type ContentBlock } from "./client";
import { listMedia } from "@/lib/social/instagram";
import { toImageBlock, engagement } from "./profileAnalysis";
import { getBrandVoice } from "./brandVoice";
import { getPostProduct, POST_TAGS } from "@/lib/social/postImage";

const small = (url: string) =>
  url.includes("/upload/") ? url.replace("/upload/", "/upload/f_jpg,q_70,w_500/") : url;

export type DesignAdvice = {
  templateId: string | null; // null = diseno propio de Member OS
  slides: { productId: string; photo: number; tag: string | null }[];
  reason: string;
  references: { permalink: string; why: string }[];
};

export async function recommendDesign(productIds: string[], igToken: string | null): Promise<DesignAdvice> {
  if (!productIds.length) throw new AiError("Elegí al menos un producto", 400);

  const templates = await prisma.socialTemplate.findMany({ where: { isActive: true }, select: { id: true, name: true, dataset: true } });
  const products = (await Promise.all(productIds.map(getPostProduct))).filter((p): p is NonNullable<typeof p> => !!p);
  if (!products.length) throw new AiError("No encontré esos productos", 404);
  const voice = await getBrandVoice();

  const content: ContentBlock[] = [];

  // 1. Posts que mejor rindieron (contexto real de la cuenta).
  let refs: { n: number; permalink: string; likes: number | null; comentarios: number | null; caption: string }[] = [];
  if (igToken) {
    try {
      const media = await listMedia(igToken, 60);
      const top = [...media].sort((a, b) => engagement(b) - engagement(a)).slice(0, 6);
      content.push({ type: "text", text: "POSTS DE LA CUENTA QUE MEJOR FUNCIONARON (referencias):" });
      for (let i = 0; i < top.length; i++) {
        const m = top[i];
        const img = await toImageBlock((m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) || "");
        refs.push({ n: i + 1, permalink: m.permalink || "", likes: m.like_count ?? null, comentarios: m.comments_count ?? null, caption: (m.caption || "").slice(0, 200) });
        content.push({ type: "text", text: `Referencia ${i + 1}: ${JSON.stringify(refs[i])}` });
        if (img) content.push(img);
      }
    } catch (e) {
      console.error("[ai] no pude leer Instagram para recomendar", e);
    }
  }

  // 2. Fotos reales de cada producto (numeradas desde 0).
  content.push({ type: "text", text: "PRODUCTOS DEL POST Y SUS FOTOS DISPONIBLES:" });
  for (const p of products) {
    content.push({
      type: "text",
      text: JSON.stringify({ productId: p.id, modelo: p.modelo, marca: p.marca, precio: p.precio, oferta: p.precioOferta, talles: p.talles, cantidadFotos: p.fotos.length }),
    });
    for (let i = 0; i < Math.min(p.fotos.length, 5); i++) {
      content.push({ type: "text", text: `${p.modelo} - foto ${i}` });
      const img = await toImageBlock(small(p.fotos[i]));
      if (img) content.push(img);
    }
  }

  const ins = voice?.insights as { estiloVisual?: string; queRindeMas?: string[]; queRindeMenos?: string[] } | null;
  content.push({
    type: "text",
    text: [
      ins ? "Análisis previo de la cuenta: " + JSON.stringify(ins) : "",
      "OPCIONES DE DISEÑO DISPONIBLES (elegí una):",
      JSON.stringify([
        { templateId: null, nombre: "Diseño propio de Member OS: ficha de producto, fondo blanco, modelo arriba, producto al centro, marca y logo abajo" },
        ...templates.map((t) => ({ templateId: t.id, nombre: "Plantilla de Canva: " + t.name, campos: Object.keys(t.dataset as object) })),
      ]),
      `Etiquetas permitidas: ${JSON.stringify(POST_TAGS)} o null. SALE solo si el producto tiene oferta.`,
      "Recomendá cómo armar el post para que rinda como los mejores de la cuenta: qué diseño, qué foto de cada producto (la que mejor se vea en ese diseño) y qué etiqueta. Basate en lo que muestran las referencias.",
      'Respondé SOLO JSON válido: {"templateId": string|null, "slides": [{"productId": "...", "photo": número, "tag": string|null}], "reason": "2-3 oraciones en español rioplatense explicando la elección, citando referencias por número", "references": [{"n": número, "why": "qué tomar de ese post"}]}',
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

  const result = await callModel({
    system: "Sos director de arte de una tienda de sneakers y streetwear. Elegís solo entre las opciones que te dan. Respondés solo JSON válido.",
    user: content,
    maxTokens: 1000,
  });

  await prisma.aiGeneration.create({
    data: {
      kind: "design_advice",
      input: { productIds, refs: refs.length },
      output: result.text,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd: result.costUsd,
    },
  });

  let raw: { templateId?: string | null; slides?: { productId: string; photo: number; tag: string | null }[]; reason?: string; references?: { n: number; why: string }[] };
  try {
    const t = result.text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    raw = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
  } catch {
    throw new AiError("La IA no devolvió un formato válido. Probá de nuevo.", 502);
  }

  // Validar contra opciones reales: nada fuera de lo disponible.
  const templateId = raw.templateId && templates.some((t) => t.id === raw.templateId) ? raw.templateId : null;
  const slides = products.map((p) => {
    const s = raw.slides?.find((x) => x.productId === p.id);
    const photo = Math.min(Math.max(Number(s?.photo) || 0, 0), Math.max(p.fotos.length - 1, 0));
    let tag = s?.tag && (POST_TAGS as readonly string[]).includes(s.tag) ? s.tag : null;
    if (tag === "SALE" && !p.precioOferta) tag = null;
    return { productId: p.id, photo, tag };
  });
  const references = (raw.references || [])
    .map((r) => ({ permalink: refs.find((x) => x.n === Number(r.n))?.permalink || "", why: String(r.why || "") }))
    .filter((r) => r.permalink);

  return { templateId, slides, reason: String(raw.reason || ""), references };
}
