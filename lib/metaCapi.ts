// Conversions API de Meta: avisa la compra desde el servidor cuando el pago
// queda confirmado (webhook de Mercado Pago o transferencia confirmada en el
// panel). Asi Meta cuenta las ventas aunque el navegador tenga bloqueadores
// o sea un iPhone. Usa el mismo event_id que el navegador para no duplicar.
//
// Variables (Vercel):
//   META_CAPI_TOKEN        -> Administrador de eventos > Pixel > Configuracion > Generar token de acceso
//   META_TEST_EVENT_CODE   -> opcional, solo para probar (pestana "Probar eventos")
// Sin META_CAPI_TOKEN no hace nada.
import crypto from "crypto";
import { META_PIXEL_ID } from "@/lib/metaPixel";
import { waNumberAR } from "@/lib/social/whatsappOrder";

const VERSION = process.env.META_GRAPH_VERSION || "v23.0";
const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com";

const sha = (v: string) => crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

type OrderForMeta = {
  id: string;
  orderNumber: number;
  total: unknown;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestFirstName?: string | null;
  guestLastName?: string | null;
  customerId?: string | null;
  shippingAddress?: unknown;
  items: { productId: string; quantity: number; unitPrice: unknown }[];
};

export async function sendMetaPurchase(order: OrderForMeta) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return { sent: false, reason: "META_CAPI_TOKEN sin configurar" };

  const addr = (order.shippingAddress || {}) as {
    city?: string;
    postalCode?: string;
    _meta?: { fbp?: string; fbc?: string; ip?: string; ua?: string };
  };
  const m = addr._meta || {};
  const phone = waNumberAR(order.guestPhone);

  const user_data: Record<string, unknown> = {
    country: [sha("ar")],
  };
  if (order.guestEmail) user_data.em = [sha(order.guestEmail)];
  if (phone) user_data.ph = [sha(phone)];
  if (order.guestFirstName) user_data.fn = [sha(order.guestFirstName)];
  if (order.guestLastName) user_data.ln = [sha(order.guestLastName)];
  if (addr.city) user_data.ct = [sha(addr.city.replace(/\s+/g, ""))];
  if (addr.postalCode) user_data.zp = [sha(addr.postalCode)];
  if (order.customerId) user_data.external_id = [sha(order.customerId)];
  if (m.fbp) user_data.fbp = m.fbp;
  if (m.fbc) user_data.fbc = m.fbc;
  if (m.ip) user_data.client_ip_address = m.ip;
  if (m.ua) user_data.client_user_agent = m.ua;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `purchase-${order.id}`,
        action_source: "website",
        event_source_url: `${SITE_URL}/checkout/success`,
        user_data,
        custom_data: {
          currency: "ARS",
          value: Number(order.total),
          order_id: String(order.orderNumber),
          content_type: "product",
          content_ids: order.items.map((i) => i.productId),
          contents: order.items.map((i) => ({ id: i.productId, quantity: i.quantity, item_price: Number(i.unitPrice) })),
          num_items: order.items.reduce((s, i) => s + i.quantity, 0),
        },
      },
    ],
  };
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;

  const res = await fetch(`https://graph.facebook.com/${VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("Meta CAPI error:", res.status, await res.text().catch(() => ""));
    return { sent: false, reason: "error de Meta" };
  }
  return { sent: true };
}
