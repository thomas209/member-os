// Bot que responde solo los DMs de Instagram. Se prende/apaga con el boton
// del Inbox (AppSetting "social.autoreply"); si nunca se toco, usa
//   SOCIAL_AUTOREPLY=off|test|on   y   SOCIAL_AUTOREPLY_TEST_USERS=orbitk.systems
// Si responde una persona, el bot se pausa 1 hora en esa conversacion;
// "Devolver al bot" la retoma al instante.
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

// Pausa del bot cuando responde una persona (panel o celu).
const HUMAN_PAUSE_MS = 60 * 60 * 1000;
// "Devolver al bot": status = "bot:<fecha>". Lo que paso antes de esa fecha
// (respuestas de una persona, derivaciones) ya no frena al bot.
function returnedToBotAt(status: string) {
  return status.startsWith("bot:") ? new Date(status.slice(4)) : null;
}

// Candado simple con AppSetting: si llegan dos avisos juntos, responde uno solo.
async function lock(id: string) {
  const key = "lock:conv:" + id;
  try {
    await prisma.appSetting.create({ data: { key, value: "1" } });
    return true;
  } catch {
    const row = await prisma.appSetting.findUnique({ where: { key } }).catch(() => null);
    // Candado viejo (proceso que se corto): se libera a los 2 minutos.
    if (row && Date.now() - +row.updatedAt > 2 * 60 * 1000) {
      const r = await prisma.appSetting.updateMany({ where: { key, updatedAt: row.updatedAt }, data: { value: "1" } });
      return r.count === 1;
    }
    return false;
  }
}
const unlock = (id: string) => prisma.appSetting.delete({ where: { key: "lock:conv:" + id } }).catch(() => {});

type ConvRow = NonNullable<Awaited<ReturnType<typeof loadConv>>>;
function loadConv(id: string) {
  return prisma.conversation.findUnique({ where: { id }, include: { messages: { orderBy: { sentAt: "desc" }, take: 1 } } });
}

// Decide y responde UNA conversacion. Devuelve que paso (para logs y el panel).
async function processConversation(c: ConvRow, opts: { ignoreAge?: boolean } = {}): Promise<string> {
  const who = (c.participantName || "").toLowerCase();
  if (c.platform !== "instagram") return "no es Instagram";
  if (c.messages[0]?.direction !== "in") return "el último mensaje no es del cliente";
  if (!canReply(c.lastInboundAt)) return "pasaron más de 24 hs";
  if (!opts.ignoreAge && (!c.lastInboundAt || Date.now() - +c.lastInboundAt > MAX_AGE_MS)) return "mensaje viejo";

  const vuelta = returnedToBotAt(c.status);
  const ultimaSalida = await prisma.message.findFirst({
    where: { conversationId: c.id, direction: "out", ...(vuelta ? { sentAt: { gt: vuelta } } : {}) },
    orderBy: { sentAt: "desc" },
    select: { sentBy: true, text: true, sentAt: true },
  });
  if (ultimaSalida) {
    const hace = Date.now() - +ultimaSalida.sentAt;
    if (ultimaSalida.sentBy !== "bot" && hace < HUMAN_PAUSE_MS) return "pausado: respondió una persona hace menos de 1 hora";
    if (ultimaSalida.sentBy === "bot" && ultimaSalida.text === HANDOFF_TEXT && hace < HANDOFF_EVERY_MS) return "pausado: derivada a Tommy";
  }

  if (!(await lock(c.id))) return "otro proceso la está respondiendo";
  try {
    const s = await suggestReply(c.id);
    if (s.needsHuman || !SAFE.has(s.category) || !s.reply.trim()) {
      const motivo = s.reason || s.category;
      const yaAvisado = await prisma.message.findFirst({
        where: { conversationId: c.id, sentBy: "bot", text: HANDOFF_TEXT, sentAt: { gte: new Date(Date.now() - HANDOFF_EVERY_MS) } },
        select: { id: true },
      });
      if (!yaAvisado) await sendInstagramReply(c.id, HANDOFF_TEXT, "bot").catch((e) => console.error("[autoReply] handoff", e));
      await notifyTommy(who, motivo, c.messages[0]?.text || "[adjunto]").catch((e) => console.error("[autoReply] mail", e));
      await prisma.conversation.update({ where: { id: c.id }, data: { unread: true, status: "human" } });
      return "derivada a Tommy: " + motivo;
    }
    await sendInstagramReply(c.id, s.reply, "bot");
    // Cada link en su propio mensaje, solo: Instagram le arma la vista previa con la foto.
    for (const link of s.links) {
      await sendInstagramReply(c.id, link, "bot").catch((e) => console.error("[autoReply] link", e));
    }
    return "respondida (" + s.category + ")";
  } catch (e) {
    await prisma.conversation.update({ where: { id: c.id }, data: { unread: true } }).catch(() => {});
    console.error("[autoReply]", who, e);
    return "error: " + (e instanceof Error ? e.message : "?");
  } finally {
    await unlock(c.id);
  }
}

function allowedByMode(mode: AutoReplyMode, who: string) {
  if (mode === "off") return false;
  return mode === "on" || testUsers().includes(who.toLowerCase());
}

// Lo llama el webhook: revisa las conversaciones con mensajes nuevos.
export async function autoReplyPending() {
  const mode = await autoReplyMode();
  if (mode === "off") return [];
  const convs = await prisma.conversation.findMany({
    where: { platform: "instagram", lastInboundAt: { gte: new Date(Date.now() - MAX_AGE_MS) } },
    include: { messages: { orderBy: { sentAt: "desc" }, take: 1 } },
    orderBy: { lastInboundAt: "desc" },
    take: 10,
  });
  const results: { conversation: string; result: string }[] = [];
  for (const c of convs) {
    const who = c.participantName || "";
    if (!allowedByMode(mode, who)) continue;
    results.push({ conversation: who, result: await processConversation(c) });
  }
  return results;
}

// Boton "Devolver al bot" del panel: el bot retoma la conversacion y, si el
// ultimo mensaje es del cliente (dentro de las 24 hs), le responde ya.
export async function returnToBot(conversationId: string) {
  await prisma.conversation.update({ where: { id: conversationId }, data: { status: "bot:" + new Date().toISOString() } });
  const mode = await autoReplyMode();
  const c = await loadConv(conversationId);
  if (!c) return "Conversación no encontrada";
  if (!allowedByMode(mode, c.participantName || "")) return mode === "off" ? "Listo. El bot está apagado: prendelo arriba para que responda." : "Listo. El bot está en modo prueba y esta cuenta no es de prueba.";
  const r = await processConversation(c, { ignoreAge: true });
  return r === "el último mensaje no es del cliente" ? "Listo. El bot responde el próximo mensaje de esta persona." : "Listo: " + r;
}
