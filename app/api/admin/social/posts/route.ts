import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInstagramAccount } from "@/lib/social/instagram";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";

// Lista para el calendario: agendados, borradores y publicados recientes.
export async function GET(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  // Agenda: todo lo que sale (o salio) en un rango de fechas.
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  if (from && to) {
    const gte = new Date(from), lt = new Date(to);
    if (isNaN(+gte) || isNaN(+lt)) return NextResponse.json({ error: "Rango inválido" }, { status: 400 });
    const items = await prisma.scheduledPost.findMany({
      where: {
        OR: [
          // "draft" con fecha = propuesta del plan semanal (falta aprobar).
          { status: { in: ["draft", "approved", "publishing", "paused", "failed"] }, scheduledAt: { gte, lt } },
          { status: "published", publishedAt: { gte, lt } },
        ],
      },
      orderBy: { scheduledAt: "asc" },
      take: 200,
    });
    return NextResponse.json({ items });
  }
  const [upcoming, drafts, recent] = await Promise.all([
    prisma.scheduledPost.findMany({ where: { status: { in: ["approved", "publishing"] } }, orderBy: { scheduledAt: "asc" }, take: 50 }),
    // Las propuestas del plan (borrador con fecha) se ven en la agenda, no aca.
    prisma.scheduledPost.findMany({ where: { OR: [{ status: "draft", scheduledAt: null }, { status: { in: ["paused", "failed"] } }] }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.scheduledPost.findMany({ where: { status: "published" }, orderBy: { publishedAt: "desc" }, take: 12 }),
  ]);
  return NextResponse.json({ upcoming, drafts, recent });
}

// Crea un borrador de post (no publica). Protegido por el middleware.
export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const body = await request.json();
    const mediaUrls: string[] = (Array.isArray(body.mediaUrls) ? body.mediaUrls : []).map(String).filter((u: string) => u.startsWith("https://res.cloudinary.com/"));
    const isStory = body.kind === "story";
    // Las historias no llevan texto: Instagram no muestra caption en stories.
    const caption = isStory ? "" : String(body.caption || "").trim();
    const productIds: string[] = (Array.isArray(body.productIds) ? body.productIds : []).map(String);
    if (!mediaUrls.length || mediaUrls.length > 10) return NextResponse.json({ error: "Faltan las imágenes (1 a 10)" }, { status: 400 });
    if (!isStory && !caption) return NextResponse.json({ error: "Falta el texto del post" }, { status: 400 });
    if (caption.length > 2200) return NextResponse.json({ error: "El texto supera los 2200 caracteres de Instagram" }, { status: 400 });
    const account = await getInstagramAccount();
    if (!account) return NextResponse.json({ error: "No hay cuenta de Instagram conectada" }, { status: 400 });
    const post = await prisma.scheduledPost.create({
      data: { accountId: account.id, productIds, caption, mediaUrls, mediaType: isStory ? "story" : mediaUrls.length > 1 ? "carousel" : "image" },
    });
    return NextResponse.json({ post });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
