// Historias de marca (envíos, horarios, ubicación) con las plantillas de
// Canva de Tommy: su mismo fondo, letras y logo. El sistema solo completa
// los textos con los datos reales de lib/storeInfo.ts (Data autofill) y
// exporta la imagen. Si Canva no está conectado o falla, se usa el diseño
// simple de siempre (announcementImage).
import cloudinary from "@/lib/cloudinary";
import { getCanvaAccount, autofillDesign, exportPng } from "./canva";
import type { AnnouncementPreset } from "@/lib/storeInfo";

// Plantillas en el Canva de Tommy ("... Member OS · no borrar").
// Campos: titulo, subtitulo, bloque1-3, detalle1-3, nota.
const TEMPLATES = {
  envios: "DAHZZ4IyCvk", // con los containers
  general: "DAHZZ38yNHA", // horarios y ubicación
};

const up = (t: string | undefined) => (t || "").toUpperCase();

export async function renderBrandStory(preset: AnnouncementPreset): Promise<string | null> {
  if (!preset.bloques?.length) return null;
  if (!(await getCanvaAccount())) return null;
  const text = (t: string) => ({ type: "text" as const, text: t.trim() || " " });
  const b = preset.bloques.slice(0, 3);
  const data: Record<string, { type: "text"; text: string }> = {
    titulo: text((preset.corto || preset.titulo).toLowerCase()),
    subtitulo: text(up(preset.subtitulo)),
    nota: text(up(preset.nota)),
  };
  for (let i = 0; i < 3; i++) {
    data[`bloque${i + 1}`] = text(up(b[i]?.titulo));
    data[`detalle${i + 1}`] = text(up(b[i]?.detalle));
  }
  const template = preset.id === "envios" ? TEMPLATES.envios : TEMPLATES.general;
  const design = await autofillDesign(template, `Member OS · ${preset.nombre} · ${new Date().toLocaleDateString("es-AR")}`, data);
  const urls = await exportPng(design.designId);
  const res = await cloudinary.uploader.upload(urls[0], { folder: "member-os/social", format: "jpg" });
  return res.secure_url;
}
