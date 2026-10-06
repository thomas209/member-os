import { Text } from "@react-email/components";
import { Marco, Estado, Rotulo, Titulo, Bajada, Boton, Panel, Productos, nroPedido, pesos, F, C, type MailItem } from "./_base";

type TransferInstructionsEmailProps = {
  firstName: string;
  orderNumber: number;
  total: number;
  cbu: string;
  holder: string;
  transferUrl: string;
  isReminder?: boolean;
  // Productos del pedido (opcional). Si vienen, se listan abajo.
  items?: MailItem[];
};

// Primer mail de un pedido por transferencia: sale solo apenas se hace el
// pedido, agradece la compra y deja los datos para pagar. El pedido figura
// "esperando el pago" hasta que se confirma desde el admin (ahi sale el
// mail de pago confirmado).
export default function TransferInstructionsEmail({
  firstName,
  orderNumber,
  total,
  cbu,
  holder,
  transferUrl,
  isReminder = false,
  items,
}: TransferInstructionsEmailProps) {
  const orderLabel = nroPedido(orderNumber);

  return (
    <Marco preview={isReminder ? "Todavía no vimos tu transferencia del pedido " + orderLabel : "Recibimos tu pedido " + orderLabel + " — falta la transferencia"}>
      <Rotulo>Pedido {orderLabel} · Esperando el pago</Rotulo>
      <Titulo>{isReminder ? "Todavía te espera tu pedido" : "¡Gracias por tu compra!"}</Titulo>
      <Bajada>
        {isReminder
          ? "Hola " + firstName + ", todavía no recibimos el comprobante de tu transferencia del pedido " + orderLabel + ". Te dejamos los datos de nuevo por si los necesitás."
          : "Hola " + firstName + ", recibimos tu pedido " + orderLabel + ". Para confirmarlo, hacé la transferencia con estos datos y mandanos el comprobante."}
      </Bajada>

      <Estado paso={-1} nota="Apenas veamos la transferencia, lo confirmamos y te avisamos." />

      <Panel style={{ margin: "0 0 28px 0" }}>
        <Rotulo>Monto a transferir</Rotulo>
        <Text style={{ fontFamily: F.titulo, fontSize: "34px", lineHeight: "1.1", fontWeight: 600, letterSpacing: "-0.02em", color: C.negro, margin: "6px 0 20px 0" }}>
          {pesos(total)}
        </Text>
        <Rotulo>CBU</Rotulo>
        <Text style={{ fontFamily: F.mono, fontSize: "16px", lineHeight: "1.4", color: C.negro, margin: "4px 0 16px 0" }}>
          {cbu}
        </Text>
        <Rotulo>Titular</Rotulo>
        <Text style={{ fontSize: "15px", lineHeight: "1.4", fontWeight: 500, color: C.negro, margin: "4px 0 0 0" }}>
          {holder}
        </Text>
      </Panel>

      <Boton href={transferUrl}>Ver instrucciones y mandar comprobante</Boton>

      {items && items.length > 0 && (
        <>
          <Rotulo style={{ margin: "32px 0 14px 0" }}>Productos</Rotulo>
          <Productos items={items} />
        </>
      )}
    </Marco>
  );
}
