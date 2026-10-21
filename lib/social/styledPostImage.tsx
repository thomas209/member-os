// Motor de "hacelo como este": arma el post siguiendo una receta (StyleSpec)
// sacada de una referencia. Mismo principio que postImage: SOLO material
// real (foto de Cloudinary, logo real de Member Club y de la marca, datos
// de la base). La receta solo decide colores, tipografia y composicion.
import { ImageResponse } from "next/og";
import { getPostProduct, LOGO_URL, POST_W, POST_H, STORY_H, type PostFormat, type PostTag } from "./postImage";
import type { StyleSpec } from "@/lib/ai/referenceStyle";

function cld(url: string, t: string) {
  return url.includes("res.cloudinary.com") && url.includes("/upload/") ? url.replace("/upload/", `/upload/${t}/`) : url;
}
// El logo real, en negro o pasado a blanco (mismo archivo, color invertido).
const logo = (light: boolean, url = LOGO_URL) => cld(url, light ? "e_negate,f_png,h_200" : "f_png,h_200");

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
const FONT_SRC: Record<StyleSpec["font"], [string, number]> = {
  grotesk: ["Instrument+Sans", 600],
  serif: ["Playfair+Display", 600],
  mono: ["Space+Mono", 400],
  condensed: ["Anton", 400],
};
const TITLE_PX: Record<StyleSpec["titleSize"], number> = { s: 40, m: 56, l: 76, xl: 104 };
const TEXT_TOP: Record<StyleSpec["textY"], number> = { top: 0.1, upper_middle: 0.28, middle: 0.42, bottom: 0.72 };

export async function renderStyledPost(opts: { productId: string; spec: StyleSpec; tag?: PostTag | null; format?: PostFormat; photo?: number }) {
  const s = opts.spec;
  const story = opts.format === "story";
  const W = POST_W;
  const H = story ? STORY_H : POST_H;
  const p = await getPostProduct(opts.productId);
  if (!p) throw new Error("Producto no encontrado");
  if (!p.fotos.length) throw new Error("El producto no tiene fotos");
  const foto = p.fotos[Math.min(Math.max(opts.photo ?? 0, 0), p.fotos.length - 1)];
  const tag = opts.tag ? (opts.tag === "RESTOCK" ? "RE-STOCK" : opts.tag) : null;

  const [title, small] = await Promise.all([loadFont(...FONT_SRC[s.font]), loadFont("DM+Mono", 500)]);
  const fonts = [
    ...(title ? [{ name: "Title", data: title, weight: FONT_SRC[s.font][1] as 400 | 600, style: "normal" as const }] : []),
    ...(small ? [{ name: "Small", data: small, weight: 500 as const, style: "normal" as const }] : []),
  ];
  const TF = title ? "Title" : undefined;
  const SF = small ? "Small" : undefined;
  const center = s.align === "center";
  const titlePx = TITLE_PX[s.titleSize] * (s.wide ? 0.85 : 1);
  const PAD = 64;

  // --- Fondo: si hay degradado y texto claro arriba, el texto tiene que caer
  // sobre la parte oscura y la foto (fondo blanco) sobre la parte clara.
  const textTopPct = (s.photo === "top" ? 0.66 : TEXT_TOP[s.textY]) * 100;
  let gStart = s.gradStart;
  let gEnd = Math.max(s.gradEnd, s.gradStart);
  if (s.bgFrom !== s.bgTo && s.photo !== "top" && textTopPct < 60) {
    gStart = Math.max(gStart, textTopPct + (story ? 12 : 16));
    gEnd = Math.max(gEnd, gStart + 18);
  }

  // --- Foto ---
  let photoEl: React.ReactNode;
  if (s.photo === "full_bleed") {
    photoEl = (
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cld(foto, "f_jpg,q_90,w_1400")} width={W} height={H} style={{ objectFit: "cover" }} alt="" />
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, display: "flex", backgroundImage: `linear-gradient(180deg, ${s.bgFrom}00 35%, ${s.bgTo}CC 100%)` }} />
      </div>
    );
  } else if (s.photo === "hero_bottom") {
    // Zona de la foto: desde donde el fondo ya es del color de abajo. La foto
    // queda gigante, apoyada abajo y recortada por los bordes.
    const zoneTop = Math.round((s.bgFrom !== s.bgTo ? gEnd : Math.max(textTopPct + 22, 45)) / 100 * H);
    const size = Math.round(W * Math.max(1, story ? s.photoScale : Math.min(s.photoScale, 1.3)));
    photoEl = (
      <div style={{ position: "absolute", left: 0, top: zoneTop, width: W, height: H - zoneTop, display: "flex", overflow: "hidden", backgroundColor: s.photoPanel || "transparent" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cld(foto, "f_jpg,q_90,w_1600")} width={size} height={size}
          style={{ position: "absolute", objectFit: "contain", left: Math.round((W - size) / 2 + (s.photoScale > 1.2 ? size * 0.14 : 0)), top: Math.round((H - zoneTop) * (story ? 0.3 : 0.3) - size / 2) }} alt="" />
      </div>
    );
  } else {
    const size = Math.round(W * 0.82 * s.photoScale);
    const top = s.photo === "top" ? Math.round(H * 0.06) : Math.round((H - size) / 2 + (s.textY === "top" ? H * 0.06 : 0));
    photoEl = (
      <div style={{ position: "absolute", width: size, height: size, left: Math.round((W - size) / 2), top, display: "flex", alignItems: "center", justifyContent: "center", ...(s.photoPanel ? { backgroundColor: s.photoPanel, borderRadius: 28 } : {}) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cld(foto, "f_jpg,q_90,w_1600")} width={size} height={size} style={{ objectFit: "contain" }} alt="" />
      </div>
    );
  }

  // --- Texto ---
  const textTop = (textTopPct / 100) * H;
  const tagEl = tag && (
    <div style={{
      display: "flex", fontFamily: SF, fontSize: 34, letterSpacing: 3, padding: s.tagStyle === "text" ? 0 : "14px 64px",
      color: s.tagStyle === "text" ? s.textColor : s.tagText, backgroundColor: s.tagStyle === "text" ? "transparent" : s.tagBg,
      borderRadius: s.tagStyle === "pill" ? 14 : 0, marginTop: 30,
    }}>{tag}</div>
  );
  const priceEl = s.showPrice && (
    <div style={{ display: "flex", gap: 18, alignItems: "baseline", marginTop: 22, fontFamily: SF }}>
      {p.precioOferta ? (
        <>
          <span style={{ fontSize: 28, color: s.mutedColor, textDecoration: "line-through" }}>{p.precio}</span>
          <span style={{ fontSize: 40, color: "#DC2626" }}>{p.precioOferta}</span>
        </>
      ) : (
        <span style={{ fontSize: 38, color: s.textColor }}>{p.precio}</span>
      )}
    </div>
  );
  const textEl = (
    <div style={{ position: "absolute", left: PAD, right: PAD, top: textTop, display: "flex", flexDirection: "column", alignItems: center ? "center" : "flex-start", textAlign: center ? "center" : "left" }}>
      <div style={{ display: "flex", fontFamily: TF, fontSize: titlePx, lineHeight: 1.05, color: s.textColor, letterSpacing: s.wide ? titlePx * 0.12 : s.font === "condensed" ? 0 : -1, textTransform: s.upper ? "uppercase" : "none", justifyContent: center ? "center" : "flex-start" }}>
        {p.modelo}
      </div>
      {p.color && !p.modelo.toLowerCase().includes(p.color.toLowerCase()) && <div style={{ display: "flex", fontFamily: SF, fontSize: 22, letterSpacing: 3, color: s.mutedColor, marginTop: 12, textTransform: "uppercase" }}>{p.color}</div>}
      {tagEl}
      {priceEl}
      {s.showSizes && p.talles.length > 0 && (
        <div style={{ display: "flex", fontFamily: SF, fontSize: 28, letterSpacing: 4, color: s.mutedColor, marginTop: 30 }}>{"TALLES " + p.talles.join(" · ")}</div>
      )}
    </div>
  );

  // --- Logos (los reales) ---
  const [vert, horiz] = s.logoPosition.split("_");
  const logoEl = (
    <div style={{
      position: "absolute", display: "flex", alignItems: "center", gap: 48,
      ...(vert === "top" ? { top: story ? 150 : 56 } : { bottom: s.showUrl ? 96 : 56 }),
      ...(horiz === "left" ? { left: PAD } : horiz === "right" ? { right: PAD } : { left: 0, right: 0, justifyContent: "center" }),
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo(s.logoLight)} height={100} width={340} style={{ objectFit: "contain" }} alt="" />
      {s.showBrandLogo && p.marcaLogo && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={s.logoLight ? p.marcaLogo.replace("/upload/", "/upload/e_negate/") : p.marcaLogo} height={100} width={120} style={{ objectFit: "contain" }} alt="" />
      )}
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundImage: `linear-gradient(180deg, ${s.bgFrom} ${gStart}%, ${s.bgTo} ${gEnd}%)`, overflow: "hidden" }}>
        {photoEl}
        {textEl}
        {logoEl}
        {s.showUrl && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, display: "flex", justifyContent: "center", fontFamily: SF, fontSize: 18, letterSpacing: 3, color: s.mutedColor }}>
            MEMBERCLUBARGENTINA.COM
          </div>
        )}
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) }
  );
}
