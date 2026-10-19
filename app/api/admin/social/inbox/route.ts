import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canReply } from "@/lib/social/inbox";
import { socialDisabled } from "@/lib/ai/http";

// Lista de conversaciones. Protegido por el middleware (/api/admin).
export async function GET() {
  const off = socialDisabled();
  if (off) return off;
  const convs = await prisma.conversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: { messages: { orderBy: { sentAt: "desc" }, take: 1 } },
  });
  return NextResponse.json({
    conversations: convs.map((c) => ({
      id: c.id,
      platform: c.platform,
      name: c.participantName || c.participantId,
      lastMessageAt: c.lastMessageAt,
      unread: c.unread,
      canReply: canReply(c.lastInboundAt),
      preview: c.messages[0]?.text || (c.messages[0] ? "[adjunto]" : ""),
      lastFromCustomer: c.messages[0]?.direction === "in",
    })),
  });
}
