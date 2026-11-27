import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import GiftExperience from "./GiftExperience";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tu gift card · Member Club", robots: { index: false, follow: false } };

export default async function GiftPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reply = await prisma.commentReply.findUnique({ where: { token }, include: { rule: true } });
  if (!reply || !reply.rule.giftPercent) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <h1 className="co-titulo" style={{ fontSize: 26 }}>Este link no es válido</h1>
        <p style={{ color: "#6E6E73" }}>Puede que ya haya vencido. Escribinos por Instagram a @member_ba.</p>
      </div>
    );
  }
  let claimed = null;
  if (reply.claimedAt && reply.couponCode) {
    const c = await prisma.coupon.findUnique({ where: { code: reply.couponCode }, select: { validUntil: true } });
    claimed = { code: reply.couponCode, email: reply.email || "", validUntil: c?.validUntil ? c.validUntil.toISOString() : null };
  }
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "36px 24px 64px", overflow: "hidden" }}>
      <GiftExperience
        token={token}
        percent={reply.rule.giftPercent}
        minAmount={reply.rule.giftMinAmount}
        days={reply.rule.giftDays || 30}
        username={reply.igUsername}
        claimed={claimed}
      />
    </div>
  );
}
