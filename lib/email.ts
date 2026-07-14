import { Resend } from "resend";
import ShippingEmail from "@/emails/ShippingEmail";
import OrderConfirmationEmail from "@/emails/OrderConfirmationEmail";
import AbandonedCartEmail from "@/emails/AbandonedCartEmail";
import TransferInstructionsEmail from "@/emails/TransferInstructionsEmail";
import LoginLinkEmail from "@/emails/LoginLinkEmail";
import PromoEmail from "@/emails/PromoEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

// Direccion desde la que salen TODOS los mails del sitio (login, confirmacion
// de compra, despacho, transferencia, campañas). Mientras esta variable no
// este cargada usa el dominio de prueba de Resend (onboarding@resend.dev),
// que SOLO entrega al email del dueño de la cuenta de Resend, nunca a
// clientes reales. Para que llegue de verdad hay que:
// 1) verificar un dominio propio en Resend (Domains > Add Domain),
// 2) cargar los registros DNS que da Resend en Hostinger,
// 3) cargar la variable RESEND_FROM_EMAIL en Vercel, ej:
//    "Member Club <no-reply@memberclubargentina.com>"
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Member Club <onboarding@resend.dev>";

type SendShippingEmailParams = {
  to: string;
  firstName: string;
  orderNumber: number;
  trackingNumber: string;
  items: {
    productName: string;
    productBrand: string;
    size: string;
    quantity: number;
    unitPrice: number;
    image?: string | null;
  }[];
  total: number;
};

export async function sendShippingEmail(params: SendShippingEmailParams) {
  const { to, firstName, orderNumber, trackingNumber, items, total } = params;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Tu pedido #" + String(orderNumber).padStart(4, "0") + " fue despachado",
    react: ShippingEmail({ firstName, orderNumber, trackingNumber, items, total }),
  });

  if (error) {
    console.error("Error enviando email:", error);
    throw new Error("Error al enviar email");
  }

  return data;
}

type SendOrderConfirmationEmailParams = {
  to: string;
  firstName: string;
  orderNumber: number;
  items: {
    productName: string;
    productBrand: string;
    size: string;
    quantity: number;
    unitPrice: number;
    image?: string | null;
  }[];
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  receiptUrl: string;
};

export async function sendOrderConfirmationEmail(params: SendOrderConfirmationEmailParams) {
  const { to, firstName, orderNumber, items, subtotal, discountAmount, shippingCost, total, receiptUrl } = params;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Confirmamos tu pedido #" + String(orderNumber).padStart(4, "0"),
    react: OrderConfirmationEmail({ firstName, orderNumber, items, subtotal, discountAmount, shippingCost, total, receiptUrl }),
  });

  if (error) {
    console.error("Error enviando email de confirmacion:", error);
    throw new Error("Error al enviar email de confirmacion");
  }

  return data;
}

type SendAbandonedCartEmailParams = {
  to: string;
  firstName: string;
  orderNumber: number;
  items: {
    productName: string;
    productBrand: string;
    size: string;
    quantity: number;
    unitPrice: number;
    image?: string | null;
  }[];
  total: number;
  checkoutUrl: string;
};

export async function sendAbandonedCartEmail(params: SendAbandonedCartEmailParams) {
  const { to, firstName, orderNumber, items, total, checkoutUrl } = params;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Tu pedido #" + String(orderNumber).padStart(4, "0") + " todavía te espera",
    react: AbandonedCartEmail({ firstName, orderNumber, items, total, checkoutUrl }),
  });

  if (error) {
    console.error("Error enviando email de carrito abandonado:", error);
    throw new Error("Error al enviar email de carrito abandonado");
  }

  return data;
}

type SendTransferInstructionsEmailParams = {
  to: string;
  firstName: string;
  orderNumber: number;
  total: number;
  cbu: string;
  holder: string;
  transferUrl: string;
  isReminder?: boolean;
};

export async function sendTransferInstructionsEmail(params: SendTransferInstructionsEmailParams) {
  const { to, firstName, orderNumber, total, cbu, holder, transferUrl, isReminder } = params;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: isReminder
      ? "Todavía no vimos tu transferencia del pedido #" + String(orderNumber).padStart(4, "0")
      : "Instrucciones para transferir — pedido #" + String(orderNumber).padStart(4, "0"),
    react: TransferInstructionsEmail({ firstName, orderNumber, total, cbu, holder, transferUrl, isReminder }),
  });

  if (error) {
    console.error("Error enviando email de instrucciones de transferencia:", error);
    throw new Error("Error al enviar email de instrucciones de transferencia");
  }

  return data;
}

type SendLoginLinkEmailParams = {
  to: string;
  loginUrl: string;
};

export async function sendLoginLinkEmail(params: SendLoginLinkEmailParams) {
  const { to, loginUrl } = params;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Tu link para entrar a tu cuenta",
    react: LoginLinkEmail({ loginUrl }),
  });

  if (error) {
    console.error("Error enviando email de login:", error);
    throw new Error("Error al enviar email de login");
  }

  return data;
}

type PromoContent = {
  title: string;
  message: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
};

type PromoRecipient = {
  email: string;
  firstName?: string | null;
};

const PROMO_BATCH_SIZE = 100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Manda una campaña de oferta a una lista de clientes, en lotes de hasta 100
// (limite de la API de batch de Resend), con una pausa corta entre lotes
// para no pasarnos del limite de requests por segundo de la cuenta. Si un
// lote entero falla (ej: from invalido), no corta el resto: sigue con los
// siguientes lotes y al final devuelve cuantos se mandaron bien y cuantos no.
export async function sendPromoEmailBatch(recipients: PromoRecipient[], content: PromoContent) {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < recipients.length; i += PROMO_BATCH_SIZE) {
    const chunk = recipients.slice(i, i + PROMO_BATCH_SIZE);

    try {
      const { data, error } = await resend.batch.send(
        chunk.map((r) => ({
          from: FROM_EMAIL,
          to: r.email,
          subject: content.title,
          react: PromoEmail({
            firstName: r.firstName || undefined,
            imageUrl: content.imageUrl,
            title: content.title,
            message: content.message,
            buttonText: content.buttonText,
            buttonUrl: content.buttonUrl,
          }),
        }))
      );

      if (error) {
        failed += chunk.length;
        errors.push(error.message || "Error desconocido en un lote");
      } else {
        sent += data?.length || chunk.length;
      }
    } catch (err) {
      failed += chunk.length;
      errors.push(err instanceof Error ? err.message : "Error desconocido en un lote");
    }

    // Pausa breve entre lotes para no pasarnos del limite de requests/seg de Resend
    if (i + PROMO_BATCH_SIZE < recipients.length) {
      await sleep(600);
    }
  }

  return { sent, failed, total: recipients.length, errors };
}
