import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";
import { getActiveToken, listMedia, subscribeWebhooks } from "@/lib/social/instagram";

// Respuestas automaticas a comentarios. Protegido por el middleware (/api/admin).
// No borra nada: una regla se pausa (active=false), no se elimina.
export async function GET(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    if (request.nextUrl.searchParams.get("media")) {
      const { token } = await getActiveToken();
      const media = await listMedia(token, 30);
      return NextResponse.json({
        media: media.map((m) => ({ id: m.id, caption: (m.caption || "").slice(0, 120), thumb: m.thumbnail_url || m.media_url || "", permalink: m.permalink || "", type: m.media_type, timestamp: m.timestamp })),
      });
    }
    const rules = await prisma.commentRule.findMany({ orderBy: { createdAt: "desc" } });
    const stats = await Promise.all(rules.map(async (r) => {
      const [sent, failed, claimedRows] = await Promise.all([
        prisma.commentReply.count({ where: { ruleId: r.id, status: "sent" } }),
        prisma.commentReply.count({ where: { ruleId: r.id, status: "failed" } }),
        prisma.commentReply.findMany({ where: { ruleId: r.id, couponCode: { not: null } }, select: { couponCode: true } }),
      ]);
      const codes = claimedRows.map((x) => x.couponCode!) ;
      const used = codes.length ? await prisma.coupon.count({ where: { code: { in: codes }, usedCount: { gt: 0 } } }) : 0;
      return { ruleId: r.id, sent, failed, claimed: codes.length, used };
    }));
    const recent = await prisma.commentReply.findMany({
      orderBy: { createdAt: "desc" }, take: 40,
      select: { id: true, ruleId: true, igUsername: true, commentText: true, status: true, error: true, claimedAt: true, email: true, couponCode: true, createdAt: true },
    });
    return NextResponse.json({ rules, stats, recent });
  } catch (e) {
    return aiErrorResponse(e);
  }
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n > 0 ? n : null; };

export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const b = await request.json();
    if (b.action === "subscribe") {
      const { token } = await getActiveToken();
      const r = await subscribeWebhooks(token);
      return NextResponse.json({ ok: !!r.success });
    }
    const r = b.rule || {};
    const data = {
      active: r.active !== false,
      name: str(r.name, 80) || "Respuesta",
      keyword: str(r.keyword, 40).toUpperCase(),
      allMedia: !!r.allMedia,
      mediaIds: Array.isArray(r.mediaIds) ? r.mediaIds.map((x: unknown) => String(x)).slice(0, 50) : [],
      publicReply: str(r.publicReply, 300) || null,
      privateMessage: str(r.privateMessage, 900),
      link: str(r.link, 300) || null,
      giftPercent: int(r.giftPercent),
      giftMinAmount: int(r.giftMinAmount),
      giftDays: int(r.giftDays),
    };
    if (!data.privateMessage) return NextResponse.json({ error: "Escribí el mensaje privado" }, { status: 400 });
    if (!data.allMedia && !data.mediaIds.length) return NextResponse.json({ error: "Elegí al menos una publicación (o todas)" }, { status: 400 });
    if (data.giftPercent && (data.giftPercent > 90)) return NextResponse.json({ error: "El descuento no puede ser mayor a 90%" }, { status: 400 });
    if (data.giftPercent && !data.privateMessage.includes("{link}")) return NextResponse.json({ error: "El mensaje privado tiene que tener {link} (el link para pedir la gift card)" }, { status: 400 });
    const rule = r.id
      ? await prisma.commentRule.update({ where: { id: String(r.id) }, data })
      : await prisma.commentRule.create({ data });
    return NextResponse.json({ rule });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
export const dynamic = "force-dynamic";
