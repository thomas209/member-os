// Imagen de anuncio (horarios, feriados, avisos) SOLO con el texto que
// escribe Tommy + el logo real. Sin fotos ni textos inventados.
import { ImageResponse } from "next/og";
import { LOGO_URL, POST_W, POST_H, STORY_H, type PostFormat } from "./postImage";

export type Announcement = { titulo: string; subtitulo?: string; lineas: string[] };
export type Tema = "claro" | "oscuro";
export const LAYOUTS = ["tabla", "centrado", "bloques", "poster"] as const;
export type Layout = (typeof LAYOUTS)[number];

// Version blanca del logo para fondo negro (Cloudinary invierte los colores).
const LOGO_WHITE = LOGO_URL.replace("/upload/", "/upload/e_negate/");

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

function split(l: string): [string, string] {
  const m = l.match(/^(.*?):\s+(.*)$/);
  return m ? [m[1], m[2]] : [l, ""];
}

export function cleanAnnouncement(a: Partial<Announcement>): Announcement {
  return {
    titulo: String(a.titulo || "").trim().slice(0, 60),
    subtitulo: String(a.subtitulo || "").trim().slice(0, 80) || undefined,
    lineas: (Array.isArray(a.lineas) ? a.lineas : []).map((l) => String(l).trim().slice(0, 70)).filter(Boolean).slice(0, 12),
  };
}

export async function renderAnnouncement(a: Announcement, opts: { tema?: Tema; format?: PostFormat; layout?: Layout } = {}) {
  const layout: Layout = opts.layout && LAYOUTS.includes(opts.layout) ? opts.layout : "tabla";
  const story = opts.format === "story";
  const dark = opts.tema === "oscuro";
  const fg = dark ? "#FFFFFF" : "#0A0A0A";
  const muted = dark ? "#A3A3A3" : "#6E6E73";
  const line = dark ? "#262626" : "#E5E5E5";

  const [mono, sans] = await Promise.all([loadFont("DM+Mono", 500), loadFont("Instrument+Sans", 600)]);
  const fonts = [
    ...(mono ? [{ name: "Mono", data: mono, weight: 500 as const, style: "normal" as const }] : []),
    ...(sans ? [{ name: "Sans", data: sans, weight: 600 as const, style: "normal" as const }] : []),
  ];
  const MONO = mono ? "Mono" : undefined;
  const SANS = sans ? "Sans" : undefined;
  const big = a.lineas.length <= 5;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: dark ? "#0A0A0A" : "#FFFFFF", color: fg, padding: story ? "220px 90px 260px" : "90px 90px 70px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dark ? LOGO_WHITE : LOGO_URL} width={260} height={64} style={{ objectFit: "contain", objectPosition: "left" }} alt="" />
        {layout === "tabla" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            <div style={{ display: "flex", fontFamily: SANS, fontSize: story ? 96 : 84, fontWeight: 600, lineHeight: 1.02, letterSpacing: -3, textTransform: "uppercase" }}>{a.titulo}</div>
            {a.subtitulo && <div style={{ display: "flex", fontFamily: MONO, fontSize: 28, letterSpacing: 3, color: muted, marginTop: 20, textTransform: "uppercase" }}>{a.subtitulo}</div>}
            <div style={{ display: "flex", flexDirection: "column", marginTop: 56, borderTop: `2px solid ${fg}` }}>
              {a.lineas.map((l, i) => {
                const [k, v] = split(l);
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: big ? "26px 0" : "16px 0", borderBottom: `1px solid ${line}`, fontFamily: SANS, fontSize: big ? 40 : 32, fontWeight: 600 }}>
                    <span style={{ display: "flex", maxWidth: v ? 480 : 900 }}>{k}</span>
                    {v && <span style={{ display: "flex", fontFamily: MONO, fontWeight: 500, fontSize: big ? 34 : 28, maxWidth: 440, textAlign: "right" }}>{v}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {layout === "centrado" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            {a.subtitulo && <div style={{ display: "flex", fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: muted, marginBottom: 28, textTransform: "uppercase" }}>{a.subtitulo}</div>}
            <div style={{ display: "flex", fontFamily: SANS, fontSize: story ? 120 : 100, fontWeight: 600, lineHeight: 1, letterSpacing: -4, textTransform: "uppercase", textAlign: "center" }}>{a.titulo}</div>
            <div style={{ display: "flex", width: 120, height: 4, background: fg, margin: "56px 0" }} />
            {a.lineas.map((l, i) => {
              const [k, v] = split(l);
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30 }}>
                  {v && <span style={{ display: "flex", fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: muted, textTransform: "uppercase" }}>{k}</span>}
                  <span style={{ display: "flex", fontFamily: SANS, fontSize: big ? 46 : 36, fontWeight: 600, marginTop: 6, textAlign: "center" }}>{v || k}</span>
                </div>
              );
            })}
          </div>
        )}
        {layout === "bloques" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            <div style={{ display: "flex", fontFamily: SANS, fontSize: story ? 92 : 80, fontWeight: 600, lineHeight: 1.02, letterSpacing: -3, textTransform: "uppercase", marginBottom: a.subtitulo ? 12 : 48 }}>{a.titulo}</div>
            {a.subtitulo && <div style={{ display: "flex", fontFamily: MONO, fontSize: 26, letterSpacing: 3, color: muted, marginBottom: 48, textTransform: "uppercase" }}>{a.subtitulo}</div>}
            {a.lineas.map((l, i) => {
              const [k, v] = split(l);
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", background: dark ? "#171717" : "#F4F4F5", borderRadius: 28, padding: big ? "32px 40px" : "22px 32px", marginBottom: 18 }}>
                  {v && <span style={{ display: "flex", fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: muted, textTransform: "uppercase", marginBottom: 8 }}>{k}</span>}
                  <span style={{ display: "flex", fontFamily: SANS, fontSize: big ? 42 : 32, fontWeight: 600 }}>{v || k}</span>
                </div>
              );
            })}
          </div>
        )}
        {layout === "poster" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "flex-end", paddingBottom: 40 }}>
            <div style={{ display: "flex", fontFamily: SANS, fontSize: story ? 170 : 140, fontWeight: 600, lineHeight: 0.9, letterSpacing: -7, textTransform: "uppercase" }}>{a.titulo}</div>
            {a.subtitulo && <div style={{ display: "flex", fontFamily: MONO, fontSize: 28, letterSpacing: 3, color: muted, marginTop: 24, textTransform: "uppercase" }}>{a.subtitulo}</div>}
            <div style={{ display: "flex", flexDirection: "column", marginTop: 48 }}>
              {a.lineas.map((l, i) => (
                <span key={i} style={{ display: "flex", fontFamily: MONO, fontSize: big ? 32 : 26, letterSpacing: 1, lineHeight: 1.6 }}>{l}</span>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: muted }}>
          <span style={{ display: "flex" }}>AV. CONSTITUCIÓN 270 · PINAMAR</span>
          <span style={{ display: "flex" }}>MEMBERCLUBARGENTINA.COM</span>
        </div>
      </div>
    ),
    { width: POST_W, height: story ? STORY_H : POST_H, ...(fonts.length ? { fonts } : {}) }
  );
}
