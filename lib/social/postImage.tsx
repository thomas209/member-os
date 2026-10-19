// Arma la imagen de un post de Instagram SOLO con material real:
// la foto del producto que ya esta en Cloudinary, el logo de Member Club
// (el mismo que usa la tienda) y los datos de la base (modelo, marca,
// precio, talles con stock). No hay nada generado por IA en la imagen.
// Estilo: la "ficha de producto" del feed de @member_ba (fondo blanco,
// modelo arriba, producto al centro, marca + logo abajo).
import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const LOGO_URL = "https://res.cloudinary.com/dklvmlzds/image/upload/v1783912898/MEMBER_B_1_3_wyfasx.png";
export const POST_W = 1080;
export const POST_H = 1350; // 4:5, el formato vertical de Instagram
export const STORY_H = 1920; // 9:16, historias
export type PostFormat = "post" | "story";

// Etiquetas fijas que se pueden elegir (no las inventa la IA).
export const POST_TAGS = ["NEW IN", "RESTOCK", "ULTIMOS TALLES", "SALE"] as const;
export type PostTag = (typeof POST_TAGS)[number];

// Satori no lee webp: Cloudinary entrega la foto en jpg.
function jpg(url: string, w = 1000) {
  return url.includes("res.cloudinary.com") && url.includes("/upload/")
    ? url.replace("/upload/", `/upload/f_jpg,q_90,w_${w}/`)
    : url;
}
function png(url: string) {
  return url.includes("res.cloudinary.com") && url.includes("/upload/")
    ? url.replace("/upload/", "/upload/f_png,h_160/")
    : null;
}
const money = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

async function loadFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=" + family + ":wght@" + weight)).text();
    const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function getPostProduct(productId: string) {
  const p = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: {
      id: true,
      name: true,
      colorName: true,
      price: true,
      salePrice: true,
      saleEndsAt: true,
      brand: { select: { name: true, logoUrl: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], select: { url: true } },
      variants: { where: { stock: { gt: 0 } }, orderBy: { sortOrder: "asc" }, select: { size: true } },
    },
  });
  if (!p) return null;
  const saleActive = p.salePrice != null && (!p.saleEndsAt || p.saleEndsAt > new Date());
  return {
    id: p.id,
    modelo: p.name,
    color: p.colorName,
    marca: p.brand.name,
    marcaLogo: p.brand.logoUrl ? png(p.brand.logoUrl) : null,
    precio: money(Number(p.price)),
    precioOferta: saleActive ? money(Number(p.salePrice)) : null,
    talles: p.variants.map((v) => v.size),
    fotos: p.images.map((i) => i.url),
  };
}

export async function renderPostImage(opts: { productId: string; photo?: number; tag?: PostTag | null; format?: PostFormat }) {
  const story = opts.format === "story";
  const p = await getPostProduct(opts.productId);
  if (!p) throw new Error("Producto no encontrado");
  if (!p.fotos.length) throw new Error("El producto no tiene fotos");
  const foto = p.fotos[Math.min(Math.max(opts.photo ?? 0, 0), p.fotos.length - 1)];
  const tag = opts.tag && POST_TAGS.includes(opts.tag) ? opts.tag : null;

  const [mono, sans] = await Promise.all([loadFont("DM+Mono", 500), loadFont("Instrument+Sans", 600)]);
  const fonts = [
    ...(mono ? [{ name: "Mono", data: mono, weight: 500 as const, style: "normal" as const }] : []),
    ...(sans ? [{ name: "Sans", data: sans, weight: 600 as const, style: "normal" as const }] : []),
  ];
  const MONO = mono ? "Mono" : undefined;
  const SANS = sans ? "Sans" : undefined;
  const red = "#DC2626";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#FFFFFF", color: "#0A0A0A", padding: story ? "200px 72px 260px" : "72px 72px 56px" }}>
        {/* Modelo + precio */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
            {tag && (
              <div style={{ display: "flex", alignSelf: "flex-start", backgroundColor: tag === "SALE" ? red : "#0A0A0A", color: "white", fontFamily: MONO, fontSize: 22, letterSpacing: 3, padding: "8px 16px", marginBottom: 20 }}>
                {tag}
              </div>
            )}
            <div style={{ display: "flex", fontFamily: SANS, fontSize: 52, fontWeight: 600, lineHeight: 1.05, letterSpacing: -1, textTransform: "uppercase" }}>{p.modelo}</div>
            {p.color && <div style={{ display: "flex", fontFamily: MONO, fontSize: 22, letterSpacing: 2, color: "#6E6E73", marginTop: 10, textTransform: "uppercase" }}>{p.color}</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            {p.precioOferta ? (
              <>
                <div style={{ display: "flex", fontFamily: MONO, fontSize: 24, color: "#9CA3AF", textDecoration: "line-through" }}>{p.precio}</div>
                <div style={{ display: "flex", fontFamily: SANS, fontSize: 40, fontWeight: 600, color: red }}>{p.precioOferta}</div>
              </>
            ) : (
              <div style={{ display: "flex", fontFamily: SANS, fontSize: 36, fontWeight: 600 }}>{p.precio}</div>
            )}
          </div>
        </div>

        {/* Producto */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", margin: "24px 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={jpg(foto)} width={900} height={story ? 1000 : 860} style={{ objectFit: "contain" }} alt="" />
        </div>

        {/* Talles */}
        {p.talles.length > 0 && (
          <div style={{ display: "flex", fontFamily: MONO, fontSize: 22, letterSpacing: 2, color: "#3F3F46", marginBottom: 24 }}>
            {"TALLES " + p.talles.join(" · ")}
          </div>
        )}

        {/* Marca + logo Member */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E5E5E5", paddingTop: 28 }}>
          {p.marcaLogo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={p.marcaLogo} height={56} style={{ objectFit: "contain", maxWidth: 260 }} alt="" />
          ) : (
            <div style={{ display: "flex", fontFamily: SANS, fontSize: 30, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>{p.marca}</div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} width={210} height={52} style={{ objectFit: "contain", objectPosition: "right" }} alt="" />
        </div>
        <div style={{ display: "flex", justifyContent: "center", fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: "#9CA3AF", marginTop: 18 }}>
          MEMBERCLUBARGENTINA.COM · PINAMAR
        </div>
      </div>
    ),
    { width: POST_W, height: story ? STORY_H : POST_H, ...(fonts.length ? { fonts } : {}) }
  );
}
