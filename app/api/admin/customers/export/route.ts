import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COUNTED_ORDER_STATUSES } from "@/lib/customerCrm";

// Exporta el listado de clientes a CSV (para listas de difusion de WhatsApp
// Business, importar a otra herramienta, etc). Protegido por el middleware.
function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          where: { status: { in: COUNTED_ORDER_STATUSES as any } },
          select: { total: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const header = ["Nombre", "Email", "Telefono", "Tags", "Pedidos", "Total gastado"];
    const lines = [header.join(",")];

    for (const c of customers) {
      const name = (c.firstName + " " + c.lastName).trim();
      const totalSpent = c.orders.reduce((acc, o) => acc + Number(o.total), 0);
      const row = [
        csvEscape(name),
        csvEscape(c.email),
        csvEscape(c.phone || ""),
        csvEscape((c.tags || []).join("; ")),
        String(c.orders.length),
        totalSpent.toFixed(2),
      ];
      lines.push(row.join(","));
    }

    const csv = "﻿" + lines.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="clientes.csv"',
      },
    });
  } catch (error) {
    console.error("Error al exportar clientes:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
