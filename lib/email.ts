import { Resend } from "resend";
import ShippingEmail from "@/emails/ShippingEmail";
import OrderConfirmationEmail from "@/emails/OrderConfirmationEmail";

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
  total: number;
  receiptUrl: string;
};

export async function sendOrderConfirmationEmail(params: SendOrderConfirmationEmailParams) {
  const { to, firstName, orderNumber, items, subtotal, discountAmount, total, receiptUrl } = params;

  const { data, error } = await resend.emails.send({
    from: "Member Club <onboarding@resend.dev>",
    to,
    subject: "Confirmamos tu pedido #" + String(orderNumber).padStart(4, "0"),
    react: OrderConfirmationEmail({ firstName, orderNumber, items, subtotal, discountAmount, total, receiptUrl }),
  });

  if (error) {
    console.error("Error enviando email de confirmacion:", error);
    throw new Error("Error al enviar email de confirmacion");
  }

  return data;
}
