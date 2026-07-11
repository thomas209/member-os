import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { preference } from "@/lib/mercadopago";
import { sendAbandonedCartEmail } from "@/lib/email";

// Corre una vez al dia (limite del plan Hobby de Vercel) via vercel.json.
// Dos cosas:
// 1. A las ordenes ONLINE que quedaron "PENDING" hace mas de REMIND_AFTER_HOURS
//    y todavia no recibieron el recordatorio, les manda un email con un link
//    nuevo de pago (el original de Mercado Pago no se guarda en la orden).
// 2. A las que quedaron "PENDING" hace mas de CANCEL_AFTER_HOURS las marca
//    como CANCELLED, para que no se acumulen carritos abandonados en el
//    panel de pedidos para siempre. No hay que reponer stock: el stock
//    recien se descuenta cuando el pago se aprueba, no al crear la orden.
const REMIND_AFTER_HOURS = 6;
const CANCEL_AFTER_HOURS = 48;
const REMINDER_MARKER = "[reminder_sent]";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== "Bearer " + cronSecret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!cronSecret) {
    console.warn("CRON_SECRET no configurado: este endpoint queda sin proteger");
  }

  const now = Date.now();
  const remindCutoff = new Date(now - REMIND_AFTER_HOURS * 60 * 60 * 1000);
  const cancelCutoff = new Date(now - CANCEL_AFTER_HOURS * 60 * 60 * 1000);

  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  let remindedCount = 0;
  let remindFailedCount = 0;

  try {
    // 1. Recordatorio de pago pendiente
    const toRemind = await prisma.order.findMany({
      where: {
        channel: "ONLINE",
        status: "PENDING",
        createdAt: { lte: remindCutoff, gt: cancelCutoff },
        guestEmail: { not: null },
        NOT: { notes: { contains: REMINDER_MARKER } },
      },
      include: {
        items: {
          include: {
            product: { include: { images: { orderBy: { isPrimary: "desc" }, take: 1 } } },
          },
        },
      },
    });

    for (const order of toRemind) {
      try {
        const mpItems = order.items.map((item) => ({
          id: item.variantId,
          title: item.productName + " - Talle " + item.size,
          quantity: item.quantity,
          unit_price: Number(item.unitPrice),
          currency_id: "ARS" as const,
        }));

        const shippingCost = Number(order.shippingCost);
        if (shippingCost > 0) {
          mpItems.push({
            id: "shipping",
            title: "Envío",
            quantity: 1,
            unit_price: shippingCost,
            currency_id: "ARS" as const,
          });
        }

        const mpPreference = await preference.create({
          body: {
            items: mpItems,
            payer: {
              email: order.guestEmail!,
              name: order.guestFirstName || undefined,
              surname: order.guestLastName || undefined,
            },
            back_urls: {
              success: baseUrl + "/checkout/success?orderId=" + order.id,
              failure: baseUrl + "/checkout?error=payment_failed",
              pending: baseUrl + "/checkout/success?orderId=" + order.id,
            },
            external_reference: order.id,
            notification_url: baseUrl + "/api/webhooks/mercadopago",
          },
        });

        await sendAbandonedCartEmail({
          to: order.guestEmail!,
          firstName: order.guestFirstName || "",
          orderNumber: order.orderNumber,
          items: order.items.map((item) => ({
            productName: item.productName,
            productBrand: item.productBrand,
            size: item.size,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            image: item.product.images[0]?.url ?? null,
          })),
          total: Number(order.total),
          checkoutUrl: mpPreference.init_point!,
        });

        await prisma.order.update({
          where: { id: order.id },
          data: { notes: (order.notes ? order.notes + "\n" : "") + REMINDER_MARKER },
        });

        remindedCount++;
      } catch (err) {
        remindFailedCount++;
        console.error("No se pudo mandar recordatorio de la orden " + order.orderNumber + ":", err);
      }
    }

    // 2. Cancelar pedidos viejos sin pagar
    const cancelled = await prisma.order.updateMany({
      where: {
        channel: "ONLINE",
        status: "PENDING",
        createdAt: { lte: cancelCutoff },
      },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      ok: true,
      reminded: remindedCount,
      remindFailed: remindFailedCount,
      cancelled: cancelled.count,
    });
  } catch (error) {
    console.error("Error en cron de expiracion de ordenes:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;
