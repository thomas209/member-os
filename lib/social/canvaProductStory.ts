// Historias de producto con la plantilla de Canva de Tommy (la de
// "Re-stock · Cloudmonster 3 Hyper"): arriba negro con su logo + logo de la
// marca, modelo, etiqueta y talles; abajo la foto real del producto.
// Todo sale de la base (nada inventado). Si Canva no está conectado, el
// producto no tiene logo de marca o algo falla, devuelve null y se usa el
// diseño de siempre.
import cloudinary from "@/lib/cloudinary";
import { getCanvaAccount, uploadAssetFromUrl, autofillDesign, exportPng } from "./canva";
import { getPostProduct, type PostTag } from "./postImage";

// Plantillas en el Canva de Tommy ("... Member OS · no borrar").
// Campos: foto, logo_marca, modelo, etiqueta (solo la primera), talles.
const CON_ETIQUETA = "DAHZaMdqQHg";
const SIN_ETIQUETA = "DAHZaLQ5Alo";

const isCloudinary = (u: string) => u.includes("res.cloudinary.com/") && u.includes("/upload/");
// Foto: la zapa abajo (debajo del negro y el degradé), sin recortarla.
const fotoStory = (u: string) => u.replace("/upload/", "/upload/c_pad,w_1080,h_1150,b_white/c_pad,w_1080,h_1920,g_south,b_white/f_jpg,q_90/");
// Logo de la marca en blanco, alineado a la izquierda del recuadro.
const logoBlanco = (u: string) => u.replace("/upload/", "/upload/c_pad,w_480,h_192,g_west,b_rgb:00000000/e_colorize:100,co_rgb:FFFFFF/f_png/");

export async function renderCanvaProductStory(productId: string, tag: PostTag | null, photo = 0): Promise<string | null> {
  if (!(await getCanvaAccount())) return null;
  const p = await getPostProduct(productId);
  if (!p || !p.fotos.length || !p.marcaLogo) return null;
  const foto = p.fotos[Math.min(Math.max(photo, 0), p.fotos.length - 1)];
  if (!isCloudinary(foto) || !isCloudinary(p.marcaLogo)) return null;

  const [fotoId, logoId] = await Promise.all([
    uploadAssetFromUrl(fotoStory(foto), `member-${p.id}-story`),
    uploadAssetFromUrl(logoBlanco(p.marcaLogo), `member-logo-${p.marca}`),
  ]);
  const text = (t: string) => ({ type: "text" as const, text: t.trim() || " " });
  const data: Record<string, { type: "image"; asset_id: string } | { type: "text"; text: string }> = {
    foto: { type: "image", asset_id: fotoId },
    logo_marca: { type: "image", asset_id: logoId },
    modelo: text(p.modelo),
    talles: text(p.talles.length ? "TALLES " + p.talles.join(" · ") : ""),
  };
  if (tag) data.etiqueta = text(tag === "RESTOCK" ? "RE-STOCK" : tag);

  const design = await autofillDesign(tag ? CON_ETIQUETA : SIN_ETIQUETA, `Member OS · Historia ${p.modelo}`, data);
  const urls = await exportPng(design.designId);
  const up = await cloudinary.uploader.upload(urls[0], { folder: "member-os/social", format: "jpg" });
  return up.secure_url;
}
