import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customerAuth";

// Usado por el checkout (client component) para saber si hay sesion y
// precargar el formulario con los datos guardados.
export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ customer: null });

  return NextResponse.json({
    customer: {
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      defaultAddress: customer.defaultAddress,
    },
  });
}

export const dynamic = "force-dynamic";
