// WhatsApp automatico al confirmarse el pago de un pedido (Mercado Pago o
// transferencia confirmada), con el link de seguimiento. Como el cliente no
// escribio antes, WhatsApp exige una PLANTILLA aprobada por Meta.
//
// Plantilla (categoria "Utility", idioma es_AR), nombre en WHATSAPP_ORDER_TEMPLATE:
//   Cuerpo: ¡Hola {{1}}! 🙌 Gracias por tu compra en Member Club. Tu pedido #{{2}}
//           ya está confirmado y lo estamos preparando. Podés ver el estado
//           cuando quieras desde el botón de abajo.
//   Botón (URL dinámica): "Seguir mi pedido" -> https://www.memberclubargentina.com/seguimiento/{{1}}
//
// Solo se manda si: WhatsApp esta conectado, existe la plantilla, el cliente
// dejo telefono y no destildo "recibir el estado por WhatsApp" en el checkout.
// Si algo falla, no frena el pedido (solo se loguea).
import { prisma } from "@/lib/prisma";
import { whatsappConfigured } from "./whatsappInbox";

const VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v23.0";

// Telefono argentino -> formato WhatsApp (549 + area + numero, sin 0 ni 15).
export function waNumberAR(raw?: string | null): string | null {
  let d = (raw || "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("54")) d = d.slice(2);
  if (d.startsWith("9")) d = d.slice(1);
  if (d.startsWith("0")) d = d.slice(1);
  // "11 15 2233 4455" -> "11 2233 4455" (el 15 va despues del codigo de area)
  if (d.length === 12) {
    for (const area of [2, 3, 4]) {
      if (d.slice(area, area + 2) === "15") {
        d = d.slice(0, area) + d.slice(area + 2);
        break;
      }
    }
  }
  return d.length === 10 ? "549" + d : null;
}

type OrderForWa = {
  id: string;
  orderNumber: number;
  guestFirstName?: string | null;
  guestPhone?: string | null;
  shippingAddress?: unknown;
};

export async function sendOrderWhatsApp(order: OrderForWa) {
  const template = process.env.WHATSAPP_ORDER_TEMPLATE;
  if (!template || !whatsappConfigured()) return { sent: false, reason: "WhatsApp o plantilla sin configurar" };
  const addr = (order.shippingAddress || {}) as { phone?: string; whatsappOptIn?: boolean };
  if (addr.whatsappOptIn === false) return { sent: false, reason: "el cliente no quiso WhatsApp" };
  const to = waNumberAR(order.guestPhone || addr.phone);
  if (!to) return { sent: false, reason: "sin teléfono válido" };
  const nombre = (order.guestFirstName || "").trim().split(/\s+/)[0] || "👋";

  const res = await fetch(`https://graph.facebook.com/${VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { authorization: "Bearer " + process.env.WHATSAPP_TOKEN, "content-type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "es_AR" },
        components: [
          { type: "body", parameters: [{ type: "text", text: nombre }, { type: "text", text: String(order.orderNumber) }] },
          { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: order.id }] },
        ],
      },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const e = data.error || {};
    console.error("[whatsapp pedido]", order.orderNumber, res.status, e.code, e.message, e.error_data?.details);
    return { sent: false, reason: e.message || String(res.status) };
  }

  // Queda en el Inbox (WhatsApp) para ver la charla completa si el cliente responde.
  const now = new Date();
  const conv = await prisma.conversation.upsert({
    where: { platform_externalId: { platform: "whatsapp", externalId: to } },
    create: { platform: "whatsapp", externalId: to, participantId: to, participantName: order.guestFirstName || null, lastMessageAt: now },
    update: { lastMessageAt: now },
  });
  await prisma.message.create({
    data: {
      conversationId: conv.id,
      externalId: data.messages?.[0]?.id || null,
      direction: "out",
      text: `[Aviso automático] Pedido #${order.orderNumber} confirmado + link de seguimiento`,
      sentBy: "bot",
      sentAt: now,
    },
  });
  return { sent: true };
}
