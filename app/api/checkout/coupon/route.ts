import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Valida un cupon para el checkout online y devuelve el descuento
// calculado, para mostrarle al cliente el total final antes de pagar.
// No modifica nada (el usedCount se incrementa recien cuando se confirma
// el pago en el webhook de Mercado Pago).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();
    const subtotal = Number(body.subtotal) || 0;

    if (!code) {
      return NextResponse.json({ valid: false, error: "Ingresa un codigo" });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ valid: false, error: "Cupon invalido" });
    }
    if (coupon.validUntil && coupon.validUntil < new Date()) {
      return NextResponse.json({ valid: false, error: "Cupon expirado" });
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: "Cupon sin usos disponibles" });
    }
    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      return NextResponse.json({
        valid: false,
        error: "Monto minimo no alcanzado ($" + Number(coupon.minOrderAmount).toLocaleString("es-AR") + ")",
      });
    }

    const rawDiscount = coupon.type === "PERCENTAGE" ? subtotal * (Number(coupon.value) / 100) : Number(coupon.value);
    const discountAmount = Math.min(subtotal, rawDiscount);

    return NextResponse.json({ valid: true, code: coupon.code, discountAmount });
  } catch (error) {
    console.error("Error validando cupon:", error);
    return NextResponse.json({ valid: false, error: "Error al validar el cupon" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
