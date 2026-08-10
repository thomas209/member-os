import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "Comprobante de compra - Member Club";
// WhatsApp recorta la preview del link en un cuadrado centrado. Usamos un
// lienzo cuadrado para que el ticket ocupe todo el recorte, sin márgenes
// grises de sobra a los costados.
export const size = { width: 1200, height: 1200 };
export const contentType = "image/png";

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
};

const MAX_ITEMS = 2;

// El generador de imágenes (Satori) no decodifica bien .webp, que es el
// formato en que Cloudinary guarda las fotos de producto. Le pedimos la
// misma imagen en jpg al vuelo.
function toSatoriSafeImage(url: string | null | undefined) {
  if (!url) return url;
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/f_jpg/");
  }
  return url;
}

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
          <p style={{ fontSize: 48, color: "#0A0A0A" }}>Member Club</p>
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
          padding: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#FFFFFF",
            padding: "72px 64px",
            fontSize: 26,
            color: "#0A0A0A",
          }}
        >
          <p style={{ textAlign: "center", fontWeight: 700, fontSize: 40, margin: 0, marginBottom: 8 }}>
            Member Club
          </p>
          <p style={{ textAlign: "center", color: "#737373", margin: 0, marginBottom: 40, fontSize: 26 }}>
            Comprobante de venta
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderTop: "2px dashed #A3A3A3",
              borderBottom: "2px dashed #A3A3A3",
              padding: "20px 0",
              marginBottom: 32,
            }}
          >
            <p style={{ margin: 0, marginBottom: 6 }}>Venta #{order.orderNumber}</p>
            <p style={{ margin: 0, marginBottom: 6 }}>{dateStr}</p>
            <p style={{ margin: 0 }}>
              Pago: {PAYMENT_LABELS[order.paymentMethod || ""] || order.paymentMethod || "-"}
            </p>
          </div>

          {visibleItems.map((item) => {
            const img = toSatoriSafeImage(item.product.images[0]?.url);
            return (
              <div key={item.id} style={{ display: "flex", gap: 24, marginBottom: 28 }}>
                {img ? (
                  <img src={img} width={120} height={120} style={{ objectFit: "cover", borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 120, height: 120, backgroundColor: "#F0F0F0", borderRadius: 8, display: "flex" }} />
                )}
                <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
                  <p style={{ margin: 0, marginBottom: 10 }}>{item.productName}</p>
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
            <p style={{ margin: 0, marginBottom: 28, color: "#737373", fontSize: 22 }}>
              + {extraCount} producto{extraCount > 1 ? "s" : ""} más
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", borderTop: "2px dashed #A3A3A3", paddingTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 32 }}>
              <span>Total</span>
              <span>${Number(order.total).toLocaleString("es-AR")}</span>
            </div>
          </div>

          <p style={{ textAlign: "center", color: "#A3A3A3", marginTop: 32, marginBottom: 0, fontSize: 22 }}>
            ¡Gracias por tu compra!
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
