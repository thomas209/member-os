export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
};

export default async function CashHistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await prisma.cashRegisterSession.findUnique({
    where: { id },
    include: {
      openedBy: { select: { firstName: true, lastName: true } },
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { select: { quantity: true } } },
      },
    },
  });

  if (!session) notFound();

  const openingAmount = Number(session.openingAmount);
  const totals: Record<string, number> = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 };
  let totalSales = 0;
  for (const o of session.orders) {
    const method = o.paymentMethod || "EFECTIVO";
    const amount = Number(o.total);
    if (method in totals) totals[method] += amount;
    totalSales += amount;
  }
  const expectedCash = openingAmount + totals.EFECTIVO;
  const counted = session.closingAmountCounted !== null ? Number(session.closingAmountCounted) : null;
  const difference = counted !== null ? counted - expectedCash : null;

  return (
    <div style={{ padding: "48px", maxWidth: "900px" }}>
      <a href="/admin/pos/cash-history" style={{ fontSize: "12px", color: "#737373", textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        ← Volver a cierres de caja
      </a>

      <div style={{ marginTop: "12px", marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "4px" }}>
          Caja del {new Date(session.openedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" })}
        </h1>
        <p style={{ fontSize: "13px", color: "#737373" }}>
          Abierta por {session.openedBy.firstName} {session.openedBy.lastName} a las{" "}
          {new Date(session.openedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })}
          {session.closedAt && (
            <>
              {" · Cerrada a las "}
              {new Date(session.closedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })}
            </>
          )}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
        <div style={{ backgroundColor: "white", border: "1px solid #E8E8E8", padding: "20px" }}>
          <h2 style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#737373", marginBottom: "16px" }}>Ventas por metodo</h2>
          {(["EFECTIVO", "TARJETA", "TRANSFERENCIA"] as const).map((m) => (
            <div key={m} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
              <span>{PAYMENT_LABELS[m]}</span>
              <span style={{ fontWeight: "600" }}>${totals[m].toLocaleString("es-AR")}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "700", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #E8E8E8" }}>
            <span>Total ({session.orders.length} ventas)</span>
            <span>${totalSales.toLocaleString("es-AR")}</span>
          </div>
        </div>

        <div style={{ backgroundColor: "white", border: "1px solid #E8E8E8", padding: "20px" }}>
          <h2 style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#737373", marginBottom: "16px" }}>Arqueo de efectivo</h2>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
            <span>Monto inicial</span>
            <span style={{ fontWeight: "600" }}>${openingAmount.toLocaleString("es-AR")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
            <span>Ventas en efectivo</span>
            <span style={{ fontWeight: "600" }}>${totals.EFECTIVO.toLocaleString("es-AR")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
            <span>Efectivo esperado</span>
            <span style={{ fontWeight: "600" }}>${expectedCash.toLocaleString("es-AR")}</span>
          </div>
          {counted !== null ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span>Efectivo contado</span>
                <span style={{ fontWeight: "600" }}>${counted.toLocaleString("es-AR")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "700", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #E8E8E8" }}>
                <span>Diferencia</span>
                <span style={{ color: difference === 0 ? "#16A34A" : "#DC2626" }}>
                  {difference !== null && difference > 0 ? "+" : ""}${(difference ?? 0).toLocaleString("es-AR")}
                </span>
              </div>
            </>
          ) : (
            <p style={{ fontSize: "12px", color: "#D97706", marginTop: "10px" }}>Caja todavia abierta, sin cerrar</p>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "16px", color: "#737373" }}>Ventas del turno</h2>
      <div style={{ backgroundColor: "white", border: "1px solid #E8E8E8" }}>
        {session.orders.map((o) => (
          <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #F4F4F4" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: "600" }}>
                Venta #{o.orderNumber} · {o.items.reduce((s, i) => s + i.quantity, 0)} productos
              </p>
              <p style={{ fontSize: "11px", color: "#737373" }}>
                {new Date(o.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })} · {PAYMENT_LABELS[o.paymentMethod || "EFECTIVO"] || o.paymentMethod}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700" }}>${Number(o.total).toLocaleString("es-AR")}</span>
              <a
                href={"/admin/pos/receipt/" + o.id}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "12px", fontWeight: "600", color: "#0A0A0A", textDecoration: "underline" }}
              >
                Comprobante
              </a>
            </div>
          </div>
        ))}
        {session.orders.length === 0 && (
          <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#737373" }}>
            No hubo ventas en este turno
          </div>
        )}
      </div>
    </div>
  );
}
