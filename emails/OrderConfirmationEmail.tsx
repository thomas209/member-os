import { Marco, Estado, Rotulo, Titulo, Bajada, Boton, Panel, Fila, Productos, nroPedido, pesos, type MailItem } from "./_base";

type OrderConfirmationEmailProps = {
  firstName: string;
  orderNumber: number;
  items: MailItem[];
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  receiptUrl: string;
  // true cuando el pago fue por transferencia: el cliente ya recibio el
  // "gracias por tu compra" al hacer el pedido, asi que este mail avisa
  // que el pago quedo confirmado.
  porTransferencia?: boolean;
};

export default function OrderConfirmationEmail({
  firstName,
  orderNumber,
  items,
  subtotal,
  discountAmount,
  shippingCost,
  total,
  receiptUrl,
  porTransferencia = false,
}: OrderConfirmationEmailProps) {
  const pedido = nroPedido(orderNumber);

  return (
    <Marco preview={(porTransferencia ? "Recibimos tu pago del pedido " : "Confirmamos tu pedido ") + pedido}>
      <Rotulo>Pedido {pedido} · Confirmado</Rotulo>
      <Titulo>{porTransferencia ? "Recibimos tu pago" : "¡Gracias por tu compra!"}</Titulo>
      <Bajada>
        Hola {firstName}, {porTransferencia ? "ya vimos tu transferencia" : "confirmamos tu pago"} y ya estamos preparando el pedido {pedido}. Te avisamos por email apenas lo despachemos.
      </Bajada>

      <Estado paso={0} />

      <Rotulo style={{ margin: "0 0 14px 0" }}>Productos</Rotulo>
      <Productos items={items} />

      <Panel style={{ margin: "8px 0 28px 0" }}>
        <Fila label="Subtotal" value={pesos(subtotal)} />
        {discountAmount > 0 && <Fila label="Descuento" value={"-" + pesos(discountAmount)} />}
        <Fila label="Envío" value={shippingCost === 0 ? "Gratis" : pesos(shippingCost)} />
        <Fila label="Total pagado" value={pesos(total)} fuerte />
      </Panel>

      <Boton href={receiptUrl}>Ver comprobante</Boton>
    </Marco>
  );
}
