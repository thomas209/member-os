// Piezas compartidas por todos los mails de la tienda.
// Mismo lenguaje que la web: fondo claro, tarjeta redondeada, titulos en
// grotesca con letras apretadas, rotulos en monoespaciada mayuscula, fotos
// redondeadas y botones pastilla. Un solo lugar para cambiar el estilo.
//
// Ojo con los mails: no hay CSS externo ni clases, todo va en linea. Las
// tipografias de la web (Instrument Sans, DM Mono, Inter) se cargan desde
// Google Fonts y se ven en Apple Mail / iPhone; Gmail usa la de reemplazo
// (Helvetica / Arial), que es de la misma familia.
import type { CSSProperties, ReactNode } from "react";
import {
  Body, Container, Head, Html, Img, Link, Preview, Section, Text, Button, Row, Column,
} from "@react-email/components";

export const LOGO_URL = "https://res.cloudinary.com/dklvmlzds/image/upload/v1783912898/MEMBER_B_1_3_wyfasx.png";

export const F = {
  titulo: "'Instrument Sans','Helvetica Neue',Helvetica,Arial,sans-serif",
  texto: "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
  mono: "'DM Mono',ui-monospace,'SF Mono',Menlo,Consolas,monospace",
};

export const C = {
  negro: "#0A0A0A",
  texto: "#525252",
  gris: "#737373",
  suave: "#6E6E73",
  linea: "#EDEDED",
  panel: "#F5F5F7",
  foto: "#F4F4F4",
};

// Animaciones del estado del pedido (las mismas ideas que la pagina de
// seguimiento: la linea se llena, los pasos aparecen y el paso actual late).
// Se ven en el Mail del iPhone y de Mac. Gmail y Outlook las ignoran y
// muestran el estado fijo, que es exactamente el mismo dibujo ya terminado.
const ANIMACIONES = `
@keyframes mcCrece { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes mcAparece { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes mcLate { 0% { box-shadow: 0 0 0 0 rgba(10,10,10,0.38); } 100% { box-shadow: 0 0 0 11px rgba(10,10,10,0); } }
.mc-linea { transform-origin: left center; animation: mcCrece 0.3s ease-out both; }
.mc-punto { animation: mcAparece 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
.mc-actual { animation: mcAparece 0.4s cubic-bezier(0.34,1.56,0.64,1) both, mcLate 1.8s ease-out infinite; }
@media (prefers-reduced-motion: reduce) { .mc-linea, .mc-punto, .mc-actual { animation: none; } }
`;

export const nroPedido = (n: number) => "#" + String(n).padStart(4, "0");
export const pesos = (n: number) => "$" + n.toLocaleString("es-AR");

export type MailItem = {
  productName: string;
  productBrand: string;
  size: string;
  quantity: number;
  unitPrice: number;
  image?: string | null;
  isEncargo?: boolean;
};

// Marco de todos los mails: fondo gris claro, tarjeta blanca redondeada,
// logo arriba como en la barra de la web y pie con el contacto.
export function Marco({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="es">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <style dangerouslySetInnerHTML={{ __html: ANIMACIONES }} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@500;600&family=Inter:wght@400;500&display=swap"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: C.panel, fontFamily: F.texto, margin: 0, padding: "24px 12px" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", backgroundColor: "#FFFFFF", borderRadius: "28px", overflow: "hidden" }}>
          <Section style={{ padding: "22px 28px", borderBottom: "1px solid " + C.linea, textAlign: "center" }}>
            <Img src={LOGO_URL} height="24" alt="Member Club" style={{ display: "block", margin: "0 auto", height: "24px", width: "auto" }} />
          </Section>

          <Section style={{ padding: "32px 28px 36px" }}>{children}</Section>
        </Container>

        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "22px 28px 8px", textAlign: "center" }}>
          <Text style={{ fontSize: "13px", lineHeight: "1.5", color: C.suave, margin: "0 0 6px 0" }}>
            Cualquier consulta respondé este email o escribinos por Instagram
          </Text>
          <Link href="https://instagram.com/member_ba" style={{ fontSize: "13px", color: C.negro, textDecoration: "none", fontWeight: 500 }}>
            @member_ba
          </Link>
          <Text style={{ fontFamily: F.mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#A3A3A3", margin: "18px 0 0 0" }}>
            Member Club · Pinamar
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Rotulo corto en mayusculas (la "voz de etiqueta" de la tienda)
export function Rotulo({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <Text style={{ fontFamily: F.mono, fontSize: "11px", lineHeight: "1.4", letterSpacing: "0.1em", textTransform: "uppercase", color: C.gris, margin: 0, ...style }}>
      {children}
    </Text>
  );
}

export function Titulo({ children }: { children: ReactNode }) {
  return (
    <Text style={{ fontFamily: F.titulo, fontSize: "30px", lineHeight: "1.1", fontWeight: 600, letterSpacing: "-0.02em", color: C.negro, margin: "10px 0 12px 0" }}>
      {children}
    </Text>
  );
}

export function Bajada({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <Text style={{ fontSize: "16px", lineHeight: "1.5", color: C.texto, margin: "0 0 28px 0", ...style }}>
      {children}
    </Text>
  );
}

// Boton pastilla, igual que el de "Finalizar compra"
export function Boton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ textAlign: "center" }}>
      <Button
        href={href}
        style={{ backgroundColor: C.negro, color: "#FFFFFF", borderRadius: "999px", padding: "17px 34px", fontFamily: F.texto, fontSize: "16px", fontWeight: 500, textDecoration: "none", display: "inline-block" }}
      >
        {children}
      </Button>
    </Section>
  );
}

// Bloque gris redondeado (como el resumen del checkout)
export function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <Section style={{ backgroundColor: C.panel, borderRadius: "22px", padding: "20px 22px", ...style }}>
      {children}
    </Section>
  );
}

// Fila "concepto ......... valor" dentro de un panel
export function Fila({ label, value, fuerte }: { label: string; value: string; fuerte?: boolean }) {
  const base = fuerte
    ? { fontSize: "17px", fontWeight: 600, color: C.negro, margin: "12px 0 0 0" }
    : { fontSize: "14px", color: C.suave, margin: "0 0 6px 0" };
  return (
    <Row>
      <Column>
        <Text style={{ ...base, fontFamily: fuerte ? F.titulo : F.texto }}>{label}</Text>
      </Column>
      <Column style={{ textAlign: "right" }}>
        <Text style={{ ...base, fontFamily: F.titulo, fontSize: fuerte ? "20px" : "14px", color: fuerte ? C.negro : C.texto }}>{value}</Text>
      </Column>
    </Row>
  );
}

// Lista de productos: foto redondeada, marca en rotulo, nombre y precio
export function Productos({ items }: { items: MailItem[] }) {
  return (
    <>
      {items.map((item, i) => (
        <Row key={i} style={{ marginBottom: "16px" }}>
          <Column style={{ width: "76px", verticalAlign: "top" }}>
            {item.image ? (
              <Img src={item.image} width="76" height="95" alt={item.productName} style={{ display: "block", borderRadius: "14px", backgroundColor: C.foto, objectFit: "cover" }} />
            ) : (
              <div style={{ width: "76px", height: "95px", borderRadius: "14px", backgroundColor: C.foto }} />
            )}
          </Column>
          <Column style={{ paddingLeft: "14px", paddingRight: "8px", verticalAlign: "middle" }}>
            <Rotulo style={{ fontSize: "10px", margin: "0 0 4px 0" }}>{item.productBrand}</Rotulo>
            <Text style={{ fontSize: "15px", lineHeight: "1.3", fontWeight: 500, color: C.negro, margin: "0 0 4px 0" }}>{item.productName}</Text>
            <Text style={{ fontSize: "13px", lineHeight: "1.4", color: C.gris, margin: 0 }}>
              Talle {item.size} · x{item.quantity}{item.isEncargo ? " · Por encargo" : ""}
            </Text>
          </Column>
          <Column style={{ width: "96px", textAlign: "right", verticalAlign: "middle" }}>
            <Text style={{ fontFamily: F.titulo, fontSize: "15px", fontWeight: 500, color: C.negro, margin: 0 }}>
              {pesos(item.unitPrice * item.quantity)}
            </Text>
          </Column>
        </Row>
      ))}
    </>
  );
}

// Linea de tiempo del pedido, igual a la de la pagina de seguimiento:
// Confirmado > Preparando > Despachado > Entregado.
// paso = en que paso esta el pedido (0 a 3). -1 = todavia esperando el pago.
const PASOS = ["Confirmado", "Preparando", "Despachado", "Entregado"];

export function Estado({ paso, nota }: { paso: number; nota?: string }) {
  // Cada tramo y cada punto arranca un toque despues que el anterior, asi la
  // linea "avanza" de izquierda a derecha hasta el paso actual.
  const espera = (orden: number) => (0.3 + orden * 0.14).toFixed(2) + "s";
  const fino = { height: "2px", lineHeight: "2px", fontSize: "1px" };
  const linea = (on: boolean, visible: boolean, orden: number) => (
    <td style={{ verticalAlign: "middle", padding: 0 }}>
      <div style={{ ...fino, backgroundColor: visible ? "#E8E8E8" : "transparent" }}>
        {visible && on ? (
          <div className="mc-linea" style={{ ...fino, backgroundColor: C.negro, animationDelay: espera(orden) }}>&nbsp;</div>
        ) : (
          <>&nbsp;</>
        )}
      </div>
    </td>
  );
  return (
    <Section style={{ border: "1px solid " + C.linea, borderRadius: "22px", padding: "20px 6px 16px", margin: "0 0 28px 0" }}>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
        <tbody>
          <tr>
            {PASOS.map((nombre, i) => {
              const hecho = i < paso || (i === paso && paso === PASOS.length - 1);
              const actual = i === paso && !hecho;
              return (
                <td key={nombre} style={{ width: "25%", padding: 0, textAlign: "center", verticalAlign: "top" }}>
                  <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        {linea(i <= paso, i > 0, i * 3 - 1)}
                        <td style={{ width: "22px", padding: 0 }}>
                          <div
                            className={hecho ? "mc-punto" : actual ? "mc-actual" : undefined}
                            style={{
                              animationDelay: hecho || actual ? espera(i * 3) : undefined,
                              width: "22px", height: "22px", lineHeight: "22px", borderRadius: "999px", boxSizing: "border-box",
                              textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#FFFFFF",
                              backgroundColor: hecho ? C.negro : "#FFFFFF",
                              border: hecho ? "none" : actual ? "7px solid " + C.negro : "2px solid #D4D4D4",
                            }}
                          >
                            {hecho ? "✓" : ""}
                          </div>
                        </td>
                        {linea(i < paso, i < PASOS.length - 1, i * 3 + 1)}
                      </tr>
                    </tbody>
                  </table>
                  <Text style={{ fontSize: "10px", lineHeight: "1.3", fontWeight: actual ? 600 : 500, color: hecho || actual ? C.negro : "#A3A3A3", margin: "10px 0 0 0" }}>
                    {nombre}
                  </Text>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      {nota && (
        <Text style={{ fontSize: "13px", lineHeight: "1.4", color: C.suave, textAlign: "center", margin: "14px 0 0 0" }}>{nota}</Text>
      )}
    </Section>
  );
}
