import {
  Body, Container, Head, Heading, Html,
  Link, Preview, Section, Text, Button,
} from "@react-email/components";

type TransferInstructionsEmailProps = {
  firstName: string;
  orderNumber: number;
  total: number;
  cbu: string;
  holder: string;
  transferUrl: string;
  isReminder?: boolean;
};

export default function TransferInstructionsEmail({
  firstName,
  orderNumber,
  total,
  cbu,
  holder,
  transferUrl,
  isReminder = false,
}: TransferInstructionsEmailProps) {
  const orderLabel = "#" + String(orderNumber).padStart(4, "0");

  return (
    <Html>
      <Head />
      <Preview>
        {isReminder ? "Todavía no vimos tu transferencia del pedido " + orderLabel : "Instrucciones para transferir el pedido " + orderLabel}
      </Preview>
      <Body style={{backgroundColor:"#F4F4F4",fontFamily:"Georgia,serif",margin:0,padding:0}}>
        <Container style={{maxWidth:"600px",margin:"0 auto",backgroundColor:"white"}}>

          {/* Header */}
          <Section style={{backgroundColor:"#0A0A0A",padding:"32px 48px",textAlign:"center"}}>
            <Text style={{color:"white",fontSize:"20px",fontWeight:"400",letterSpacing:"0.05em",margin:0}}>
              Member Club
            </Text>
          </Section>

          {/* Body */}
          <Section style={{padding:"48px"}}>
            <Heading style={{fontSize:"24px",fontWeight:"700",color:"#0A0A0A",marginBottom:"8px"}}>
              {isReminder ? "Todavía te espera tu pedido" : "Falta un paso: transferí para confirmar"}
            </Heading>
            <Text style={{fontSize:"15px",color:"#525252",marginBottom:"32px"}}>
              {isReminder
                ? "Hola " + firstName + ", todavía no recibimos el comprobante de tu transferencia del pedido " + orderLabel + ". Te dejamos los datos de nuevo por si los necesitás."
                : "Hola " + firstName + ", para confirmar el pedido " + orderLabel + " necesitamos que hagas la transferencia con estos datos y nos mandes el comprobante."}
            </Text>

            <Section style={{backgroundColor:"#F4F4F4",padding:"24px",marginBottom:"32px"}}>
              <Text style={{fontSize:"11px",letterSpacing:"0.15em",textTransform:"uppercase",color:"#737373",margin:"0 0 8px 0"}}>
                Monto a transferir
              </Text>
              <Text style={{fontSize:"28px",fontWeight:"700",color:"#0A0A0A",margin:"0 0 20px 0"}}>
                ${total.toLocaleString("es-AR")}
              </Text>
              <Text style={{fontSize:"11px",letterSpacing:"0.15em",textTransform:"uppercase",color:"#737373",margin:"0 0 4px 0"}}>
                CBU
              </Text>
              <Text style={{fontSize:"16px",fontFamily:"monospace",color:"#0A0A0A",margin:"0 0 16px 0"}}>
                {cbu}
              </Text>
              <Text style={{fontSize:"11px",letterSpacing:"0.15em",textTransform:"uppercase",color:"#737373",margin:"0 0 4px 0"}}>
                Titular
              </Text>
              <Text style={{fontSize:"14px",color:"#0A0A0A",margin:0}}>
                {holder}
              </Text>
            </Section>

            <Section style={{textAlign:"center"}}>
              <Button
                href={transferUrl}
                style={{backgroundColor:"#0A0A0A",color:"white",padding:"14px 32px",fontSize:"12px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",textDecoration:"none",display:"inline-block"}}
              >
                Ver instrucciones y mandar comprobante
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={{backgroundColor:"#FAFAFA",padding:"24px 48px",borderTop:"1px solid #E8E8E8",textAlign:"center"}}>
            <Text style={{fontSize:"12px",color:"#A3A3A3",margin:"0 0 4px 0"}}>
              Cualquier consulta respondé este email o escribinos por Instagram
            </Text>
            <Link href="https://instagram.com/member_ba" style={{fontSize:"12px",color:"#737373"}}>
              @member_ba
            </Link>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
