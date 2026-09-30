// Mira las dos esquinas de arriba de una foto ya cargada y dice si el fondo
// es blanco. Se usan solo las esquinas de arriba porque el producto casi
// nunca las tapa (en cambio muchas veces llega hasta los costados o abajo).
//  - esquinas blancas               -> fondo blanco (card como siempre)
//  - esquinas grises, de color o
//    transparentes (se ven grises)  -> fondo de color (card redondeada)
export function fondoEsBlanco(img: HTMLImageElement): boolean {
  try {
    const w = 40;
    const h = 50;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return true;
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;

    const esquinaBlanca = (derecha: boolean) => {
      let blancos = 0;
      for (let dx = 0; dx < 3; dx++) {
        for (let dy = 0; dy < 3; dy++) {
          const x = derecha ? w - 1 - dx : dx;
          const i = (dy * w + x) * 4;
          const opaco = d[i + 3] >= 20;
          if (opaco && Math.min(d[i], d[i + 1], d[i + 2]) >= 250) blancos++;
        }
      }
      return blancos >= 5; // mayoria de los 9 pixeles
    };

    return esquinaBlanca(false) && esquinaBlanca(true);
  } catch {
    // Si no se puede leer la imagen, queda como antes (sin card redondeada)
    return true;
  }
}
