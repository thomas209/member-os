import { NextResponse, NextRequest } from "next/server";
import { checkCoupon } from "@/lib/coupons";

// Valida un cupon para el checkout online y devuelve el descuento
// calculado, para mostrarle al cliente el total final antes de pagar.
// No modifica nada (el usedCount se incrementa recien cuando se confirma
// el pago: webhook de Mercado Pago o confirmacion de la transferencia).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const r = await checkCoupon({
      code: String(body.code || ""),
      subtotal: Number(body.subtotal) || 0,
      paymentMethod: body.paymentMethod === "TRANSFERENCIA" ? "TRANSFERENCIA" : "MERCADOPAGO",
      email: typeof body.email === "string" ? body.email : null,
    });
    if (!r.ok) return NextResponse.json({ valid: false, error: r.error });
    return NextResponse.json({ valid: true, code: r.coupon.code, discountAmount: r.discountAmount, transferOnly: r.coupon.transferOnly });
  } catch (error) {
    console.error("Error validando cupon:", error);
    return NextResponse.json({ valid: false, error: "Error al validar el cupón" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
