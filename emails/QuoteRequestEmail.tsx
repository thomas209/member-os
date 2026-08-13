import {
  Body, Container, Head, Heading, Html,
  Img, Link, Preview, Section, Text,
} from "@react-email/components";

type QuoteRequestEmailProps = {
  description: string;
  imageUrl?: string | null;
  productLink?: string | null;
  size?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  adminUrl: string;
};

// Mail interno (a Member Club, no al cliente) cuando el asistente de IA
// del storefront junta una solicitud de cotizacion — foto o link de un
// producto que no esta en el catalogo. Estilo simple, es una notificacion
// operativa, no un mail de marca para el cliente.
export default function QuoteRequestEmail({
  description,
  imageUrl,
  productLink,
  size,
  contactEmail,
  contactPhone,
  adminUrl,
}: QuoteRequestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nueva solicitud de cotizacion desde el asistente</Preview>
      <Body style={{backgroundColor:"#F4F4F4",fontFamily:"Georgia,serif",margin:0,padding:0}}>
        <Container style={{maxWidth:"600px",margin:"0 auto",backgroundColor:"white"}}>

          <Section style={{backgroundColor:"#0A0A0A",padding:"32px 48px",textAlign:"center"}}>
            <Text style={{color:"white",fontSize:"20px",fontWeight:"400",letterSpacing:"0.05em",margin:0}}>
              Member Club — Asistente IA
            </Text>
          </Section>

          <Section style={{padding:"40px 48px"}}>
            <Heading style={{fontSize:"20px",fontWeight:"700",color:"#0A0A0A",marginBottom:"8px"}}>
              Nueva solicitud de cotizacion
            </Heading>
            <Text style={{fontSize:"14px",color:"#525252",marginBottom:"24px"}}>
              Un cliente le pidio al asistente algo que no esta en el catalogo y dejo estos datos:
            </Text>

            <Section style={{backgroundColor:"#F4F4F4",padding:"20px",marginBottom:"20px"}}>
              <Text style={{fontSize:"11px",letterSpacing:"0.15em",textTransform:"uppercase",color:"#737373",margin:"0 0 4px 0"}}>
                Descripcion
              </Text>
              <Text style={{fontSize:"14px",color:"#0A0A0A",margin:0}}>{description}</Text>
            </Section>

            {imageUrl && (
              <Section style={{marginBottom:"20px"}}>
                <Text style={{fontSize:"11px",letterSpacing:"0.15em",textTransform:"uppercase",color:"#737373",margin:"0 0 8px 0"}}>
                  Foto
                </Text>
                <Img src={imageUrl} alt="Producto pedido" width="220" style={{display:"block",border:"1px solid #E8E8E8"}} />
              </Section>
            )}

            {productLink && (
              <Section style={{marginBottom:"20px"}}>
                <Text style={{fontSize:"11px",letterSpacing:"0.15em",textTransform:"uppercase",color:"#737373",margin:"0 0 4px 0"}}>
                  Link
                </Text>
                <Link href={productLink} style={{fontSize:"14px",color:"#0A0A0A"}}>{productLink}</Link>
              </Section>
            )}

            {size && (
              <Section style={{marginBottom:"20px"}}>
                <Text style={{fontSize:"11px",letterSpacing:"0.15em",textTransform:"uppercase",color:"#737373",margin:"0 0 4px 0"}}>
                  Talle
                </Text>
                <Text style={{fontSize:"14px",color:"#0A0A0A",margin:0}}>{size}</Text>
              </Section>
            )}

            <Section style={{marginBottom:"8px"}}>
              <Text style={{fontSize:"11px",letterSpacing:"0.15em",textTransform:"uppercase",color:"#737373",margin:"0 0 4px 0"}}>
                Contacto
              </Text>
              <Text style={{fontSize:"14px",color:"#0A0A0A",margin:0}}>
                {contactEmail || "sin email"}{contactPhone ? " · " + contactPhone : ""}
              </Text>
            </Section>

            <Text style={{fontSize:"12px",color:"#A3A3A3",marginTop:"24px"}}>
              Respondele por mail o WhatsApp con el precio. Registro completo: <Link href={adminUrl} style={{color:"#737373"}}>{adminUrl}</Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
