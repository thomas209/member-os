import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const PAYMENT_METHODS = ["EFECTIVO", "TARJETA", "TRANSFERENCIA"];

class StockError extends Error {
  detail: { productName: string; size: string; available: number };
  constructor(detail: { productName: string; size: string; available: number }) {
    super("Stock insuficiente");
    this.detail = detail;
  }
}

// Cobra el carrito del POS: crea la orden, descuenta stock de forma
// atomica (evita vender de mas si dos cajas tocan la misma variante
// al mismo tiempo) y registra el movimiento de stock.
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { items, paymentMethod } = body;

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

      const createdOrder = await tx.order.create({
        data: {
          status: "PAID",
          subtotal,
          discountAmount: 0,
          shippingCost: 0,
          total: subtotal,
          channel: "POS",
          paymentMethod,
          cashRegisterSessionId: cashSession.id,
          items: { create: orderItemsData },
        },
      });

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
    console.error("Error en checkout POS:", error);
    return NextResponse.json({ error: "Error al procesar el cobro" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
