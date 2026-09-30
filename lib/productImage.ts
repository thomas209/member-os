// Pide a Cloudinary la version "sin fondo" de una foto de producto.
// La foto original no se modifica: Cloudinary genera y guarda una copia aparte.
// Si la URL no es de Cloudinary (o ya viene transformada), se devuelve igual.
export function sinFondo(url: string | null | undefined, keepBackground = false): string | null {
  if (!url) return null;
  if (keepBackground) return url;
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) return url;
  if (url.includes("e_background_removal")) return url;
  return url.replace("/image/upload/", "/image/upload/e_background_removal/");
}
