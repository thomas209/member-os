import crypto from "crypto";
import { NextRequest, NextResponse, after } from "next/server";
import { isSocialEnabled } from "@/lib/ai/config";
import { handleInstagramWebhook, verifyInstagramSignature } from "@/lib/social/instagramWebhook";

// Webhook PUBLICO de Instagram (Meta). No pasa por el login del admin:
// GET  = verificacion (hub.verify_token = INSTAGRAM_WEBHOOK_VERIFY_TOKEN)
// POST = DMs nuevos; firma validada con INSTAGRAM_APP_SECRET. Se responde
// 200 enseguida y el trabajo (sync + bot) corre despues con after().
export const runtime = "nodejs";
export const maxDuration = 60;

// Token de verificacion: INSTAGRAM_WEBHOOK_VERIFY_TOKEN, o si falta, uno
// derivado de CRON_SECRET (asi no hace falta otra variable en Vercel).
function verifyToken() {
  if (process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) return process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
  const s = process.env.CRON_SECRET;
  return s ? crypto.createHmac("sha256", s).update("instagram-webhook").digest("hex").slice(0, 32) : null;
}

export async function GET(request: NextRequest) {
  if (!isSocialEnabled()) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const p = request.nextUrl.searchParams;
  const expected = verifyToken();
  if (expected && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === expected) {
    return new NextResponse(p.get("hub.challenge") || "", { status: 200 });
  }
  return NextResponse.json({ error: "No autorizado" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  if (!isSocialEnabled()) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const raw = await request.text();
  if (!verifyInstagramSignature(raw, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }
  after(async () => {
    try {
      await handleInstagramWebhook(body as Parameters<typeof handleInstagramWebhook>[0]);
    } catch (e) {
      console.error("[instagram] webhook", e);
    }
  });
  return NextResponse.json({ ok: true });
}
