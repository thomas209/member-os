import { isSocialEnabled, aiConfig } from "@/lib/ai/config";
import { spentThisMonthUsd } from "@/lib/ai/client";
import { getInstagramAccount } from "@/lib/social/instagram";
import { getBrandVoice } from "@/lib/ai/brandVoice";
import { prisma } from "@/lib/prisma";
import CommunityManager from "./CommunityManager";

export const dynamic = "force-dynamic";

// "Tu community manager": la pantalla simple. Te propone que publicar,
// te arma el post en un clic y vos solo aprobas, agendas o descartas.
export default async function SocialHome({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const { open } = await searchParams;
  if (!isSocialEnabled()) {
    return (
      <div style={{ padding: "48px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Community manager</h1>
        <p style={{ fontSize: "13px", color: "#737373" }}>El módulo está apagado (FEATURE_SOCIAL).</p>
      </div>
    );
  }
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [account, voice, spent, unread, pendingReplies] = await Promise.all([
    getInstagramAccount(),
    getBrandVoice(),
    spentThisMonthUsd(),
    prisma.conversation.count({ where: { unread: true } }),
    prisma.conversation.count({ where: { lastMessageAt: { gte: since }, unread: true } }),
  ]);

  return (
    <CommunityManager
      account={account ? { handle: account.handle ?? "", picture: account.profilePictureUrl, status: account.status } : null}
      hasVoice={!!voice}
      unread={unread}
      urgent={pendingReplies}
      spent={spent}
      budget={aiConfig.monthlyBudgetUsd}
      openId={open}
    />
  );
}
