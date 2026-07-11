export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CopyButton from "@/components/store/CopyButton";
import { BANK_CBU, BANK_HOLDER, STORE_WHATSAPP_NUMBER } from "@/lib/bankDetails";
import { buildWhatsappLink } from "@/lib/whatsapp";

export default async function TransferInstructionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });

  if (!order || order.paymentMethod !== "TRANSFERENCIA") notFound();

  const total = Number(order.total);
  const orderLabel = "#" + String(order.orderNumber).padStart(4, "0");

  const whatsappMessage =
    "Hola! Te mando el comprobante de la transferencia del pedido " + orderLabel + " por $" + total.toLocaleString("es-AR") + ".";
  const whatsappLink = buildWhatsappLink(STORE_WHATSAPP_NUMBER, whatsappMessage);

  return (
    <div style={{ padding: "56px 24px", backgroundColor: "#FAFAFA", minHeight: "70vh" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <p style={{ fontSize: "12px", color: "#A3A3A3", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>
            Pedido {orderLabel}
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "26px", color: "#0A0A0A" }}>
            Falta un paso: transferí para confirmar tu compra
          </h1>
        </div>

        <div style={{ backgroundColor: "white", border: "1px solid #E8E8E8", padding: "32px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px dashed #E8E8E8" }}>
            <p style={{ fontSize: "13px", color: "#737373" }}>Monto a transferir</p>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "#0A0A0A" }}>${total.toLocaleString("es-AR")}</p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#737373", marginBottom: "8px" }}>CBU</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <p style={{ fontSize: "16px", fontFamily: "monospace", color: "#0A0A0A" }}>{BANK_CBU}</p>
              <CopyButton value={BANK_CBU} />
            </div>
          </div>

          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#737373", marginBottom: "8px" }}>Titular</p>
            <p style={{ fontSize: "14px", color: "#0A0A0A" }}>{BANK_HOLDER}</p>
          </div>
        </div>

        <div style={{ backgroundColor: "#F4F4F4", padding: "20px", marginBottom: "24px" }}>
          <p style={{ fontSize: "13px", color: "#525252", lineHeight: "1.6" }}>
            Una vez que hagas la transferencia, mandanos el comprobante por WhatsApp para confirmar tu pedido lo antes posible. Sin la confirmación, el pedido queda pendiente.
          </p>
        </div>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", width: "100%", boxSizing: "border-box", textAlign: "center", padding: "16px", fontSize: "13px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", backgroundColor: "#16A34A", color: "white", textDecoration: "none", marginBottom: "12px" }}
        >
          Enviar comprobante por WhatsApp
        </a>
        <a
          href="/catalog"
          style={{ display: "block", width: "100%", boxSizing: "border-box", textAlign: "center", padding: "16px", fontSize: "13px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", border: "1px solid #0A0A0A", color: "#0A0A0A", textDecoration: "none" }}
        >
          Seguir viendo el catálogo
        </a>
      </div>
    </div>
  );
}
