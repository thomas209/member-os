// Gift card por comentar en Instagram: arma el codigo unico cuando la persona
// completa sus datos en /gift/<token>.
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { upsertCustomerByEmail } from "@/lib/customerCrm";
import { hasPreviousPurchase } from "@/lib/coupons";
import { sendGiftCardEmail } from "@/lib/email";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I para que no se confundan

function newCode() {
  const b = crypto.randomBytes(6);
  return "GIFT-" + Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join("");
}

export type ClaimInput = { token: string; firstName: string; lastName: string; email: string; phone?: string };
export type ClaimResult =
  | { ok: true; code: string; email: string; validUntil: Date | null; alreadyClaimed?: boolean }
  | { ok: false; error: string; status?: number };

export async function claimGift(input: ClaimInput): Promise<ClaimResult> {
  const email = input.email.trim().toLowerCase();
  const reply = await prisma.commentReply.findUnique({ where: { token: input.token }, include: { rule: true } });
  if (!reply || !reply.rule.giftPercent) return { ok: false, error: "Este link no es válido.", status: 404 };

  // Ya la pidio: se reenvia el mismo codigo al mismo mail
  if (reply.claimedAt && reply.couponCode) {
    const c = await prisma.coupon.findUnique({ where: { code: reply.couponCode }, select: { validUntil: true } });
    return { ok: true, code: reply.couponCode, email: reply.email || email, validUntil: c?.validUntil ?? null, alreadyClaimed: true };
  }
  if (await hasPreviousPurchase(email)) {
    return { ok: false, error: "La gift card es para tu primera compra y este email ya tiene compras en Member Club." };
  }
  // Una gift card de comentarios por email
  const existing = await prisma.coupon.findFirst({ where: { source: "ig-comment", email } });
  if (existing) return { ok: false, error: "Este email ya tiene una gift card. Revisá tu casilla (y la carpeta de spam)." };

  const customerId = await upsertCustomerByEmail({
    email, firstName: input.firstName.trim(), lastName: input.lastName.trim(), phone: input.phone?.trim() || null,
  });

  const days = reply.rule.giftDays || 30;
  const validUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  let code = "";
  for (let i = 0; i < 5 && !code; i++) {
    const c = newCode();
    try {
      await prisma.coupon.create({
        data: {
          code: c, type: "PERCENTAGE", value: reply.rule.giftPercent,
          minOrderAmount: reply.rule.giftMinAmount ?? null, maxUses: 1, validUntil,
          transferOnly: true, firstPurchaseOnly: true, source: "ig-comment", email,
        },
      });
      code = c;
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  if (!code) return { ok: false, error: "No pudimos generar el código, probá de nuevo.", status: 500 };

  await prisma.commentReply.update({
    where: { id: reply.id },
    data: { claimedAt: new Date(), email, customerId, couponCode: code },
  });

  try {
    await sendGiftCardEmail({
      to: email, firstName: input.firstName.trim(), code, percent: reply.rule.giftPercent,
      minAmount: reply.rule.giftMinAmount, validUntil,
    });
  } catch (e) {
    console.error("[gift] mail", e);
  }
  return { ok: true, code, email, validUntil };
}
