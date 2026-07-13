import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { upsertCustomerByEmail } from "@/lib/customerCrm";

const PAYMENT_METHODS = ["EFECTIVO", "TARJETA", "TRANSFERENCIA"];

class StockError extends Error {
  detail: { productName: string; size: string; available: number };
  constructor(detail: { productName: string; size: string; available: number }) {
    super("Stock insuficiente");
    this.detail = detail;
  }
}

class CheckoutError extends Error {}

// Cobra el carrito del POS: crea la orden, descuenta stock de forma
// atomica (evita vender de mas si dos cajas tocan la misma variante
// al mismo tiempo) y registra el movimiento de stock. Acepta un cupon
// (couponCode) y/o un descuento manual en pesos (manualDiscount).
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { items, paymentMethod, couponCode } = body;
    const manualDiscountInput = Math.max(0, Number(body.manualDiscount) || 0);

    // Datos del cliente son opcionales en el POS (se guardan igual que en el checkout online)
    const customerName = String(body.customerName || "").trim();
    const customerEmail = String(body.customerEmail || "").trim();
    const customerPhone = String(body.customerPhone || "").trim();
    const nameParts = customerName.split(/\s+/).filter(Boolean);
    const guestFirstName = nameParts[0] || null;
    const guestLastName = nameParts.slice(1).join(" ") || null;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "El carrito esta vacio" }, { status: 400 });
    }
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: "Metodo de pago invalido" }, { status: 400 });
    }

    const cashSession = await prisma.cashRegisterSession.findFirst({ where: { status: "OPEN" } });
    if (!cashSession) {
      return NextResponse.json({ error: "No hay una caja abierta. Abri la caja antes de cobrar." }, { status: 400 });
    }

    const createdBy = "pos:" + String(token.email || token.id);

    // Si se cargo email del cliente, la venta queda vinculada a su
    // registro de cliente igual que las compras online (no hace falta
    // que tenga cuenta). Si no se cargo email, la venta sigue quedando
    // como venta anonima, sin romper nada del flujo actual.
    const customerId = customerEmail
      ? await upsertCustomerByEmail({
          email: customerEmail,
          firstName: guestFirstName,
          lastName: guestLastName,
          phone: customerPhone,
        })
      : null;

    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData: any[] = [];
      const movementsData: { variantId: string; quantity: number; previousStock: number; newStock: number }[] = [];

      for (const raw of items) {
        const qty = Number(raw.qty);
        if (!raw.variantId || !qty || qty < 1) {
          throw new StockError({ productName: "Item invalido", size: "-", available: 0 });
        }

        const variant = await tx.productVariant.findUnique({
          where: { id: raw.variantId },
          include: { product: { include: { brand: true } } },
        });

        if (!variant || !variant.product.isActive || variant.product.deletedAt) {
          throw new StockError({ productName: "Producto no encontrado", size: "-", available: 0 });
        }

        // Update atomico con guarda de stock: solo descuenta si en este
        // instante hay stock suficiente. Si otra venta ya lo agoto, count === 0.
        const updateResult = await tx.productVariant.updateMany({
          where: { id: variant.id, stock: { gte: qty } },
          data: { stock: { decrement: qty } },
        });

        if (updateResult.count === 0) {
          throw new StockError({
            productName: variant.product.name,
            size: variant.size,
            available: variant.stock,
          });
        }

        const price = Number(variant.product.price);
        subtotal += price * qty;

        orderItemsData.push({
          variantId: variant.id,
          productId: variant.product.id,
          productName: variant.product.name,
          productBrand: variant.product.brand.name,
          size: variant.size,
          unitPrice: price,
          quantity: qty,
        });

        movementsData.push({
          variantId: variant.id,
          quantity: qty,
          previousStock: variant.stock,
          newStock: variant.stock - qty,
        });
      }

      // Cupon (opcional): misma validacion que el checkout online
      let coupon = null;
      let couponDiscount = 0;
      if (couponCode && String(couponCode).trim()) {
        coupon = await tx.coupon.findUnique({ where: { code: String(couponCode).trim().toUpperCase() } });
        if (!coupon || !coupon.isActive) throw new CheckoutError("Cupon invalido");
        if (coupon.validUntil && coupon.validUntil < new Date()) throw new CheckoutError("Cupon expirado");
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new CheckoutError("Cupon sin usos disponibles");
        if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
          throw new CheckoutError("Monto minimo no alcanzado para el cupon");
        }
        couponDiscount = coupon.type === "PERCENTAGE" ? subtotal * (Number(coupon.value) / 100) : Number(coupon.value);
      }

      // El descuento manual se suma al del cupon, pero nunca puede superar el subtotal
      const discountAmount = Math.min(subtotal, couponDiscount + manualDiscountInput);
      const total = subtotal - discountAmount;

      const createdOrder = await tx.order.create({
        data: {
          status: "PAID",
          subtotal,
          discountAmount,
          shippingCost: 0,
          total,
          channel: "POS",
          paymentMethod,
          cashRegisterSessionId: cashSession.id,
          couponId: coupon?.id,
          couponCode: coupon?.code,
          customerId: customerId || undefined,
          guestFirstName,
          guestLastName,
          guestEmail: customerEmail || null,
          guestPhone: customerPhone || null,
          items: { create: orderItemsData },
        },
      });

      if (coupon) {
        await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      }

      for (const m of movementsData) {
        await tx.stockMovement.create({
          data: {
            variantId: m.variantId,
            type: "PURCHASE",
            quantity: -m.quantity,
            previousStock: m.previousStock,
            newStock: m.newStock,
            orderId: createdOrder.id,
            createdBy,
          },
        });
      }

      return createdOrder;
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
    });
  } catch (error: any) {
    if (error instanceof StockError) {
      return NextResponse.json({ error: "Stock insuficiente", detail: error.detail }, { status: 409 });
    }
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error en checkout POS:", error);
    return NextResponse.json({ error: "Error al procesar el cobro" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
