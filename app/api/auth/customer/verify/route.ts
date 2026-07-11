import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionCookieValue, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/customerAuth";

// Se entra acá tocando el botón del email. Valida el token, vincula
// los pedidos de invitado que tenga con ese mismo email (asi el
// historial aparece solo) y deja la sesion armada.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(baseUrl + "/cuenta/ingresar?error=invalid");
  }

  const customer = await prisma.customer.findUnique({ where: { loginToken: token } });

  if (!customer || !customer.loginTokenExpiresAt || customer.loginTokenExpiresAt < new Date()) {
    return NextResponse.redirect(baseUrl + "/cuenta/ingresar?error=invalid");
  }

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customer.id },
      data: { loginToken: null, loginTokenExpiresAt: null },
    }),
    prisma.order.updateMany({
      where: { guestEmail: customer.email, customerId: null },
      data: { customerId: customer.id },
    }),
  ]);

  const response = NextResponse.redirect(baseUrl + "/cuenta");
  response.cookies.set(SESSION_COOKIE, createSessionCookieValue(customer.id), SESSION_COOKIE_OPTIONS);
  return response;
}

export const dynamic = "force-dynamic";
