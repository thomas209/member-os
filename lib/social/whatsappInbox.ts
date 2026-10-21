// Inbox de WhatsApp (API oficial de WhatsApp Cloud, de Meta).
// A diferencia de Instagram, WhatsApp NO deja "pedir" los mensajes: solo
// llegan por webhook (/api/social/whatsapp/webhook). Por eso en local no
// entra nada salvo que se simule o se abra un tunel; en produccion llegan
// al instante. Se guardan en las mismas tablas del inbox (platform "whatsapp").
//
// Variables (.env): WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
// WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET, WHATSAPP_GRAPH_VERSION (opcional).
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { canReply } from "./inbox";
import { InstagramError as InboxError } from "./instagram";

const VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v23.0";

export function whatsappConfigured() {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

// Firma de Meta: X-Hub-Signature-256 = sha256=HMAC(app secret, body crudo).
// Sin secreto configurado solo se acepta fuera de produccion (pruebas locales).
export function verifySignature(rawBody: string, header: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const got = header.slice(7);
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

type WaMsg = {
  from?: string; to?: string; id: string; timestamp: string; type: string;
  text?: { body: string };
  image?: { id: string; caption?: string }; video?: { id: string; caption?: string };
  document?: { id: string; filename?: string; caption?: string };
  audio?: { id: string }; sticker?: { id: string };
  location?: { latitude: number; longitude: number; name?: string };
  button?: { text: string }; interactive?: { button_reply?: { title: string }; list_reply?: { title: string } };
  reaction?: { emoji: string };
};

// Texto legible para cualquier tipo de mensaje (fotos, audios, etc. se ven en el celu).
function describe(m: WaMsg): { text: string | null; attachments?: object[] } {
  switch (m.type) {
    case "text": return { text: m.text?.body || "" };
    case "image": return { text: "[foto]" + (m.image?.caption ? " " + m.image.caption : ""), attachments: [{ type: "image", id: m.image?.id }] };
    case "video": return { text: "[video]" + (m.video?.caption ? " " + m.video.caption : ""), attachments: [{ type: "video", id: m.video?.id }] };
    case "document": return { text: "[archivo] " + (m.document?.filename || ""), attachments: [{ type: "document", id: m.document?.id }] };
    case "audio": return { text: "[audio]", attachments: [{ type: "audio", id: m.audio?.id }] };
    case "sticker": return { text: "[sticker]" };
    case "location": return { text: "[ubicación] " + (m.location?.name || `${m.location?.latitude}, ${m.location?.longitude}`) };
    case "button": return { text: m.button?.text || "[botón]" };
    case "interactive": return { text: m.interactive?.button_reply?.title || m.interactive?.list_reply?.title || "[respuesta]" };
    case "reaction": return { text: "[reacción " + (m.reaction?.emoji || "") + "]" };
    default: return { text: "[" + m.type + "]" };
  }
}

async function saveMessage(opts: { waId: string; name?: string; m: WaMsg; direction: "in" | "out"; sentBy: string }) {
  const { waId, name, m, direction, sentBy } = opts;
  if (await prisma.message.findUnique({ where: { externalId: m.id }, select: { id: true } })) return false;
  const at = new Date(Number(m.timestamp) * 1000);
  const conv = await prisma.conversation.upsert({
    where: { platform_externalId: { platform: "whatsapp", externalId: waId } },
    create: {
      platform: "whatsapp", externalId: waId, participantId: waId, participantName: name || null,
      lastMessageAt: at, lastInboundAt: direction === "in" ? at : null, unread: direction === "in",
    },
    update: {
      ...(name ? { participantName: name } : {}),
      lastMessageAt: at,
      ...(direction === "in" ? { lastInboundAt: at, unread: true } : {}),
    },
  });
  const d = describe(m);
  await prisma.message.create({
    data: { conversationId: conv.id, externalId: m.id, direction, text: d.text, attachments: d.attachments, sentBy, sentAt: at },
  });
  return true;
}

// Procesa lo que manda Meta. Mensajes de clientes + (con coexistencia) lo que
// se responde desde la app del celular, asi el panel muestra la charla entera.
export async function handleWhatsAppWebhook(body: {
  object?: string;
  entry?: { changes?: { field: string; value: Record<string, unknown> }[] }[];
}) {
  let nuevos = 0;
  if (body.object !== "whatsapp_business_account") return { nuevos };
  for (const entry of body.entry || []) {
    for (const ch of entry.changes || []) {
      const v = ch.value as {
        metadata?: { phone_number_id?: string };
        contacts?: { wa_id: string; profile?: { name?: string } }[];
        messages?: WaMsg[];
        message_echoes?: WaMsg[];
      };
      // Solo el numero configurado (por si la cuenta tiene otros).
      const mine = process.env.WHATSAPP_PHONE_NUMBER_ID;
      if (mine && v.metadata?.phone_number_id && v.metadata.phone_number_id !== mine) continue;

      if (ch.field === "messages") {
        for (const m of v.messages || []) {
          if (!m.from) continue;
          const name = v.contacts?.find((c) => c.wa_id === m.from)?.profile?.name;
          if (await saveMessage({ waId: m.from, name, m, direction: "in", sentBy: "customer" })) nuevos++;
        }
      } else if (ch.field === "smb_message_echoes") {
        for (const m of v.message_echoes || []) {
          if (m.to) await saveMessage({ waId: m.to, m, direction: "out", sentBy: "app" });
        }
      }
    }
  }
  return { nuevos };
}

// Envia texto. Igual que Instagram: solo dentro de las 24 hs del ultimo
// mensaje del cliente (afuera de eso WhatsApp exige plantillas aprobadas).
export async function sendWhatsAppReply(conversationId: string, text: string, sentBy: "tommy" | "bot" = "tommy") {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv || conv.platform !== "whatsapp") throw new InboxError("Conversación no encontrada", 404);
  if (!whatsappConfigured()) throw new InboxError("WhatsApp todavía no está conectado (faltan WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID).", 400);
  if (!canReply(conv.lastInboundAt)) {
    throw new InboxError("Pasaron más de 24 hs desde el último mensaje del cliente: WhatsApp solo deja responder desde la app (o con una plantilla aprobada).", 409);
  }
  const clean = text.trim();
  if (!clean) throw new InboxError("El mensaje está vacío", 400);
  if (clean.length > 4096) throw new InboxError("El mensaje es muy largo (máx. 4096 caracteres)", 400);

  const res = await fetch(`https://graph.facebook.com/${VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { authorization: "Bearer " + process.env.WHATSAPP_TOKEN, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: conv.participantId, type: "text", text: { body: clean, preview_url: false } }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const e = data.error || {};
    console.error("[whatsapp] send", res.status, e.code, e.message);
    throw new InboxError("WhatsApp no envió el mensaje: " + (e.error_data?.details || e.message || res.status), res.status === 401 ? 401 : 502);
  }
  const now = new Date();
  const msg = await prisma.message.create({
    data: { conversationId: conv.id, externalId: data.messages?.[0]?.id || null, direction: "out", text: clean, sentBy, sentAt: now },
  });
  await prisma.conversation.update({ where: { id: conv.id }, data: { lastMessageAt: now, unread: false } });
  return msg;
}
