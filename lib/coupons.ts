// Validacion de cupones compartida por el checkout y el boton "Aplicar".
// Reglas comunes (activo, vencimiento, usos, minimo) + las de los cupones
// especiales (gift card por comentar en Instagram):
// - transferOnly: solo pagando por transferencia, y reemplaza el descuento
//   comun por transferencia (no se suman).
// - email: el codigo es personal, solo lo usa el email que lo pidio.
// - firstPurchaseOnly: solo si ese email no tiene compras anteriores.
// Los cupones comunes siguen igual que antes: no se combinan con transferencia.
import type { Coupon } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { COUNTED_ORDER_STATUSES } from "@/lib/customerCrm";

type PaymentMethod = "MERCADOPAGO" | "TRANSFERENCIA";

export type CouponCheck =
  | { ok: true; coupon: Coupon; discountAmount: number }
  | { ok: false; error: string };

const pesos = (n: number) => "$" + n.toLocaleString("es-AR");

// true si el email ya tiene alguna compra cobrada (online o en el local).
export async function hasPreviousPurchase(email: string) {
  const e = email.trim().toLowerCase();
  if (!e) return false;
  const n = await prisma.order.count({
    where: {
      status: { in: [...COUNTED_ORDER_STATUSES] },
      OR: [
        { guestEmail: { equals: e, mode: "insensitive" } },
        { customer: { email: { equals: e, mode: "insensitive" } } },
      ],
    },
  });
  return n > 0;
}

export async function checkCoupon(params: {
  code: string;
  subtotal: number;
  paymentMethod: PaymentMethod;
  email?: string | null;
}): Promise<CouponCheck> {
  const code = String(params.code || "").trim().toUpperCase();
  if (!code) return { ok: false, error: "Ingresá un código" };
  const coupon = await prisma.coupon.findUnique({ where: { code } });

  if (!coupon || !coupon.isActive) return { ok: false, error: "Cupón inválido" };
  if (coupon.validFrom && coupon.validFrom > new Date()) return { ok: false, error: "Cupón todavía no vigente" };
  if (coupon.validUntil && coupon.validUntil < new Date()) return { ok: false, error: "Cupón vencido" };
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { ok: false, error: "Este código ya se usó" };

  if (coupon.transferOnly && params.paymentMethod !== "TRANSFERENCIA") {
    return { ok: false, error: "Este código es solo pagando por transferencia" };
  }
  if (!coupon.transferOnly && params.paymentMethod === "TRANSFERENCIA") {
    return { ok: false, error: "No se puede combinar con el descuento por transferencia" };
  }
  if (coupon.minOrderAmount && params.subtotal < Number(coupon.minOrderAmount)) {
    return { ok: false, error: "Monto mínimo no alcanzado (" + pesos(Number(coupon.minOrderAmount)) + ")" };
  }

  const email = (params.email || "").trim().toLowerCase();
  if (coupon.email || coupon.firstPurchaseOnly) {
    if (!email) return { ok: false, error: "Completá tu email para usar este código" };
  }
  if (coupon.email && coupon.email.toLowerCase() !== email) {
    return { ok: false, error: "Este código es personal: usá el email con el que lo pediste" };
  }
  if (coupon.firstPurchaseOnly && (await hasPreviousPurchase(email))) {
    return { ok: false, error: "Este código es para tu primera compra" };
  }
  // Codigo de un solo uso: si ya hay un pedido (pendiente de pago) con el,
  // no se puede usar en otro.
  if (coupon.maxUses === 1) {
    const used = await prisma.order.count({ where: { couponId: coupon.id, status: { notIn: ["CANCELLED", "REFUNDED"] } } });
    if (used > 0) return { ok: false, error: "Este código ya se usó en otro pedido" };
  }

  const raw = coupon.type === "PERCENTAGE" ? params.subtotal * (Number(coupon.value) / 100) : Number(coupon.value);
  const discountAmount = Math.round(Math.min(params.subtotal, raw));
  return { ok: true, coupon, discountAmount };
}
