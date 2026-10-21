import { NextRequest, NextResponse } from "next/server";
import { isSocialEnabled } from "@/lib/ai/config";
import { handleWhatsAppWebhook, verifySignature } from "@/lib/social/whatsappInbox";

// Webhook PUBLICO de WhatsApp (Meta). No pasa por el login del admin:
// GET  = verificacion inicial (Meta manda hub.verify_token = WHATSAPP_VERIFY_TOKEN)
// POST = mensajes nuevos; se valida la firma con WHATSAPP_APP_SECRET.
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isSocialEnabled()) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const p = request.nextUrl.searchParams;
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (expected && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === expected) {
    return new NextResponse(p.get("hub.challenge") || "", { status: 200 });
  }
  return NextResponse.json({ error: "No autorizado" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  if (!isSocialEnabled()) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }
  try {
    await handleWhatsAppWebhook(JSON.parse(raw));
  } catch (e) {
    // Meta reintenta si no respondemos 200; se loguea y se responde igual.
    console.error("[whatsapp] webhook", e);
  }
  return NextResponse.json({ ok: true });
}
