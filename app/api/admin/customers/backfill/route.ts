import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upsertCustomerByEmail } from "@/lib/customerCrm";

// Uso unico (pero seguro de correr mas de una vez): crea un registro de
// Cliente para cada email de pedidos viejos que todavia no tenga uno
// (de antes de que el checkout empezara a vincular todo solo), y les
// pega sus pedidos. No hace nada con los pedidos que ya estan vinculados.
export async function POST() {
  try {
    const orphanOrders = await prisma.order.findMany({
      where: { customerId: null, guestEmail: { not: null } },
      distinct: ["guestEmail"],
      select: { guestEmail: true, guestFirstName: true, guestLastName: true, guestPhone: true },
    });

    let ordersLinked = 0;
    let customersTouched = 0;

    for (const o of orphanOrders) {
      if (!o.guestEmail) continue;
      const customerId = await upsertCustomerByEmail({
        email: o.guestEmail,
        firstName: o.guestFirstName,
        lastName: o.guestLastName,
        phone: o.guestPhone,
      });
      if (!customerId) continue;
      customersTouched++;

      const result = await prisma.order.updateMany({
        where: { guestEmail: o.guestEmail, customerId: null },
        data: { customerId },
      });
      ordersLinked += result.count;
    }

    return NextResponse.json({ ok: true, customersTouched, ordersLinked });
  } catch (error) {
    console.error("Error en backfill de clientes:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
