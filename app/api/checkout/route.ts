import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { preference } from "@/lib/mercadopago";
import { calculateShippingCost } from "@/lib/shipping";
import { calculateTransferDiscount, BANK_CBU, BANK_HOLDER } from "@/lib/bankDetails";
import { sendTransferInstructionsEmail } from "@/lib/email";
import { getCurrentCustomerId } from "@/lib/customerAuth";
import { upsertCustomerByEmail } from "@/lib/customerCrm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shippingAddress, couponCode } = body;
    const paymentMethod = body.paymentMethod === "TRANSFERENCIA" ? "TRANSFERENCIA" : "MERCADOPAGO";

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "El carrito esta vacio" }, { status: 400 });
    }

    // Validar stock y obtener productos
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: { include: { brand: true } } },
      });

      if (!variant) {
        return NextResponse.json({ error: "Variante no encontrada" }, { status: 400 });
      }

      if (variant.stock < item.quantity) {
        return NextResponse.json({
          error: "Stock insuficiente",
          detail: { productName: variant.product.name, size: variant.size }
        }, { status: 400 });
      }

      const price = Number(variant.product.price);
      subtotal += price * item.quantity;

      orderItems.push({
        variantId: variant.id,
        productId: variant.product.id,
        productName: variant.product.name,
        productBrand: variant.product.brand.name,
        size: variant.size,
        unitPrice: price,
        quantity: item.quantity,
      });
    }

    // Validar cupon (no se combina con el descuento por transferencia)
    let discountAmount = 0;
    let coupon = null;

    if (couponCode && paymentMethod !== "TRANSFERENCIA") {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (!coupon || !coupon.isActive) {
        return NextResponse.json({ error: "Cupon invalido" }, { status: 400 });
      }

      if (coupon.validUntil && coupon.validUntil < new Date()) {
        return NextResponse.json({ error: "Cupon expirado" }, { status: 400 });
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: "Cupon sin usos disponibles" }, { status: 400 });
      }

      if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
        return NextResponse.json({ error: "Monto minimo no alcanzado" }, { status: 400 });
      }

      if (coupon.type === "PERCENTAGE") {
        discountAmount = subtotal * (Number(coupon.value) / 100);
      } else {
        discountAmount = Number(coupon.value);
      }
    }

    if (paymentMethod === "TRANSFERENCIA") {
      discountAmount = calculateTransferDiscount(subtotal);
    }

    const shippingCost = calculateShippingCost(subtotal);
    const total = subtotal - discountAmount + shippingCost;

    // Si hay sesion de cliente, la orden queda vinculada a la cuenta y
    // se actualiza su direccion guardada (la ultima usada). Si compra como
    // invitado pero dejo un email, igual se crea/actualiza su registro de
    // cliente por email (sin loguearlo) para que quede un solo historial
    // por persona en el panel de Clientes. El checkout de invitado sigue
    // funcionando exactamente igual, esto es invisible para el comprador.
    let customerId = await getCurrentCustomerId();
    if (customerId) {
      try {
        await prisma.customer.update({
          where: { id: customerId },
          data: {
            firstName: shippingAddress.firstName || undefined,
            lastName: shippingAddress.lastName || undefined,
            phone: shippingAddress.phone || undefined,
            defaultAddress: shippingAddress,
          },
        });
      } catch (err) {
        console.error("No se pudo actualizar los datos del cliente:", err);
      }
    } else if (shippingAddress.email) {
      customerId = await upsertCustomerByEmail({
        email: shippingAddress.email,
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        phone: shippingAddress.phone,
        defaultAddress: shippingAddress,
      });
    }

    // Crear orden en DB
    const order = await prisma.order.create({
      data: {
        customerId: customerId || undefined,
        guestEmail: shippingAddress.email,
        guestFirstName: shippingAddress.firstName,
        guestLastName: shippingAddress.lastName,
        guestPhone: shippingAddress.phone,
        status: "PENDING",
        paymentMethod,
        subtotal,
        discountAmount,
        shippingCost,
        total,
        couponId: coupon?.id,
        couponCode: paymentMethod === "TRANSFERENCIA" ? null : couponCode?.toUpperCase(),
        shippingAddress,
        items: {
          create: orderItems,
        },
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    // Transferencia bancaria directa: no pasa por Mercado Pago, no hay
    // confirmacion automatica. Se manda a una pantalla con los datos
    // bancarios y el pedido queda PENDING hasta que se confirme a mano
    // desde el admin.
    if (paymentMethod === "TRANSFERENCIA") {
      const transferUrl = baseUrl + "/checkout/transfer/" + order.id;

      if (shippingAddress.email) {
        try {
          await sendTransferInstructionsEmail({
            to: shippingAddress.email,
            firstName: shippingAddress.firstName || "",
            orderNumber: order.orderNumber,
            total,
            cbu: BANK_CBU,
            holder: BANK_HOLDER,
            transferUrl,
          });
        } catch (emailError) {
          console.error("No se pudo enviar el email de instrucciones de transferencia:", emailError);
        }
      }

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        redirectUrl: transferUrl,
      });
    }

    // Crear preferencia en MP
    const mpItems = orderItems.map((item) => ({
      id: item.variantId,
      title: item.productName + " - Talle " + item.size,
      quantity: item.quantity,
      unit_price: Number(item.unitPrice),
      currency_id: "ARS",
    }));

    if (shippingCost > 0) {
      mpItems.push({
        id: "shipping",
        title: "Envío",
        quantity: 1,
        unit_price: shippingCost,
        currency_id: "ARS",
      });
    }

    const mpPreference = await preference.create({
      body: {
        items: mpItems,
        payer: {
          email: shippingAddress.email,
          name: shippingAddress.firstName,
          surname: shippingAddress.lastName,
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

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      checkoutUrl: mpPreference.init_point,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Error al procesar el checkout" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
