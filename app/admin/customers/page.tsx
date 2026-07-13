import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { COUNTED_ORDER_STATUSES } from "@/lib/customerCrm";
import BackfillButton from "./BackfillButton";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      orders: {
        where: { status: { in: COUNTED_ORDER_STATUSES as any } },
        select: { total: true },
      },
    },
  });

  const rows = customers
    .map((c) => ({
      id: c.id,
      name: (c.firstName + " " + c.lastName).trim() || "(sin nombre)",
      email: c.email,
      phone: c.phone,
      tags: c.tags,
      orderCount: c.orders.length,
      totalSpent: c.orders.reduce((acc, o) => acc + Number(o.total), 0),
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <div style={{ padding: "48px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "4px" }}>Clientes</h1>
          <p style={{ fontSize: "13px", color: "#737373" }}>{rows.length} clientes en total</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            href="/admin/campaigns"
            style={{ padding: "10px 18px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", border: "1px solid #0A0A0A", backgroundColor: "#0A0A0A", color: "white", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            Enviar oferta por mail
          </Link>
          <a
            href="/api/admin/customers/export"
            style={{ padding: "10px 18px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", border: "1px solid #D1D1D1", backgroundColor: "white", color: "#0A0A0A", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            Exportar CSV
          </a>
          <BackfillButton />
        </div>
      </div>
      <div style={{ backgroundColor: "white", border: "1px solid #E8E8E8" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E8E8E8" }}>
              {["Cliente", "Email", "Telefono", "Tags", "Pedidos", "Total gastado"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: "#737373" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #F4F4F4" }}>
                <td style={{ padding: "16px", fontSize: "13px", fontWeight: "500" }}>
                  <Link href={"/admin/customers/" + c.id} style={{ color: "#0A0A0A", textDecoration: "none" }}>
                    {c.name}
                  </Link>
                </td>
                <td style={{ padding: "16px", fontSize: "13px", color: "#737373" }}>{c.email}</td>
                <td style={{ padding: "16px", fontSize: "13px", color: "#737373" }}>{c.phone || "-"}</td>
                <td style={{ padding: "16px" }}>
                  {c.tags.length === 0 ? (
                    <span style={{ fontSize: "12px", color: "#D1D1D1" }}>-</span>
                  ) : (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {c.tags.map((tag: string) => (
                        <span key={tag} style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.04em", textTransform: "uppercase", color: "#0A0A0A", backgroundColor: "#F4F4F4", padding: "3px 8px" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: "16px", fontSize: "13px", fontWeight: "600" }}>{c.orderCount}</td>
                <td style={{ padding: "16px", fontSize: "13px", fontWeight: "700" }}>${c.totalSpent.toLocaleString("es-AR")}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "48px", textAlign: "center", fontSize: "14px", color: "#737373" }}>
                  No hay clientes todavia. Si tenes pedidos viejos de invitados, usa "Vincular pedidos antiguos" arriba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
