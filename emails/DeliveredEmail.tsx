import { Text } from "@react-email/components";
import { Marco, Estado, Rotulo, Titulo, Bajada, Boton, Panel, Productos, nroPedido, C, type MailItem } from "./_base";

type DeliveredEmailProps = {
  firstName: string;
  orderNumber: number;
  items: MailItem[];
};

// Sale cuando el pedido se marca como "Entregado" en el admin: cierra el
// recorrido (ultimo paso de la linea de tiempo) e invita a etiquetarnos.
export default function DeliveredEmail({ firstName, orderNumber, items }: DeliveredEmailProps) {
  const pedido = nroPedido(orderNumber);

  return (
    <Marco pedido={pedido} preview={"Tu pedido " + pedido + " ya llegó"}>
      <Rotulo>Pedido {pedido} · Entregado</Rotulo>
      <Titulo>Tu pedido ya llegó</Titulo>
      <Bajada>
        Hola {firstName}, el pedido {pedido} figura como entregado. ¡Que lo disfrutes! Gracias por elegirnos.
      </Bajada>

      <Estado paso={3} />

      <Panel style={{ margin: "0 0 28px 0", textAlign: "center" }}>
        <Rotulo>Mostranos cómo te queda</Rotulo>
        <Text style={{ fontSize: "15px", lineHeight: "1.5", color: C.texto, margin: "8px 0 18px 0" }}>
          Subí una foto o una historia y etiquetanos: nos encanta verlo puesto.
        </Text>
        <Boton href="https://instagram.com/member_ba">Etiquetanos en @member_ba</Boton>
      </Panel>

      <Rotulo style={{ margin: "0 0 14px 0" }}>Productos</Rotulo>
      <Productos items={items} />
    </Marco>
  );
}
