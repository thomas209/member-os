// Webhook de Instagram (Meta). Cuando llega un DM: sincroniza el inbox y,
// si el bot esta prendido, responde lo simple.
import crypto from "crypto";
import { syncInstagram } from "./inbox";
import { autoReplyPending } from "./autoReply";
import { handleCommentChange } from "./commentGift";

export function verifyInstagramSignature(rawBody: string, header: string | null) {
  const secret = process.env.INSTAGRAM_APP_SECRET;
  // Sin INSTAGRAM_APP_SECRET se acepta igual: el cuerpo del aviso no se usa,
  // solo dispara un sync contra la API oficial (los datos vienen de Instagram).
  if (!secret) return true;
  if (!header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const got = header.slice(7);
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

type IgEvent = { message?: { is_echo?: boolean; text?: string } };
type IgChange = { field?: string; value?: Parameters<typeof handleCommentChange>[0] };
type IgBody = { object?: string; entry?: { messaging?: IgEvent[]; changes?: IgChange[] }[] };

export function hasCustomerMessage(body: IgBody) {
  return (body.entry || []).some((e) => (e.messaging || []).some((m) => m.message && !m.message.is_echo));
}

export async function handleInstagramWebhook(body: IgBody) {
  if (body.object !== "instagram") return;
  // Comentarios en publicaciones -> respuestas automaticas (gift card, etc.)
  for (const e of body.entry || []) {
    for (const ch of e.changes || []) {
      if (ch.field !== "comments" || !ch.value) continue;
      try {
        const r = await handleCommentChange(ch.value);
        console.log("[instagram webhook] comentario", JSON.stringify(r));
      } catch (err) {
        console.error("[instagram webhook] comentario", err);
      }
    }
  }
  if (!hasCustomerMessage(body)) return;
  await syncInstagram(10);
  const r = await autoReplyPending();
  if (r.length) console.log("[instagram webhook] bot", JSON.stringify(r));
}
