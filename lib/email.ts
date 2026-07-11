import { Resend } from "resend";
import ShippingEmail from "@/emails/ShippingEmail";
import OrderConfirmationEmail from "@/emails/OrderConfirmationEmail";
import AbandonedCartEmail from "@/emails/AbandonedCartEmail";
import TransferInstructionsEmail from "@/emails/TransferInstructionsEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    from: "Member Club <onboarding@resend.dev>",
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
    from: "Member Club <onboarding@resend.dev>",
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
    from: "Member Club <onboarding@resend.dev>",
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
    from: "Member Club <onboarding@resend.dev>",
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
