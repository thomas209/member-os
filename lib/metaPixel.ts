// Helpers del Meta Pixel para el navegador (Instagram / Facebook Ads).
// El Pixel se carga una sola vez en components/MetaPixel.tsx; aca solo se
// disparan eventos. Si el Pixel no cargo (bloqueador, sin internet), no pasa nada.

export const META_PIXEL_ID = "1743002863498197";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// eventId sirve para que Meta no cuente dos veces la misma compra cuando
// llega por el navegador y por el servidor (Conversions API).
export function trackMeta(event: string, params: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined") return;
  try {
    if (eventId) window.fbq?.("track", event, params, { eventID: eventId });
    else window.fbq?.("track", event, params);
  } catch {
    // nunca romper la compra por un evento de Meta
  }
}

// Cookies del Pixel (_fbp, _fbc) para mandarlas con el pedido y que la
// Conversions API pueda atribuir la compra al anuncio correcto.
export function metaCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === "undefined") return {};
  const get = (name: string) =>
    document.cookie
      .split("; ")
      .find((c) => c.startsWith(name + "="))
      ?.split("=")[1];
  const fbp = get("_fbp");
  let fbc = get("_fbc");
  if (!fbc) {
    try {
      const fbclid = new URLSearchParams(window.location.search).get("fbclid");
      if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
    } catch {
      // sin fbclid
    }
  }
  return { fbp, fbc };
}
