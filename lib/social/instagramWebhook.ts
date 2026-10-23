// Webhook de Instagram (Meta). Cuando llega un DM: sincroniza el inbox y,
// si el bot esta prendido, responde lo simple.
import crypto from "crypto";
import { syncInstagram } from "./inbox";
import { autoReplyPending } from "./autoReply";

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
type IgBody = { object?: string; entry?: { messaging?: IgEvent[] }[] };

export function hasCustomerMessage(body: IgBody) {
  return (body.entry || []).some((e) => (e.messaging || []).some((m) => m.message && !m.message.is_echo));
}

export async function handleInstagramWebhook(body: IgBody) {
  if (body.object !== "instagram" || !hasCustomerMessage(body)) return;
  await syncInstagram(10);
  const r = await autoReplyPending();
  if (r.length) console.log("[instagram webhook] bot", JSON.stringify(r));
}
