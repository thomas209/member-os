// "Hacelo como este": la IA mira un post de referencia que le gusto a Tommy
// y lo describe como una receta de diseno (StyleSpec). La receta NO trae
// contenido: ni fotos, ni logos, ni textos de la otra marca. Despues el
// motor (lib/social/styledPostImage) arma el post con material real.
import { prisma } from "@/lib/prisma";
import { callModel, AiError, type ContentBlock } from "./client";

export const LAYOUTS = ["hero_bottom", "center", "full_bleed", "top"] as const;
export const FONTS = ["grotesk", "serif", "mono", "condensed"] as const;
export const POSITIONS = ["top_left", "top_center", "top_right", "bottom_left", "bottom_center", "bottom_right"] as const;
export const TEXT_Y = ["top", "upper_middle", "middle", "bottom"] as const;
export const SIZES = ["s", "m", "l", "xl"] as const;
export const TAG_STYLES = ["pill", "box", "text"] as const;

export type StyleSpec = {
  descripcion: string;
  bgFrom: string; // color de arriba
  bgTo: string; // color de abajo (igual a bgFrom = fondo liso)
  gradStart: number; // % donde empieza el degradado
  gradEnd: number; // % donde termina
  photo: (typeof LAYOUTS)[number];
  photoScale: number; // 1 = entra completa, 1.8 = gigante y cortada
  photoPanel: string | null; // color de un recuadro detras de la foto (null = sin recuadro)
  textY: (typeof TEXT_Y)[number];
  align: "left" | "center";
  textColor: string;
  mutedColor: string;
  font: (typeof FONTS)[number];
  titleSize: (typeof SIZES)[number];
  upper: boolean;
  wide: boolean; // letras espaciadas
  tagStyle: (typeof TAG_STYLES)[number];
  tagBg: string;
  tagText: string;
  showSizes: boolean;
  showPrice: boolean;
  logoPosition: (typeof POSITIONS)[number];
  logoLight: boolean; // logo en blanco (para fondos oscuros)
  showBrandLogo: boolean; // logo de la marca del producto al lado del de Member
  showUrl: boolean;
};

export const DEFAULT_SPEC: StyleSpec = {
  descripcion: "Ficha limpia",
  bgFrom: "#FFFFFF", bgTo: "#FFFFFF", gradStart: 0, gradEnd: 100,
  photo: "center", photoScale: 1, photoPanel: null,
  textY: "top", align: "left", textColor: "#0A0A0A", mutedColor: "#6E6E73",
  font: "grotesk", titleSize: "m", upper: true, wide: false,
  tagStyle: "box", tagBg: "#0A0A0A", tagText: "#FFFFFF",
  showSizes: true, showPrice: true,
  logoPosition: "bottom_right", logoLight: false, showBrandLogo: true, showUrl: true,
};

const hex = (v: unknown, d: string) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim().toUpperCase() : d);
const pick = <T extends readonly string[]>(v: unknown, list: T, d: T[number]): T[number] => (list.includes(v as string) ? (v as T[number]) : d);
const num = (v: unknown, min: number, max: number, d: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);

// Limpia lo que venga (de la IA o del navegador): todo valor fuera de rango cae al default.
export function sanitizeSpec(o: Record<string, unknown> | null | undefined): StyleSpec {
  const s = o || {};
  const d = DEFAULT_SPEC;
  const bgFrom = hex(s.bgFrom, d.bgFrom);
  return {
    descripcion: String(s.descripcion || d.descripcion).slice(0, 200),
    bgFrom,
    bgTo: hex(s.bgTo, bgFrom),
    gradStart: num(s.gradStart, 0, 100, 0),
    gradEnd: num(s.gradEnd, 0, 100, 100),
    photo: pick(s.photo, LAYOUTS, d.photo),
    photoScale: num(s.photoScale, 0.6, 2, 1),
    photoPanel: s.photoPanel ? hex(s.photoPanel, "#FFFFFF") : null,
    textY: pick(s.textY, TEXT_Y, d.textY),
    align: s.align === "center" ? "center" : "left",
    textColor: hex(s.textColor, d.textColor),
    mutedColor: hex(s.mutedColor, d.mutedColor),
    font: pick(s.font, FONTS, d.font),
    titleSize: pick(s.titleSize, SIZES, d.titleSize),
    upper: bool(s.upper, d.upper),
    wide: bool(s.wide, d.wide),
    tagStyle: pick(s.tagStyle, TAG_STYLES, d.tagStyle),
    tagBg: hex(s.tagBg, d.tagBg),
    tagText: hex(s.tagText, d.tagText),
    showSizes: bool(s.showSizes, d.showSizes),
    showPrice: bool(s.showPrice, d.showPrice),
    logoPosition: pick(s.logoPosition, POSITIONS, d.logoPosition),
    logoLight: bool(s.logoLight, d.logoLight),
    showBrandLogo: bool(s.showBrandLogo, d.showBrandLogo),
    showUrl: bool(s.showUrl, d.showUrl),
  };
}

const SYSTEM = `Sos director de arte de una tienda de zapatillas y streetwear. Te muestran un post de Instagram de referencia y lo tenes que describir como una RECETA DE DISENO para recrearlo con otros productos.
Reglas:
- Describi solo el diseno (composicion, colores, tipografia, jerarquia). Nunca copies textos, logos ni marcas de la referencia.
- Las fotos de producto que se van a usar son zapatillas o prendas sobre FONDO BLANCO. Si la referencia tiene el producto "flotando" sobre blanco, el fondo debe terminar en blanco donde va la foto (asi se funde).
- Respondé SOLO un JSON valido, sin texto alrededor.`;

const FORMAT = `Campos del JSON (respeta los valores permitidos):
{
 "descripcion": "1 frase en castellano describiendo el estilo",
 "bgFrom": "#RRGGBB color de fondo arriba",
 "bgTo": "#RRGGBB color de fondo abajo (igual a bgFrom si es liso)",
 "gradStart": 0-100 (% de alto hasta donde el color de arriba es SOLIDO; ahi empieza la transicion),
 "gradEnd": 0-100 (% de alto donde ya es 100% el color de abajo),
 "photo": "hero_bottom" (producto gigante abajo, puede salirse de los bordes) | "center" (producto entero al centro) | "full_bleed" (foto ocupa todo) | "top" (producto arriba, texto abajo),
 "photoScale": 0.6-2 (1 = entra entero; 1.6+ = gigante y recortado),
 "photoPanel": "#RRGGBB" o null (recuadro detras de la foto si el fondo no es blanco y la foto no se funde),
 "textY": "top" | "upper_middle" | "middle" | "bottom",
 "align": "left" | "center",
 "textColor": "#RRGGBB", "mutedColor": "#RRGGBB (textos secundarios)",
 "font": "grotesk" (sans moderna) | "serif" | "mono" (monoespaciada: todas las letras del mismo ancho, tipo maquina de escribir/codigo) | "condensed" (sans angosta, alta y muy gruesa, tipo Anton/Impact),
 "titleSize": "s" | "m" | "l" | "xl",
 "upper": true/false (titulo en mayusculas),
 "wide": true/false (letras muy espaciadas),
 "tagStyle": "pill" (pastilla redondeada) | "box" (rectangulo) | "text" (solo texto),
 "tagBg": "#RRGGBB", "tagText": "#RRGGBB",
 "showSizes": true/false, "showPrice": true/false,
 "logoPosition": "top_left" | "top_center" | "top_right" | "bottom_left" | "bottom_center" | "bottom_right",
 "logoLight": true si el logo va en blanco (fondo oscuro donde esta el logo),
 "showBrandLogo": true si aparece el logo de la marca del producto junto al de la tienda,
 "showUrl": true/false (direccion web chiquita abajo)
}`;

export async function analyzeReference(image: ContentBlock) {
  const result = await callModel({
    system: SYSTEM,
    user: [image, { type: "text", text: "Describi el diseno de esta referencia.\n\n" + FORMAT }],
    maxTokens: 700,
  });
  let raw: Record<string, unknown> = {};
  try {
    const t = result.text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    raw = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
  } catch {
    throw new AiError("La IA no pudo leer la referencia. Proba con otra imagen.", 502);
  }
  const spec = sanitizeSpec(raw);
  await prisma.aiGeneration.create({
    data: {
      kind: "reference_style",
      input: { image: "upload" },
      output: JSON.stringify(spec),
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd: result.costUsd,
    },
  });
  return spec;
}

// La imagen llega del navegador como data URL (ya achicada).
export function dataUrlToBlock(dataUrl: string): ContentBlock {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl || "");
  if (!m) throw new AiError("Subí una imagen JPG, PNG o WEBP", 400);
  if (m[2].length > 6_000_000) throw new AiError("La imagen es muy pesada", 400);
  return { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } };
}
