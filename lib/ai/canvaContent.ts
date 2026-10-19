// Arma el post con una plantilla de Canva SIN inventar nada:
//  - Canva pone el diseno (la plantilla la hace/aprueba Tommy, con su logo real).
//  - La foto es la del producto en Cloudinary.
//  - Los textos de la placa salen DIRECTO de la base (no los escribe la IA).
//  - La IA solo escribe el caption (con los mismos datos reales).
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { AiError } from "./client";
import { suggestCaption } from "./caption";
import { uploadAssetFromUrl, autofillDesign, exportPng, type CanvaDataset } from "@/lib/social/canva";
import { getPostProduct, POST_TAGS, type PostTag } from "@/lib/social/postImage";

// Nombres de campo que entiende Member OS (Data autofill en Canva).
// Cualquier otro nombre se rechaza al agregar la plantilla, para que nunca
// quede un texto de ejemplo inventado en la imagen final.
export const TEXT_FIELDS: Record<string, string> = {
  modelo: "Nombre del producto",
  marca: "Marca",
  color: "Color",
  precio: "Precio (el de oferta si hay)",
  precio_anterior: "Precio sin descuento (vacio si no hay oferta)",
  descuento: "% OFF (vacio si no hay oferta)",
  talles: "Talles con stock",
  etiqueta: "Etiqueta elegida (NEW IN, RESTOCK...)",
  web: "memberclubargentina.com",
};
export const IMAGE_FIELDS: Record<string, string> = {
  foto: "Foto del producto",
  foto2: "Segunda foto del producto",
  foto3: "Tercera foto del producto",
  logo_marca: "Logo de la marca (si esta cargado)",
};

export function validateDataset(ds: CanvaDataset): string | null {
  const bad = Object.entries(ds).filter(([k, v]) =>
    v.type === "text" ? !(k.toLowerCase() in TEXT_FIELDS) : v.type === "image" ? !(k.toLowerCase() in IMAGE_FIELDS) : true
  );
  if (!bad.length) return null;
  return (
    "Estos campos no los reconoce Member OS: " +
    bad.map(([k, v]) => `${k} (${v.type})`).join(", ") +
    ". Usá: textos → " + Object.keys(TEXT_FIELDS).join(", ") + "; imágenes → " + Object.keys(IMAGE_FIELDS).join(", ") + "."
  );
}

function jpg(url: string) {
  return url.includes("/upload/") ? url.replace("/upload/", "/upload/f_jpg,q_90,w_1500/") : url;
}
const toNumber = (s: string) => Number(s.replace(/[^\d]/g, ""));

export type CanvaSlide = { productId: string; photo?: number; tag?: string | null };

export async function generateCanvaPost(opts: { slides: CanvaSlide[]; templateId: string; note?: string; withCaption?: boolean }) {
  const template = await prisma.socialTemplate.findUnique({ where: { id: opts.templateId } });
  if (!template) throw new AiError("No encontré la plantilla", 404);
  const dataset = template.dataset as CanvaDataset;
  const invalid = validateDataset(dataset);
  if (invalid) throw new AiError(invalid, 400);
  if (!opts.slides.length) throw new AiError("Elegí al menos un producto", 400);

  const images: string[] = [];
  const editUrls: string[] = [];

  for (const s of opts.slides) {
    const p = await getPostProduct(s.productId);
    if (!p) throw new AiError("Producto no encontrado", 404);
    if (!p.fotos.length) throw new AiError(`${p.modelo} no tiene fotos`, 400);
    const tag = s.tag && (POST_TAGS as readonly string[]).includes(s.tag) ? (s.tag as PostTag) : "";
    const start = Math.min(Math.max(s.photo ?? 0, 0), p.fotos.length - 1);

    const off =
      p.precioOferta ? Math.round((1 - toNumber(p.precioOferta) / toNumber(p.precio)) * 100) : 0;
    const texts: Record<string, string> = {
      modelo: p.modelo,
      marca: p.marca,
      color: p.color || "",
      precio: p.precioOferta || p.precio,
      precio_anterior: p.precioOferta ? p.precio : "",
      descuento: off > 0 ? `${off}% OFF` : "",
      talles: p.talles.length ? "TALLES " + p.talles.join(" · ") : "",
      etiqueta: tag,
      web: "memberclubargentina.com",
    };

    const data: Record<string, { type: "image"; asset_id: string } | { type: "text"; text: string }> = {};
    for (const [field, def] of Object.entries(dataset)) {
      const key = field.toLowerCase();
      if (def.type === "text") {
        // Canva no acepta texto vacio: un espacio deja el campo en blanco.
        data[field] = { type: "text", text: texts[key] || " " };
      } else if (def.type === "image") {
        let url: string | null = null;
        if (key === "logo_marca") url = p.marcaLogo;
        else {
          const n = key === "foto" ? 0 : Number(key.replace("foto", "")) - 1;
          url = p.fotos[(start + n) % p.fotos.length];
        }
        if (url) data[field] = { type: "image", asset_id: await uploadAssetFromUrl(jpg(url), `member-${p.id}-${key}`) };
      }
    }

    const design = await autofillDesign(template.canvaDesignId, `Post ${p.modelo}`, data);
    const exported = await exportPng(design.designId);
    const up = await cloudinary.uploader.upload(exported[0], { folder: "member-os/social", format: "jpg" });
    images.push(up.secure_url);
    if (design.editUrl) editUrls.push(design.editUrl);
  }

  // El caption lo escribe la IA, solo con datos reales.
  const caption =
    opts.withCaption === false ? null : await suggestCaption(opts.slides.map((s) => s.productId), opts.note);

  return {
    images,
    editUrls,
    caption: caption?.text ?? null,
    generationId: caption?.generationId ?? null,
  };
}
