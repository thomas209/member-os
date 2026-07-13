import { prisma } from "@/lib/prisma";

// Estados de pedido que cuentan como compra real (para el total gastado,
// el nivel de socio, etc). Pendientes todavia no se cobraron, cancelados
// y reembolsados no deberian sumar.
export const COUNTED_ORDER_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

type UpsertCustomerByEmailInput = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  defaultAddress?: unknown;
};

// Vincula (o crea) el registro de cliente a partir de un email, sin pedirle
// que tenga cuenta ni que este logueado. Se usa tanto en el checkout de
// invitado como en el POS, para que toda compra con email quede en el
// mismo lugar y el admin tenga un solo registro por cliente, se haya
// logueado alguna vez o no.
export async function upsertCustomerByEmail(input: UpsertCustomerByEmailInput): Promise<string | null> {
  const email = (input.email || "").trim().toLowerCase();
  if (!email) return null;

  try {
    const customer = await prisma.customer.upsert({
      where: { email },
      update: {
        firstName: input.firstName || undefined,
        lastName: input.lastName || undefined,
        phone: input.phone || undefined,
        ...(input.defaultAddress ? { defaultAddress: input.defaultAddress as object } : {}),
      },
      create: {
        email,
        firstName: input.firstName || "",
        lastName: input.lastName || "",
        phone: input.phone || null,
        ...(input.defaultAddress ? { defaultAddress: input.defaultAddress as object } : {}),
      },
    });
    return customer.id;
  } catch (err) {
    console.error("No se pudo vincular el cliente por email:", err);
    return null;
  }
}
