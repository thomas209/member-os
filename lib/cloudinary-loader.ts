// Loader global de next/image.
// Las fotos ya viven en Cloudinary: le pedimos a Cloudinary el tamaño/formato
// justo (w_, f_auto, q_auto) en vez de usar la optimización de Vercel,
// que tiene cupo mensual y al agotarse devuelve 402 (imágenes rotas).
type LoaderArgs = { src: string; width: number; quality?: number };

export default function cloudinaryLoader({ src, width, quality }: LoaderArgs) {
  const marker = "/image/upload/";
  if (!src.includes("res.cloudinary.com") || !src.includes(marker)) {
    // Imágenes locales (/public) u otras: se sirven tal cual.
    return src;
  }
  const q = quality ? `q_${quality}` : "q_auto";
  const params = `f_auto,${q},c_limit,w_${width}`;
  return src.replace(marker, `${marker}${params}/`);
}
