import {
  Body, Container, Head, Heading, Html,
  Img, Link, Preview, Section, Text, Button,
} from "@react-email/components";

type PromoEmailProps = {
  firstName?: string;
  imageUrl?: string;
  title: string;
  message: string;
  buttonText?: string;
  buttonUrl?: string;
};

export default function PromoEmail({
  firstName,
  imageUrl,
  title,
  message,
  buttonText,
  buttonUrl,
}: PromoEmailProps) {
  // El mensaje se carga como texto libre desde el admin; los saltos de
  // linea se respetan como parrafos separados.
  const paragraphs = message.split("\n").filter((p) => p.trim().length > 0);

  // Mismo isotipo "M" que se usa como favicon/icono del sitio, hosteado en
  // /public para que los clientes de mail puedan cargarlo por URL.
  const logoUrl = (process.env.NEXT_PUBLIC_URL || "http://localhost:3000") + "/icon-512.png";

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={{ backgroundColor: "#F4F4F4", fontFamily: "Georgia,serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white" }}>

          {/* Header */}
          <Section style={{ backgroundColor: "#0A0A0A", padding: "28px 48px", textAlign: "center" }}>
            <table role="presentation" style={{ margin: "0 auto", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ backgroundColor: "white", borderRadius: "8px", padding: "10px 14px", lineHeight: 0 }}>
                    <Img src={logoUrl} width="26" height="26" alt="Member Club" style={{ display: "block" }} />
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Imagen destacada (opcional) */}
          {imageUrl && (
            <Img src={imageUrl} alt={title} width="600" style={{ width: "100%", height: "auto", display: "block" }} />
          )}

          {/* Body */}
          <Section style={{ padding: "48px" }}>
            <Heading style={{ fontSize: "24px", fontWeight: "700", color: "#0A0A0A", marginBottom: "8px" }}>
              {title}
            </Heading>
            {firstName && (
              <Text style={{ fontSize: "15px", color: "#525252", marginBottom: "8px" }}>
                Hola {firstName}!
              </Text>
            )}
            {paragraphs.map((p, i) => (
              <Text key={i} style={{ fontSize: "15px", color: "#525252", marginBottom: "16px" }}>
                {p}
              </Text>
            ))}

            {buttonText && buttonUrl && (
              <Section style={{ textAlign: "center", marginTop: "24px" }}>
                <Button
                  href={buttonUrl}
                  style={{ backgroundColor: "#0A0A0A", color: "white", padding: "14px 32px", fontSize: "12px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", display: "inline-block" }}
                >
                  {buttonText}
                </Button>
              </Section>
            )}
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: "#FAFAFA", padding: "24px 48px", borderTop: "1px solid #E8E8E8", textAlign: "center" }}>
            <Text style={{ fontSize: "12px", color: "#A3A3A3", margin: "0 0 4px 0" }}>
              Cualquier consulta respondé este email o escribinos por Instagram
            </Text>
            <Link href="https://instagram.com/member_ba" style={{ fontSize: "12px", color: "#737373" }}>
              @member_ba
            </Link>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
