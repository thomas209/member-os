// Historias con fotos y videos PROPIOS de Tommy (subidos desde el celu o la
// compu a Cloudinary). Tres modos:
//  - "raw":     tal cual (solo se adapta a 9:16)
//  - "brand":   + logo real de Member Club (en blanco) y un texto corto opcional
//  - "product": + datos reales de un producto (modelo, precio, talles)
// Fotos: la version final se arma con next/og y se sube a Cloudinary.
// Videos: se arman con transformaciones de Cloudinary (recorte 9:16, max 60 s,
// logo y texto encima), sin descargar ni reprocesar nada en nuestro server.
import { ImageResponse } from "next/og";
import cloudinary from "@/lib/cloudinary";
import { getPostProduct, LOGO_URL, POST_W, STORY_H, POST_TAGS, type PostTag } from "./postImage";

export type OwnMode = "raw" | "brand" | "product";
export const OWN_FOLDER = "member-os/social/own";
const CLOUD = () => process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";

export const isVideoUrl = (u: string) => u.includes("/video/upload/");

// public_id del logo real (para usarlo como capa en los videos).
function logoPublicId() {
  const m = /\/upload\/(?:v\d+\/)?(.+)\.(png|jpg|webp)$/.exec(LOGO_URL);
  return m ? m[1].replace(/\//g, ":") : "";
}
// Cloudinary pide doble escape de "," y "/" dentro de las capas de texto.
function cldText(t: string) {
  return encodeURIComponent(t).replace(/%2C/g, "%252C").replace(/%2F/g, "%252F");
}
const clean = (t: string | undefined, max: number) => (t || "").replace(/\s+/g, " ").trim().slice(0, max);

async function loadFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=" + family + ":wght@" + weight)).text();
    const m = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!m) return null;
    const r = await fetch(m[1]);
    return r.ok ? await r.arrayBuffer() : null;
  } catch {
    return null;
  }
}

async function productLines(productId: string, tag: PostTag | null) {
  const p = await getPostProduct(productId);
  if (!p) throw new Error("Producto no encontrado");
  return {
    tag: tag ? (tag === "RESTOCK" ? "RE-STOCK" : tag) : null,
    modelo: p.modelo,
    precio: p.precioOferta || p.precio,
    precioViejo: p.precioOferta ? p.precio : null,
    talles: p.talles.length ? "TALLES " + p.talles.join(" · ") : "",
  };
}

// ---------- VIDEO ----------
function buildVideoUrl(publicId: string, layers: string[]) {
  const t = ["c_fill,w_1080,h_1920,g_center", "eo_60", ...layers, "vc_h264,ac_aac,q_auto"];
  return `https://res.cloudinary.com/${CLOUD()}/video/upload/${t.join("/")}/${publicId}.mp4`;
}

async function videoStory(publicId: string, mode: OwnMode, text: string, productId?: string, tag?: PostTag | null) {
  if (mode === "raw") return buildVideoUrl(publicId, []);
  const layers: string[] = [];
  const logo = logoPublicId();
  if (logo) layers.push(`l_${logo}/w_320,e_negate/fl_layer_apply,g_north_west,x_64,y_150`);
  if (mode === "brand" && text) {
    layers.push(`l_text:Arial_58_bold:${cldText(text)},co_rgb:000000,b_rgb:FFFFFF,bo_26px_solid_rgb:FFFFFF/fl_layer_apply,g_south,y_320`);
  }
  if (mode === "product" && productId) {
    const p = await productLines(productId, tag || null);
    const lines = [p.tag, p.modelo.toUpperCase(), p.precio, p.talles].filter(Boolean).join("\n");
    layers.push(`l_text:Arial_52_bold_center_line_spacing_14:${cldText(lines)},co_rgb:FFFFFF,b_rgb:000000B3,bo_34px_solid_rgb:000000B3/fl_layer_apply,g_south,y_300`);
  }
  return buildVideoUrl(publicId, layers);
}

// ---------- FOTO ----------
function photoUrl(publicId: string) {
  return `https://res.cloudinary.com/${CLOUD()}/image/upload/c_fill,w_1080,h_1920,g_auto,f_jpg,q_90/${publicId}.jpg`;
}

async function photoStory(publicId: string, mode: OwnMode, text: string, productId?: string, tag?: PostTag | null) {
  const bg = photoUrl(publicId);
  if (mode === "raw") return bg;

  const p = mode === "product" && productId ? await productLines(productId, tag || null) : null;
  const [sans, mono] = await Promise.all([loadFont("Instrument+Sans", 600), loadFont("DM+Mono", 500)]);
  const fonts = [
    ...(sans ? [{ name: "Sans", data: sans, weight: 600 as const, style: "normal" as const }] : []),
    ...(mono ? [{ name: "Mono", data: mono, weight: 500 as const, style: "normal" as const }] : []),
  ];
  const SANS = sans ? "Sans" : undefined;
  const MONO = mono ? "Mono" : undefined;
  const whiteLogo = LOGO_URL.replace("/upload/", "/upload/e_negate,f_png,h_200/");

  const img = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: "#000" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg} width={POST_W} height={STORY_H} style={{ position: "absolute", left: 0, top: 0, objectFit: "cover" }} alt="" />
        {/* Sombra arriba para que el logo se lea sobre cualquier foto */}
        <div style={{ position: "absolute", left: 0, top: 0, width: POST_W, height: 520, display: "flex", backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={whiteLogo} width={320} height={94} style={{ position: "absolute", left: 64, top: 150, objectFit: "contain", objectPosition: "left" }} alt="" />

        {mode === "brand" && text && (
          <div style={{ position: "absolute", left: 64, right: 64, bottom: 300, display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", backgroundColor: "#FFFFFF", color: "#0A0A0A", fontFamily: SANS, fontSize: 52, lineHeight: 1.15, padding: "22px 40px", borderRadius: 20, textAlign: "center", maxWidth: 900 }}>{text}</div>
          </div>
        )}

        {p && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 760, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", paddingBottom: 300, backgroundImage: "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 100%)" }}>
            {p.tag && <div style={{ display: "flex", backgroundColor: "#FFFFFF", color: "#0A0A0A", fontFamily: MONO, fontSize: 30, letterSpacing: 3, padding: "10px 44px", borderRadius: 12, marginBottom: 26 }}>{p.tag}</div>}
            <div style={{ display: "flex", color: "#FFFFFF", fontFamily: SANS, fontSize: 64, textTransform: "uppercase", letterSpacing: -1, textAlign: "center", maxWidth: 940, justifyContent: "center" }}>{p.modelo}</div>
            <div style={{ display: "flex", gap: 20, alignItems: "baseline", marginTop: 14, fontFamily: SANS }}>
              {p.precioViejo && <span style={{ fontSize: 34, color: "rgba(255,255,255,0.6)", textDecoration: "line-through" }}>{p.precioViejo}</span>}
              <span style={{ fontSize: 48, color: "#FFFFFF" }}>{p.precio}</span>
            </div>
            {p.talles && <div style={{ display: "flex", color: "rgba(255,255,255,0.85)", fontFamily: MONO, fontSize: 28, letterSpacing: 4, marginTop: 20 }}>{p.talles}</div>}
          </div>
        )}
      </div>
    ),
    { width: POST_W, height: STORY_H, ...(fonts.length ? { fonts } : {}) }
  );
  const buf = Buffer.from(await img.arrayBuffer());
  const up = await cloudinary.uploader.upload("data:image/png;base64," + buf.toString("base64"), { folder: "member-os/social", format: "jpg" });
  return up.secure_url;
}

export async function buildOwnStory(opts: { kind: "image" | "video"; publicId: string; mode: OwnMode; text?: string; productId?: string; tag?: string | null }) {
  if (!opts.publicId.startsWith(OWN_FOLDER + "/")) throw new Error("Archivo inválido");
  const mode: OwnMode = ["raw", "brand", "product"].includes(opts.mode) ? opts.mode : "raw";
  if (mode === "product" && !opts.productId) throw new Error("Elegí un producto");
  const tag = opts.tag && (POST_TAGS as readonly string[]).includes(opts.tag) ? (opts.tag as PostTag) : null;
  const text = clean(opts.text, 70);
  return opts.kind === "video"
    ? videoStory(opts.publicId, mode, text, opts.productId, tag)
    : photoStory(opts.publicId, mode, text, opts.productId, tag);
}

export function ownMediaAllowed(url: string) {
  return url.startsWith(`https://res.cloudinary.com/${CLOUD()}/`);
}
