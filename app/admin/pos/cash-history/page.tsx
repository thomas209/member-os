export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export default async function CashHistoryPage() {
  const sessions = await prisma.cashRegisterSession.findMany({
    orderBy: { openedAt: "desc" },
    take: 60,
    include: {
      openedBy: { select: { firstName: true, lastName: true } },
      orders: { select: { paymentMethod: true, total: true } },
    },
  });

  const rows = sessions.map((s) => {
    const cashSales = s.orders
      .filter((o) => (o.paymentMethod || "EFECTIVO") === "EFECTIVO")
      .reduce((sum, o) => sum + Number(o.total), 0);
    const totalSales = s.orders.reduce((sum, o) => sum + Number(o.total), 0);
    const expectedCash = Number(s.openingAmount) + cashSales;
    const counted = s.closingAmountCounted !== null ? Number(s.closingAmountCounted) : null;
    const difference = counted !== null ? counted - expectedCash : null;

    return {
      id: s.id,
      openedAt: s.openedAt,
      closedAt: s.closedAt,
      openedByName: s.openedBy.firstName + " " + s.openedBy.lastName,
      openingAmount: Number(s.openingAmount),
      totalSales,
      orderCount: s.orders.length,
      expectedCash,
      counted,
      difference,
      status: s.status,
    };
  });

  return (
    <div style={{ padding: "48px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "4px" }}>Cierres de caja</h1>
        <p style={{ fontSize: "13px", color: "#737373" }}>{rows.length} sesiones registradas</p>
      </div>

      <div style={{ backgroundColor: "white", border: "1px solid #E8E8E8" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E8E8E8" }}>
              {["Apertura", "Abierta por", "Monto inicial", "Ventas", "Efectivo esperado", "Efectivo contado", "Diferencia", "Estado", ""].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: "#737373", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #F4F4F4" }}>
                <td style={{ padding: "12px 16px", fontSize: "13px" }}>
                  {new Date(r.openedAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })}
                </td>
                <td style={{ padding: "12px 16px", fontSize: "13px" }}>{r.openedByName}</td>
                <td style={{ padding: "12px 16px", fontSize: "13px" }}>${r.openingAmount.toLocaleString("es-AR")}</td>
                <td style={{ padding: "12px 16px", fontSize: "13px" }}>
                  ${r.totalSales.toLocaleString("es-AR")} <span style={{ color: "#A3A3A3" }}>({r.orderCount})</span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: "13px" }}>${r.expectedCash.toLocaleString("es-AR")}</td>
                <td style={{ padding: "12px 16px", fontSize: "13px" }}>{r.counted !== null ? "$" + r.counted.toLocaleString("es-AR") : "—"}</td>
                <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "700", color: r.difference === null ? "#A3A3A3" : r.difference === 0 ? "#16A34A" : "#DC2626" }}>
                  {r.difference === null ? "—" : (r.difference > 0 ? "+" : "") + "$" + r.difference.toLocaleString("es-AR")}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase",
                    color: r.status === "OPEN" ? "#16A34A" : "#737373",
                    backgroundColor: r.status === "OPEN" ? "#DCFCE7" : "#F4F4F4",
                    padding: "4px 10px", whiteSpace: "nowrap",
                  }}>
                    {r.status === "OPEN" ? "Abierta" : "Cerrada"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <a
                    href={"/admin/pos/cash-history/" + r.id}
                    style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none", color: "#0A0A0A", border: "1px solid #0A0A0A", padding: "6px 12px", whiteSpace: "nowrap" }}
                  >
                    Ver
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ padding: "48px", textAlign: "center", fontSize: "14px", color: "#737373" }}>
            Todavia no hay cierres de caja
          </div>
        )}
      </div>
    </div>
  );
}
