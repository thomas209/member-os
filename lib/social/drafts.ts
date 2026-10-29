// Arma un borrador completo en un clic (imagenes reales + texto) a partir
// de una sugerencia. Queda como "draft": no se publica sin el OK.
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { renderPostImage, type PostTag, type PostFormat } from "./postImage";
import { renderAnnouncement } from "./announcementImage";
import { announcementPresets } from "@/lib/storeInfo";
import { renderBrandStory } from "./brandAnnouncement";
import { suggestCaption } from "@/lib/ai/caption";
import { getInstagramAccount } from "./instagram";
import { AiError } from "@/lib/ai/client";

async function upload(img: Response) {
  const buf = Buffer.from(await img.arrayBuffer());
  const up = await cloudinary.uploader.upload("data:image/png;base64," + buf.toString("base64"), { folder: "member-os/social", format: "jpg" });
  return up.secure_url;
}

const NOTES: Record<string, string> = {
  "NEW IN": "Es un post de nuevos ingresos: presentalos como recién llegados.",
  RESTOCK: "Volvieron a tener stock: avisá que volvieron.",
  SALE: "Están con precio rebajado: mencioná el precio de oferta que figura en los datos.",
  "ULTIMOS TALLES": "Quedan pocos talles: generá urgencia sin exagerar.",
};

// scheduledAt opcional: queda como PROPUESTA para ese momento (sigue siendo
// borrador; recien sale cuando Tommy la aprueba).
export async function createDraft(opts: { productIds?: string[]; tag?: PostTag | null; format?: PostFormat; presetId?: string; scheduledAt?: Date | null }) {
  const account = await getInstagramAccount();
  if (!account) throw new AiError("Conectá Instagram primero", 400);
  const format: PostFormat = opts.format === "story" ? "story" : "post";

  let mediaUrls: string[] = [];
  let caption = "";
  let productIds: string[] = [];

  if (opts.presetId) {
    const preset = announcementPresets().find((p) => p.id === opts.presetId);
    if (!preset) throw new AiError("Anuncio no encontrado", 404);
    // Historias: con la plantilla de Canva de Tommy (si Canva está conectado).
    let canvaUrl: string | null = null;
    if (format === "story") {
      try { canvaUrl = await renderBrandStory(preset); } catch (e) { console.error("[social] plantilla Canva", e); }
    }
    mediaUrls = [canvaUrl || (await upload(await renderAnnouncement(preset, { format, tema: "claro", layout: "tabla" })))];
    if (format === "post") caption = [preset.titulo, ...(preset.subtitulo ? [preset.subtitulo] : []), ...preset.lineas].join("\n");
  } else {
    productIds = (opts.productIds || []).slice(0, format === "story" ? 5 : 10);
    if (!productIds.length) throw new AiError("Elegí al menos un producto", 400);
    for (const id of productIds) mediaUrls.push(await upload(await renderPostImage({ productId: id, tag: opts.tag || null, format })));
    if (format === "post") caption = (await suggestCaption(productIds, opts.tag ? NOTES[opts.tag] : undefined)).text;
  }

  return prisma.scheduledPost.create({
    data: {
      accountId: account.id,
      productIds,
      caption,
      mediaUrls,
      mediaType: format === "story" ? "story" : mediaUrls.length > 1 ? "carousel" : "image",
      scheduledAt: opts.scheduledAt ?? null,
    },
  });
}

// Publica lo agendado que ya vencio (de a uno, para no saturar Instagram).
export async function publishDue(max = 3) {
  const { publishPost } = await import("./publish");
  const due = await prisma.scheduledPost.findMany({
    where: { status: "approved", scheduledAt: { lte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: max,
    select: { id: true },
  });
  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const p of due) {
    try {
      await publishPost(p.id);
      results.push({ id: p.id, ok: true });
    } catch (e) {
      results.push({ id: p.id, ok: false, error: e instanceof Error ? e.message : "Error" });
    }
  }
  return results;
}
