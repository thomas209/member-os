import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPromoEmailBatch } from "@/lib/email";

// Envia una campaña de oferta por mail. Protegido por el middleware
// (/api/admin/:path*): solo lo puede disparar el admin logueado.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const message = String(body.message || "").trim();
    const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : undefined;
    const buttonText = body.buttonText ? String(body.buttonText).trim() : undefined;
    const buttonUrl = body.buttonUrl ? String(body.buttonUrl).trim() : undefined;
    const testEmail = body.testEmail ? String(body.testEmail).trim() : "";

    if (!title || !message) {
      return NextResponse.json({ error: "Falta el titulo o el mensaje" }, { status: 400 });
    }

    const content = { title, message, imageUrl, buttonText, buttonUrl };

    // Modo prueba: manda solo al email que cargo el admin, para ver como
    // queda antes de mandarlo a todos los clientes.
    if (testEmail) {
      const result = await sendPromoEmailBatch([{ email: testEmail, firstName: "" }], content);
      return NextResponse.json({ ok: true, mode: "test", ...result });
    }

    const customers = await prisma.customer.findMany({
      where: { email: { not: "" } },
      select: { email: true, firstName: true },
    });

    if (customers.length === 0) {
      return NextResponse.json({ error: "No hay clientes registrados con email" }, { status: 400 });
    }

    const result = await sendPromoEmailBatch(customers, content);
    return NextResponse.json({ ok: true, mode: "campaign", ...result });
  } catch (error) {
    console.error("Error al enviar campaña:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
