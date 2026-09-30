// Mira los bordes de una foto ya cargada y dice si el fondo es blanco
// (o transparente). Se usa para decidir como mostrarla en la card:
//  - fondo blanco  -> producto chico y centrado, "flotando" sobre el gris
//  - fondo de color -> la foto ocupa toda la card
export function fondoEsBlanco(img: HTMLImageElement): boolean {
  try {
    const w = 32;
    const h = 40;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return true;
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    let total = 0;
    let blancos = 0;
    const mirar = (x: number, y: number) => {
      const i = (y * w + x) * 4;
      total++;
      if (d[i + 3] < 20 || Math.min(d[i], d[i + 1], d[i + 2]) >= 250) blancos++;
    };
    for (let x = 0; x < w; x++) { mirar(x, 0); mirar(x, 1); mirar(x, h - 1); mirar(x, h - 2); }
    for (let y = 2; y < h - 2; y++) { mirar(0, y); mirar(1, y); mirar(w - 1, y); mirar(w - 2, y); }
    return blancos / total >= 0.85;
  } catch {
    // Si no se puede leer la imagen, queda como antes (centrado sobre gris)
    return true;
  }
}
