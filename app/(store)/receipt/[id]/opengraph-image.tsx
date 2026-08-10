import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "Comprobante de compra - Member Club";
// WhatsApp recorta la preview del link en un cuadrado centrado. Usamos un
// lienzo cuadrado para que el ticket ocupe todo el recorte, sin márgenes
// grises de sobra a los costados.
export const size = { width: 1200, height: 1200 };
export const contentType = "image/png";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com";
const LOGO_URL = "https://res.cloudinary.com/dklvmlzds/image/upload/v1783912898/MEMBER_B_1_3_wyfasx.png";

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

function FallbackImage() {
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_URL} width={280} height={280} style={{ objectFit: "contain" }} />
      </div>
    ),
    { ...size }
  );
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

  if (!order) return FallbackImage();

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
  const voided = order.status === "CANCELLED";

  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(`${SITE_URL}/receipt/${order.id}`, {
      margin: 0,
      width: 160,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    });
  } catch {
    qrDataUrl = null;
  }

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
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            width: "100%",
            height: "100%",
            backgroundColor: "#FFFFFF",
            border: "4px solid #0A0A0A",
            boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
            padding: "56px 56px",
            fontSize: 30,
            color: "#0A0A0A",
          }}
        >
          {/* Chip de estado */}
          <div
            style={{
              position: "absolute",
              top: 36,
              right: 36,
              display: "flex",
              backgroundColor: voided ? "#DC2626" : "#0A0A0A",
              color: "#FFFFFF",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              padding: "10px 22px",
              borderRadius: 999,
            }}
          >
            {voided ? "Anulada" : "Pagado"}
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} width={220} height={110} style={{ objectFit: "contain", alignSelf: "center", marginBottom: 8 }} />
          <p style={{ textAlign: "center", color: "#737373", margin: 0, marginBottom: 32, fontSize: 28 }}>
            Comprobante de venta
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "3px dashed #A3A3A3",
              borderBottom: "3px dashed #A3A3A3",
              padding: "24px 0",
              marginBottom: 32,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <p style={{ margin: 0, marginBottom: 8 }}>Venta #{order.orderNumber}</p>
              <p style={{ margin: 0, marginBottom: 8 }}>{dateStr}</p>
              <p style={{ margin: 0 }}>
                Pago: {PAYMENT_LABELS[order.paymentMethod || ""] || order.paymentMethod || "-"}
              </p>
            </div>
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} width={150} height={150} style={{ flexShrink: 0 }} />
            )}
          </div>

          {visibleItems.map((item) => {
            const img = toSatoriSafeImage(item.product.images[0]?.url);
            return (
              <div key={item.id} style={{ display: "flex", gap: 28, marginBottom: 32 }}>
                {img ? (
                  <img src={img} width={150} height={150} style={{ objectFit: "cover", borderRadius: 10 }} />
                ) : (
                  <div style={{ width: 150, height: 150, backgroundColor: "#F0F0F0", borderRadius: 10, display: "flex" }} />
                )}
                <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
                  <p style={{ margin: 0, marginBottom: 12 }}>{item.productName}</p>
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
            <p style={{ margin: 0, marginBottom: 32, color: "#737373", fontSize: 26 }}>
              + {extraCount} producto{extraCount > 1 ? "s" : ""} más
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", borderTop: "3px dashed #A3A3A3", paddingTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 40 }}>
              <span>Total</span>
              <span>${Number(order.total).toLocaleString("es-AR")}</span>
            </div>
          </div>

          <p style={{ textAlign: "center", color: "#A3A3A3", marginTop: 36, marginBottom: 8, fontSize: 26 }}>
            ¡Gracias por tu compra!
          </p>
          <p
            style={{
              textAlign: "center",
              color: "#0A0A0A",
              margin: 0,
              fontSize: 22,
              letterSpacing: 2,
              fontWeight: 600,
            }}
          >
            @member_ba · memberclubargentina.com
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
