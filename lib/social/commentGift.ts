// Respuestas automaticas a comentarios ("Comenta GIFT y te mandamos una gift card").
// Cuando Instagram avisa de un comentario:
// 1) se lee el comentario desde la API (no se confia en el cuerpo del aviso),
// 2) se busca una regla activa para esa publicacion y esa palabra,
// 3) a cada persona una sola vez por regla: respuesta publica + privado con
//    su link personal (/gift/<token>) para cargar sus datos.
// La gift card (codigo unico) se genera recien cuando completa el formulario.
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getActiveToken, getComment, replyToComment, privateReplyToComment, markReauth, InstagramError } from "./instagram";

export const norm = (s: string) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function matchesKeyword(text: string, keyword: string) {
  const k = norm(keyword).trim();
  if (!k) return true;
  const esc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("(^|[^a-z0-9])" + esc + "([^a-z0-9]|$)").test(norm(text));
}

const pesos = (n: number) => "$" + n.toLocaleString("es-AR");

export function fillTemplate(t: string, v: { usuario?: string; link?: string; porcentaje?: number | null; minimo?: number | null }) {
  return String(t || "")
    .replace(/\{usuario\}/g, v.usuario ? "@" + v.usuario : "")
    .replace(/\{link\}/g, v.link || "")
    .replace(/\{porcentaje\}/g, v.porcentaje ? v.porcentaje + "%" : "")
    .replace(/\{minimo\}/g, v.minimo ? pesos(v.minimo) : "")
    .replace(/ {2,}/g, " ")
    .trim();
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com").replace(/\/$/, "");
}

type ChangeValue = { id?: string; text?: string; from?: { id?: string; username?: string }; media?: { id?: string } };

export async function handleCommentChange(value: ChangeValue) {
  const commentId = value?.id;
  if (!commentId) return { skipped: "sin id" };

  const rules = await prisma.commentRule.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } });
  if (!rules.length) return { skipped: "sin reglas" };

  // Ya procesado (Meta a veces repite el aviso)
  if (await prisma.commentReply.findUnique({ where: { commentId } })) return { skipped: "repetido" };

  const { account, token } = await getActiveToken();
  let c;
  try {
    c = await getComment(token, commentId);
  } catch (e) {
    if (e instanceof InstagramError && e.tokenInvalid) await markReauth(account.id);
    throw e;
  }
  const fromId = c.from?.id || value.from?.id;
  const username = c.from?.username || value.from?.username || "";
  const mediaId = c.media?.id || value.media?.id || "";
  const text = c.text ?? value.text ?? "";
  if (!fromId) return { skipped: "sin autor" };
  if (fromId === account.externalId) return { skipped: "comentario propio" };

  const rule = rules.find((r) => (r.allMedia || r.mediaIds.includes(mediaId)) && matchesKeyword(text, r.keyword));
  if (!rule) return { skipped: "no coincide" };

  // Una vez por persona y regla: el indice unico (ruleId, igUserId) lo garantiza
  let reply;
  try {
    reply = await prisma.commentReply.create({
      data: {
        ruleId: rule.id, igUserId: fromId, igUsername: username || null, commentId, mediaId: mediaId || null,
        commentText: text.slice(0, 500), token: crypto.randomBytes(12).toString("base64url"), status: "pending",
      },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return { skipped: "ya respondido a esta persona" };
    throw e;
  }

  const vars = {
    usuario: username,
    link: rule.giftPercent ? siteUrl() + "/gift/" + reply.token : rule.link || siteUrl(),
    porcentaje: rule.giftPercent,
    minimo: rule.giftMinAmount,
  };
  const errors: string[] = [];
  if (rule.publicReply) {
    try { await replyToComment(token, commentId, fillTemplate(rule.publicReply, vars)); }
    catch (e) { errors.push("respuesta pública: " + (e as Error).message); }
  }
  let sent = false;
  try { await privateReplyToComment(token, commentId, fillTemplate(rule.privateMessage, vars)); sent = true; }
  catch (e) { errors.push("privado: " + (e as Error).message); }

  await prisma.commentReply.update({
    where: { id: reply.id },
    data: { status: sent ? "sent" : "failed", error: errors.length ? errors.join(" · ").slice(0, 500) : null },
  });
  return { rule: rule.name, sent, errors };
}
