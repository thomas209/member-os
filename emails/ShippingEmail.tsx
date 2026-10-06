import { Link, Text } from "@react-email/components";
import { Marco, Estado, Rotulo, Titulo, Bajada, Boton, Panel, Fila, Productos, nroPedido, pesos, F, C, type MailItem } from "./_base";

type ShippingEmailProps = {
  firstName: string;
  orderNumber: number;
  trackingNumber: string;
  items: MailItem[];
  total: number;
  partial?: boolean;
  // Link a la pagina de seguimiento propia (memberclubargentina.com/seguimiento/...).
  // Si no viene, el boton va directo a Andreani como antes.
  trackingPageUrl?: string;
};

export default function ShippingEmail({
  firstName,
  orderNumber,
  trackingNumber,
  items,
  total,
  partial,
  trackingPageUrl,
}: ShippingEmailProps) {
  const andreaniUrl = "https://www.andreani.com/#!/informacionEnvio/" + trackingNumber;
  const trackingUrl = trackingPageUrl || andreaniUrl;
  const pedido = nroPedido(orderNumber);

  return (
    <Marco pedido={pedido} preview={"Tu pedido " + pedido + " fue despachado"}>
      <Rotulo>Pedido {pedido} · En camino</Rotulo>
      <Titulo>Tu pedido fue despachado</Titulo>
      <Bajada style={partial ? { margin: "0 0 8px 0" } : undefined}>
        Hola {firstName}, {partial ? "parte de tu" : "tu"} pedido {pedido} está en camino.
      </Bajada>
      {partial && (
        <Text style={{ fontSize: "14px", lineHeight: "1.5", color: C.gris, margin: "0 0 28px 0" }}>
          El resto de tu pedido se despacha por separado — te avisamos apenas salga.
        </Text>
      )}

      <Estado paso={partial ? 1 : 2} />

      <Panel style={{ margin: "0 0 28px 0", textAlign: "center" }}>
        <Rotulo>Número de seguimiento · Andreani</Rotulo>
        <Text style={{ fontFamily: F.mono, fontSize: "24px", lineHeight: "1.2", fontWeight: 500, color: C.negro, margin: "8px 0 18px 0" }}>
          {trackingNumber}
        </Text>
        <Boton href={trackingUrl}>Seguir mi pedido</Boton>
        {trackingPageUrl && (
          <Text style={{ fontSize: "13px", color: C.suave, margin: "14px 0 0 0" }}>
            o seguilo directo en <Link href={andreaniUrl} style={{ color: "#0066CC", textDecoration: "none" }}>Andreani</Link>
          </Text>
        )}
      </Panel>

      <Rotulo style={{ margin: "0 0 14px 0" }}>Productos</Rotulo>
      <Productos items={items} />

      <Panel style={{ margin: "8px 0 0 0", padding: "8px 22px 18px" }}>
        <Fila label="Total pagado" value={pesos(total)} fuerte />
      </Panel>
    </Marco>
  );
}
