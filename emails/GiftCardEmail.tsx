import { Text } from "@react-email/components";
import { Marco, Rotulo, Titulo, Bajada, Boton, Panel, C, F, pesos } from "./_base";

type GiftCardEmailProps = {
  firstName: string;
  code: string;
  percent: number;
  minAmount?: number | null;
  validUntil: Date;
};

// Gift card por comentar en Instagram. Diseño provisorio de la tarjeta:
// se reemplaza por el diseño final cuando Tommy lo pase.
export default function GiftCardEmail({ firstName, code, percent, minAmount, validUntil }: GiftCardEmailProps) {
  const vence = validUntil.toLocaleDateString("es-AR", { day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" });
  return (
    <Marco preview={"Tu gift card de " + percent + "% OFF para tu primera compra"}>
      <Rotulo>Gift card</Rotulo>
      <Titulo>{firstName ? firstName + ", acá" : "Acá"} está tu gift card</Titulo>
      <Bajada>Gracias por comentar. Usala en tu primera compra en la web pagando por transferencia.</Bajada>

      <table role="presentation" width="100%" style={{ borderCollapse: "collapse", margin: "0 0 24px 0" }}>
        <tbody><tr><td style={{ backgroundColor: "#F6F0E4", borderRadius: "24px", padding: "10px" }}>
          <table role="presentation" width="100%" style={{ borderCollapse: "separate", border: "1.5px solid #111111", borderRadius: "16px" }}>
            <tbody><tr><td style={{ padding: "28px 20px", textAlign: "center" }}>
              <Text style={{ fontFamily: F.mono, fontSize: "11px", letterSpacing: "0.22em", color: C.negro, margin: 0 }}>MEMBER CLUB · GIFT CARD</Text>
              <Text style={{ fontFamily: F.titulo, fontSize: "56px", fontWeight: 600, letterSpacing: "-0.03em", color: C.negro, margin: "10px 0 6px", lineHeight: "1" }}>{percent}% OFF</Text>
              <Text style={{ fontFamily: F.mono, fontSize: "11px", letterSpacing: "0.18em", color: C.negro, margin: 0 }}>EN TU PRIMERA COMPRA</Text>
            </td></tr></tbody>
          </table>
        </td></tr></tbody>
      </table>

      <Panel style={{ margin: "0 0 24px 0", textAlign: "center" }}>
        <Rotulo>Tu código</Rotulo>
        <Text style={{ fontFamily: F.mono, fontSize: "26px", letterSpacing: "0.12em", color: C.negro, margin: "8px 0 4px", fontWeight: 600 }}>{code}</Text>
        <Text style={{ fontSize: "13px", color: C.gris, margin: 0 }}>Pegalo en el checkout, en "Cupón", eligiendo pagar por transferencia.</Text>
      </Panel>

      <Text style={{ fontSize: "13px", lineHeight: "1.6", color: C.texto, margin: "0 0 24px 0" }}>
        · Válida hasta el {vence}.<br />
        · Solo pagando por transferencia{minAmount ? ", en compras desde " + pesos(minAmount) : ""}.<br />
        · Un solo uso, para tu primera compra y con este mismo email.<br />
        · No se suma al descuento por transferencia.
      </Text>

      <Boton href={(process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com") + "/catalog"}>Ir a la tienda</Boton>
    </Marco>
  );
}
