import { Marco, Estado, Rotulo, Titulo, Bajada, Boton, Productos, nroPedido, type MailItem } from "./_base";

type ProcessingEmailProps = {
  firstName: string;
  orderNumber: number;
  items: MailItem[];
  // Link a la pagina de seguimiento del pedido en la web
  trackingPageUrl: string;
};

// Sale cuando el pedido pasa a "En proceso" en el admin: le avisa al cliente
// que ya lo estamos preparando (segundo paso de la linea de tiempo).
export default function ProcessingEmail({ firstName, orderNumber, items, trackingPageUrl }: ProcessingEmailProps) {
  const pedido = nroPedido(orderNumber);

  return (
    <Marco pedido={pedido} preview={"Estamos preparando tu pedido " + pedido}>
      <Rotulo>Pedido {pedido} · Preparando</Rotulo>
      <Titulo>Estamos preparando tu pedido</Titulo>
      <Bajada>
        Hola {firstName}, ya estamos preparando el pedido {pedido} para despacharlo. Te avisamos por email apenas salga, con el número de seguimiento.
      </Bajada>

      <Estado paso={1} />

      <Boton href={trackingPageUrl}>Ver estado del pedido</Boton>

      <Rotulo style={{ margin: "32px 0 14px 0" }}>Productos</Rotulo>
      <Productos items={items} />
    </Marco>
  );
}
