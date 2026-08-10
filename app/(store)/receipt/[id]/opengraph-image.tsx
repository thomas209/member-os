import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "Comprobante de compra - Member Club";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
};

const MAX_ITEMS = 2;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { include: { images: { orderBy: { isPrimary: "desc" }, take: 1 } } },
        },
      },
    },
  });

  if (!order) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F0F0F0",
          }}
        >
          <p style={{ fontSize: 32, color: "#0A0A0A" }}>Member Club</p>
        </div>
      ),
      { ...size }
    );
  }

  const dateStr = new Date(order.createdAt).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const visibleItems = order.items.slice(0, MAX_ITEMS);
  const extraCount = order.items.length - visibleItems.length;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F0F0F0",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 460,
            backgroundColor: "#FFFFFF",
            padding: "32px 36px",
            fontSize: 15,
            color: "#0A0A0A",
          }}
        >
          <p style={{ textAlign: "center", fontWeight: 700, fontSize: 20, margin: 0, marginBottom: 4 }}>
            Member Club
          </p>
          <p style={{ textAlign: "center", color: "#737373", margin: 0, marginBottom: 20, fontSize: 14 }}>
            Comprobante de venta
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderTop: "1px dashed #A3A3A3",
              borderBottom: "1px dashed #A3A3A3",
              padding: "10px 0",
              marginBottom: 16,
            }}
          >
            <p style={{ margin: 0, marginBottom: 2 }}>Venta #{order.orderNumber}</p>
            <p style={{ margin: 0, marginBottom: 2 }}>{dateStr}</p>
            <p style={{ margin: 0 }}>
              Pago: {PAYMENT_LABELS[order.paymentMethod || ""] || order.paymentMethod || "-"}
            </p>
          </div>

          {visibleItems.map((item) => {
            const img = item.product.images[0]?.url;
            return (
              <div key={item.id} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                {img ? (
                  <img src={img} width={56} height={56} style={{ objectFit: "cover", borderRadius: 4 }} />
                ) : (
                  <div style={{ width: 56, height: 56, backgroundColor: "#F0F0F0", borderRadius: 4, display: "flex" }} />
                )}
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <p style={{ margin: 0, marginBottom: 2 }}>{item.productName}</p>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#525252" }}>
                      Talle {item.size} x{item.quantity}
                    </span>
                    <span>${(Number(item.unitPrice) * item.quantity).toLocaleString("es-AR")}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {extraCount > 0 && (
            <p style={{ margin: 0, marginBottom: 14, color: "#737373", fontSize: 13 }}>
              + {extraCount} producto{extraCount > 1 ? "s" : ""} más
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", borderTop: "1px dashed #A3A3A3", paddingTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18 }}>
              <span>Total</span>
              <span>${Number(order.total).toLocaleString("es-AR")}</span>
            </div>
          </div>

          <p style={{ textAlign: "center", color: "#A3A3A3", marginTop: 18, marginBottom: 0, fontSize: 13 }}>
            ¡Gracias por tu compra!
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
