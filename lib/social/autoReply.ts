// Bot que responde solo los DMs de Instagram. Se controla con variables:
//   SOCIAL_AUTOREPLY=off|test|on   (off si falta)
//   SOCIAL_AUTOREPLY_TEST_USERS=orbitk.systems,otra   (solo en modo test)
// Responde unicamente consultas simples (stock, precio, horarios, envios,
// saludo). Si la IA marca needsHuman, o es pedido/cambio/reclamo, no
// contesta: deja la conversacion como no leida para Tommy.
import { prisma } from "@/lib/prisma";
import { suggestReply } from "@/lib/ai/replyAssistant";
import { sendInstagramReply, canReply } from "./inbox";
import { Resend } from "resend";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com";
// Lo que le dice el bot al cliente cuando le pasa la conversacion a Tommy.
const HANDOFF_TEXT = "¡Gracias por escribirnos! Ya le pasé tu consulta al equipo y en un rato te responde una persona 🙌";
const HANDOFF_EVERY_MS = 12 * 60 * 60 * 1000;

// Aviso por mail a Tommy (SOCIAL_NOTIFY_EMAIL). Si falta la variable, no hace nada.
async function notifyTommy(who: string, motivo: string, ultimo: string) {
  const to = process.env.SOCIAL_NOTIFY_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) return;
  const esc = (x: string) => x.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string);
  await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Member Club <onboarding@resend.dev>",
    to,
    subject: `Instagram: @${who} necesita que respondas vos`,
    html: `<p><b>@${esc(who)}</b> escribió:</p><blockquote>${esc(ultimo)}</blockquote><p>Motivo: ${esc(motivo)}</p><p><a href="${SITE_URL}/admin/social/inbox">Abrir el Inbox</a></p>`,
  });
}

const SAFE = new Set(["stock", "precio", "horarios", "envios", "politica", "otro"]);
// Solo mensajes recientes: al prenderlo no contesta mensajes viejos.
const MAX_AGE_MS = 15 * 60 * 1000;

export type AutoReplyMode = "off" | "test" | "on";
const KEY = "social.autoreply";
const norm = (m: string | undefined | null): AutoReplyMode => {
  const v = (m || "").toLowerCase();
  return v === "on" || v === "test" ? v : "off";
};

// Lo que se eligio en el panel manda; si nunca se toco (o la tabla todavia no
// existe en esta base), se usa la variable SOCIAL_AUTOREPLY.
export async function autoReplyMode(): Promise<AutoReplyMode> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: KEY } });
    if (row) return norm(row.value);
  } catch {
    // tabla sin crear: sigue con la variable
  }
  return norm(process.env.SOCIAL_AUTOREPLY);
}

export async function setAutoReplyMode(mode: AutoReplyMode) {
  await prisma.appSetting.upsert({ where: { key: KEY }, create: { key: KEY, value: mode }, update: { value: mode } });
}

function testUsers() {
  return (process.env.SOCIAL_AUTOREPLY_TEST_USERS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

export async function autoReplyPending() {
  const mode = await autoReplyMode();
  if (mode === "off") return [];
  const since = new Date(Date.now() - MAX_AGE_MS);
  const convs = await prisma.conversation.findMany({
    where: { platform: "instagram", unread: true, lastInboundAt: { gte: since } },
    include: { messages: { orderBy: { sentAt: "desc" }, take: 1 } },
    take: 10,
  });
  const allowed = testUsers();
  const results: { conversation: string; result: string }[] = [];

  for (const c of convs) {
    const who = (c.participantName || "").toLowerCase();
    if (mode === "test" && !allowed.includes(who)) continue;
    if (c.messages[0]?.direction !== "in") continue;
    if (!canReply(c.lastInboundAt)) continue;
    // Si lo ultimo que se respondio lo mando una persona (panel o celu) en las
    // ultimas 12 hs, o el bot ya derivo la conversacion, el bot no se mete.
    const ultimaSalida = await prisma.message.findFirst({
      where: { conversationId: c.id, direction: "out" },
      orderBy: { sentAt: "desc" },
      select: { sentBy: true, text: true, sentAt: true },
    });
    if (ultimaSalida && Date.now() - +ultimaSalida.sentAt < HANDOFF_EVERY_MS) {
      if (ultimaSalida.sentBy !== "bot") continue;
      if (c.status === "human" && ultimaSalida.text === HANDOFF_TEXT) continue;
    }

    // "Lock": si dos avisos llegan juntos, solo uno responde.
    const lock = await prisma.conversation.updateMany({ where: { id: c.id, unread: true }, data: { unread: false } });
    if (lock.count !== 1) continue;

    try {
      const s = await suggestReply(c.id);
      if (s.needsHuman || !SAFE.has(s.category) || !s.reply.trim()) {
        await prisma.conversation.update({ where: { id: c.id }, data: { unread: true } });
        const motivo = s.reason || s.category;
        // Al cliente: aviso de que responde una persona (una vez cada 12 hs por conversacion).
        const yaAvisado = await prisma.message.findFirst({
          where: { conversationId: c.id, sentBy: "bot", text: HANDOFF_TEXT, sentAt: { gte: new Date(Date.now() - HANDOFF_EVERY_MS) } },
          select: { id: true },
        });
        if (!yaAvisado) await sendInstagramReply(c.id, HANDOFF_TEXT, "bot").catch((e) => console.error("[autoReply] handoff", e));
        await notifyTommy(who, motivo, c.messages[0]?.text || "[adjunto]").catch((e) => console.error("[autoReply] mail", e));
        // sendInstagramReply marca la conversacion como leida: se vuelve a marcar para Tommy.
        await prisma.conversation.update({ where: { id: c.id }, data: { unread: true, status: "human" } });
        results.push({ conversation: who, result: "para Tommy: " + motivo });
        continue;
      }
      await sendInstagramReply(c.id, s.reply, "bot");
      // Cada link en su propio mensaje, solo: Instagram le arma la vista previa con la foto.
      for (const link of s.links) {
        await sendInstagramReply(c.id, link, "bot").catch((e) => console.error("[autoReply] link", e));
      }
      results.push({ conversation: who, result: "respondido (" + s.category + ")" });
    } catch (e) {
      await prisma.conversation.update({ where: { id: c.id }, data: { unread: true } }).catch(() => {});
      console.error("[autoReply]", who, e);
      results.push({ conversation: who, result: "error: " + (e instanceof Error ? e.message : "?") });
    }
  }
  return results;
}
