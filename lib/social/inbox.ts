// Inbox de Instagram: trae las conversaciones por la API oficial y envia
// respuestas. En local se sincroniza a pedido (sin webhook); en produccion
// se sumara el webhook para recibir al instante.
import { prisma } from "@/lib/prisma";
import { getActiveToken, InstagramError, markReauth } from "./instagram";

const GRAPH = "https://graph.instagram.com";
export const WINDOW_MS = 24 * 60 * 60 * 1000;

type IgMsg = {
  id: string;
  created_time: string;
  from?: { id: string; username?: string };
  to?: { data: { id: string; username?: string }[] };
  message?: string;
  attachments?: { data: unknown[] };
};
type IgConv = {
  id: string;
  updated_time: string;
  participants?: { data: { id: string; username?: string }[] };
  messages?: { data: IgMsg[] };
};

async function get<T>(path: string, token: string, params: Record<string, string>): Promise<T> {
  const u = new URL(GRAPH + path);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set("access_token", token);
  const res = await fetch(u, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const e = data.error || {};
    console.error("[inbox]", path, res.status, e.code, e.message);
    throw new InstagramError("Instagram: " + (e.message || res.status), e.code === 190 ? 401 : 502, e.code === 190);
  }
  return data as T;
}

// Trae las ultimas conversaciones y sus ultimos mensajes (Instagram solo
// deja leer los 20 mas recientes de cada una).
export async function syncInstagram(limit = 25) {
  const { account, token } = await getActiveToken();
  const me = (account.handle || "").toLowerCase();
  try {
    const convs = await get<{ data: IgConv[] }>("/me/conversations", token, {
      platform: "instagram",
      fields: "id,updated_time,participants,messages.limit(20){id,created_time,from,to,message,attachments}",
      limit: String(limit),
    });

    let nuevos = 0;
    for (const c of convs.data) {
      const other = (c.participants?.data || []).find((p) => (p.username || "").toLowerCase() !== me);
      if (!other) continue;
      const msgs = (c.messages?.data || []).filter((m) => m.id);
      const inbound = msgs.filter((m) => (m.from?.username || "").toLowerCase() !== me);
      const lastInbound = inbound.length ? new Date(Math.max(...inbound.map((m) => +new Date(m.created_time)))) : null;

      const conv = await prisma.conversation.upsert({
        where: { platform_externalId: { platform: "instagram", externalId: c.id } },
        create: {
          platform: "instagram",
          externalId: c.id,
          participantId: other.id,
          participantName: other.username || null,
          lastMessageAt: new Date(c.updated_time),
          lastInboundAt: lastInbound,
        },
        update: {
          participantName: other.username || undefined,
          lastMessageAt: new Date(c.updated_time),
          ...(lastInbound ? { lastInboundAt: lastInbound } : {}),
        },
      });

      for (const m of msgs) {
        const exists = await prisma.message.findUnique({ where: { externalId: m.id }, select: { id: true } });
        if (exists) continue;
        const isIn = (m.from?.username || "").toLowerCase() !== me;
        await prisma.message.create({
          data: {
            conversationId: conv.id,
            externalId: m.id,
            direction: isIn ? "in" : "out",
            text: m.message || null,
            attachments: m.attachments?.data?.length ? (m.attachments.data as object[]) : undefined,
            sentBy: isIn ? "customer" : "app",
            sentAt: new Date(m.created_time),
          },
        });
        if (isIn) nuevos++;
      }
      if (inbound.length) {
        const lastMsg = msgs.sort((a, b) => +new Date(b.created_time) - +new Date(a.created_time))[0];
        const lastIsIn = (lastMsg?.from?.username || "").toLowerCase() !== me;
        if (lastIsIn) await prisma.conversation.update({ where: { id: conv.id }, data: { unread: true } });
      }
    }
    return { conversaciones: convs.data.length, nuevos };
  } catch (e) {
    if (e instanceof InstagramError && e.tokenInvalid) await markReauth(account.id);
    throw e;
  }
}

export function canReply(lastInboundAt: Date | null) {
  return !!lastInboundAt && Date.now() - +lastInboundAt < WINDOW_MS;
}

// Envia un texto al cliente. Solo dentro de las 24 hs del ultimo mensaje suyo.
export async function sendInstagramReply(conversationId: string, text: string, sentBy: "tommy" | "bot" = "tommy") {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv || conv.platform !== "instagram") throw new InstagramError("Conversación no encontrada", 404);
  if (!canReply(conv.lastInboundAt)) {
    throw new InstagramError("Pasaron más de 24 hs desde el último mensaje del cliente: Instagram no deja responder desde afuera de la app.", 409);
  }
  const clean = text.trim();
  if (!clean) throw new InstagramError("El mensaje está vacío", 400);
  if (Buffer.byteLength(clean, "utf8") > 1000) throw new InstagramError("El mensaje es muy largo (máx. 1000 bytes)", 400);

  const { account, token } = await getActiveToken();
  const res = await fetch(GRAPH + "/me/messages", {
    method: "POST",
    headers: { authorization: "Bearer " + token, "content-type": "application/json" },
    body: JSON.stringify({ recipient: { id: conv.participantId }, message: { text: clean } }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const e = data.error || {};
    console.error("[inbox] send", res.status, e.code, e.message);
    if (e.code === 190) await markReauth(account.id);
    throw new InstagramError("Instagram no envió el mensaje: " + (e.message || res.status), e.code === 190 ? 401 : 502);
  }
  const now = new Date();
  const msg = await prisma.message.create({
    data: { conversationId: conv.id, externalId: data.message_id || null, direction: "out", text: clean, sentBy, sentAt: now },
  });
  await prisma.conversation.update({ where: { id: conv.id }, data: { lastMessageAt: now, unread: false } });
  return msg;
}

// Manda una imagen (por URL publica, ej. Cloudinary) dentro de la ventana de 24 hs.
export async function sendInstagramImage(conversationId: string, imageUrl: string, sentBy: "tommy" | "bot" = "bot") {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv || conv.platform !== "instagram") throw new InstagramError("Conversación no encontrada", 404);
  if (!canReply(conv.lastInboundAt)) throw new InstagramError("Fuera de la ventana de 24 hs", 409);
  const { token } = await getActiveToken();
  const res = await fetch(GRAPH + "/me/messages", {
    method: "POST",
    headers: { authorization: "Bearer " + token, "content-type": "application/json" },
    body: JSON.stringify({ recipient: { id: conv.participantId }, message: { attachment: { type: "image", payload: { url: imageUrl } } } }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const e = data.error || {};
    console.error("[inbox] image", res.status, e.code, e.message);
    throw new InstagramError("Instagram no envió la imagen: " + (e.message || res.status), 502);
  }
  await prisma.message.create({
    data: { conversationId: conv.id, externalId: data.message_id || null, direction: "out", text: null, attachments: [{ type: "image", url: imageUrl }], sentBy, sentAt: new Date() },
  });
}
