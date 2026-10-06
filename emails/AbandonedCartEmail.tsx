import { Marco, Rotulo, Titulo, Bajada, Boton, Panel, Fila, Productos, nroPedido, pesos, type MailItem } from "./_base";

type AbandonedCartEmailProps = {
  firstName: string;
  orderNumber: number;
  items: MailItem[];
  total: number;
  checkoutUrl: string;
};

export default function AbandonedCartEmail({
  firstName,
  orderNumber,
  items,
  total,
  checkoutUrl,
}: AbandonedCartEmailProps) {
  const pedido = nroPedido(orderNumber);

  return (
    <Marco preview={"Tu pedido " + pedido + " todavía te espera"}>
      <Rotulo>Pedido {pedido} · Sin pagar</Rotulo>
      <Titulo>Todavía podés completar tu compra</Titulo>
      <Bajada>
        Hola {firstName}, notamos que iniciaste el pedido {pedido} pero no llegaste a pagarlo. Te separamos los productos, pero el stock no queda reservado — completá el pago cuando quieras para asegurarlo.
      </Bajada>

      <Productos items={items} />

      <Panel style={{ margin: "8px 0 28px 0", padding: "8px 22px 18px" }}>
        <Fila label="Total" value={pesos(total)} fuerte />
      </Panel>

      <Boton href={checkoutUrl}>Completar mi pago</Boton>
    </Marco>
  );
}
