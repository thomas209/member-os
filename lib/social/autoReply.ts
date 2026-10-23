// Bot que responde solo los DMs de Instagram. Se controla con variables:
//   SOCIAL_AUTOREPLY=off|test|on   (off si falta)
//   SOCIAL_AUTOREPLY_TEST_USERS=orbitk.systems,otra   (solo en modo test)
// Responde unicamente consultas simples (stock, precio, horarios, envios,
// saludo). Si la IA marca needsHuman, o es pedido/cambio/reclamo, no
// contesta: deja la conversacion como no leida para Tommy.
import { prisma } from "@/lib/prisma";
import { suggestReply } from "@/lib/ai/replyAssistant";
import { sendInstagramReply, canReply } from "./inbox";

const SAFE = new Set(["stock", "precio", "horarios", "envios", "otro"]);
// Solo mensajes recientes: al prenderlo no contesta mensajes viejos.
const MAX_AGE_MS = 15 * 60 * 1000;

export function autoReplyMode(): "off" | "test" | "on" {
  const m = (process.env.SOCIAL_AUTOREPLY || "off").toLowerCase();
  return m === "on" || m === "test" ? m : "off";
}

function testUsers() {
  return (process.env.SOCIAL_AUTOREPLY_TEST_USERS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

export async function autoReplyPending() {
  const mode = autoReplyMode();
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

    // "Lock": si dos avisos llegan juntos, solo uno responde.
    const lock = await prisma.conversation.updateMany({ where: { id: c.id, unread: true }, data: { unread: false } });
    if (lock.count !== 1) continue;

    try {
      const s = await suggestReply(c.id);
      if (s.needsHuman || !SAFE.has(s.category) || !s.reply.trim()) {
        await prisma.conversation.update({ where: { id: c.id }, data: { unread: true } });
        results.push({ conversation: who, result: "para Tommy: " + (s.reason || s.category) });
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
