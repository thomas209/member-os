import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "Comprobante de compra - Member Club";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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

  const itemCount = order?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const total = order ? Number(order.total).toLocaleString("es-AR") : "";
  const orderNumber = order?.orderNumber ?? "";
  const thumb = order?.items[0]?.product.images[0]?.url;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0A0A0A",
          padding: "64px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <p
              style={{
                fontSize: 20,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "#A3A3A3",
                margin: 0,
                marginBottom: 24,
                fontFamily: "sans-serif",
                fontWeight: 600,
              }}
            >
              Member Club
            </p>
            <p
              style={{
                fontSize: 44,
                color: "#FFFFFF",
                margin: 0,
                fontWeight: 400,
              }}
            >
              ¡Gracias por tu compra!
            </p>
          </div>

          {thumb && (
            <img
              src={thumb}
              width={220}
              height={220}
              style={{ objectFit: "cover", borderRadius: 8, backgroundColor: "#1A1A1A" }}
            />
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "1px solid #262626",
            paddingTop: 32,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <p
              style={{
                fontSize: 16,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "#737373",
                margin: 0,
                marginBottom: 8,
                fontFamily: "sans-serif",
              }}
            >
              Comprobante {orderNumber ? `#${orderNumber}` : ""}
            </p>
            <p
              style={{
                fontSize: 18,
                color: "#D4D4D4",
                margin: 0,
                fontFamily: "sans-serif",
              }}
            >
              {itemCount} {itemCount === 1 ? "producto" : "productos"}
            </p>
          </div>
          <p
            style={{
              fontSize: 56,
              color: "#FFFFFF",
              margin: 0,
              fontWeight: 700,
              fontFamily: "sans-serif",
            }}
          >
            ${total}
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
