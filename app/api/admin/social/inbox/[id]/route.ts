import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canReply, WINDOW_MS } from "@/lib/social/inbox";
import { socialDisabled } from "@/lib/ai/http";

// Mensajes de una conversacion; al abrirla se marca como leida.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const off = socialDisabled();
  if (off) return off;
  const { id } = await params;
  const c = await prisma.conversation.findUnique({ where: { id }, include: { messages: { orderBy: { sentAt: "asc" } } } });
  if (!c) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (c.unread) await prisma.conversation.update({ where: { id }, data: { unread: false } });
  return NextResponse.json({
    conversation: {
      id: c.id,
      platform: c.platform,
      name: c.participantName || c.participantId,
      handle: c.participantId,
      canReply: canReply(c.lastInboundAt),
      windowEndsAt: c.lastInboundAt ? new Date(+c.lastInboundAt + WINDOW_MS) : null,
      messages: c.messages.map((m) => ({ id: m.id, direction: m.direction, text: m.text, attachments: m.attachments, sentBy: m.sentBy, sentAt: m.sentAt })),
    },
  });
}
