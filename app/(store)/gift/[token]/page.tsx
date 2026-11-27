import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import GiftCardVisual from "@/components/store/GiftCardVisual";
import GiftForm from "./GiftForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tu gift card · Member Club", robots: { index: false, follow: false } };

export default async function GiftPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reply = await prisma.commentReply.findUnique({ where: { token }, include: { rule: true } });
  const ok = !!reply && !!reply.rule.giftPercent;
  const pct = reply?.rule.giftPercent || 30;
  const min = reply?.rule.giftMinAmount || null;
  const days = reply?.rule.giftDays || 30;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 24px 64px" }}>
      <p className="co-label" style={{ textAlign: "center" }}>Para vos{reply?.igUsername ? ", @" + reply.igUsername : ""}</p>
      <h1 className="co-titulo" style={{ textAlign: "center", fontSize: 30, margin: "4px 0 28px" }}>Tu gift card</h1>
      <GiftCardVisual percent={pct} />
      {!ok ? (
        <p style={{ textAlign: "center", marginTop: 32, color: "#6E6E73" }}>Este link no es válido o ya venció. Escribinos por Instagram a @member_ba.</p>
      ) : reply!.claimedAt ? (
        <p style={{ textAlign: "center", marginTop: 32, color: "#6E6E73" }}>Ya te mandamos tu gift card a <b>{reply!.email}</b>. Revisá tu casilla (y la carpeta de spam).</p>
      ) : (
        <>
          <p style={{ textAlign: "center", fontSize: 15, color: "#525252", margin: "32px 0 24px", lineHeight: 1.5 }}>
            Completá tus datos y te mandamos por mail tu código de <b>{pct}% OFF</b> para tu primera compra en la web, pagando por transferencia
            {min ? <> (compras desde ${min.toLocaleString("es-AR")})</> : null}. Vence a los {days} días.
          </p>
          <GiftForm token={token} />
        </>
      )}
    </div>
  );
}
