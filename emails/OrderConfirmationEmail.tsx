import {
  Body, Container, Head, Heading, Hr, Html, Img,
  Link, Preview, Section, Text, Button, Row, Column
} from "@react-email/components";

type OrderItem = {
  productName: string;
  productBrand: string;
  size: string;
  quantity: number;
  unitPrice: number;
  image?: string | null;
};

type OrderConfirmationEmailProps = {
  firstName: string;
  orderNumber: number;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  receiptUrl: string;
};

export default function OrderConfirmationEmail({
  firstName,
  orderNumber,
  items,
  subtotal,
  discountAmount,
  total,
  receiptUrl,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirmamos tu pedido #{String(orderNumber).padStart(4, "0")}</Preview>
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
              ¡Gracias por tu compra!
            </Heading>
            <Text style={{fontSize:"15px",color:"#525252",marginBottom:"32px"}}>
              Hola {firstName}, confirmamos tu pago y ya estamos preparando el pedido #{String(orderNumber).padStart(4, "0")}. Te avisamos por email apenas lo despachemos.
            </Text>

            {/* Productos */}
            <Text style={{fontSize:"11px",letterSpacing:"0.15em",textTransform:"uppercase",color:"#737373",marginBottom:"16px"}}>
              Productos
            </Text>
            {items.map((item, i) => (
              <Row key={i} style={{marginBottom:"16px",borderBottom:"1px solid #E8E8E8",paddingBottom:"16px"}}>
                <Column style={{width:"80px"}}>
                  {item.image && (
                    <Img src={item.image} width="72" height="90" alt={item.productName} style={{objectFit:"cover"}} />
                  )}
                </Column>
                <Column style={{paddingLeft:"16px"}}>
                  <Text style={{fontSize:"11px",color:"#737373",margin:"0 0 4px 0",textTransform:"uppercase",letterSpacing:"0.08em"}}>{item.productBrand}</Text>
                  <Text style={{fontSize:"14px",fontWeight:"600",color:"#0A0A0A",margin:"0 0 4px 0"}}>{item.productName}</Text>
                  <Text style={{fontSize:"12px",color:"#737373",margin:0}}>Talle {item.size} x {item.quantity}</Text>
                </Column>
                <Column style={{textAlign:"right"}}>
                  <Text style={{fontSize:"14px",fontWeight:"700",color:"#0A0A0A",margin:0}}>
                    ${(item.unitPrice * item.quantity).toLocaleString("es-AR")}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={{borderColor:"#E8E8E8",margin:"24px 0"}} />

            <Row>
              <Column><Text style={{fontSize:"14px",color:"#737373",margin:0}}>Subtotal</Text></Column>
              <Column style={{textAlign:"right"}}><Text style={{fontSize:"14px",color:"#737373",margin:0}}>${subtotal.toLocaleString("es-AR")}</Text></Column>
            </Row>
            {discountAmount > 0 && (
              <Row>
                <Column><Text style={{fontSize:"14px",color:"#737373",margin:"4px 0 0 0"}}>Descuento</Text></Column>
                <Column style={{textAlign:"right"}}><Text style={{fontSize:"14px",color:"#737373",margin:"4px 0 0 0"}}>-${discountAmount.toLocaleString("es-AR")}</Text></Column>
              </Row>
            )}
            <Row>
              <Column><Text style={{fontSize:"18px",fontWeight:"700",color:"#0A0A0A",margin:"12px 0 0 0"}}>Total pagado</Text></Column>
              <Column style={{textAlign:"right"}}><Text style={{fontSize:"18px",fontWeight:"700",color:"#0A0A0A",margin:"12px 0 0 0"}}>${total.toLocaleString("es-AR")}</Text></Column>
            </Row>

            <Section style={{textAlign:"center",marginTop:"32px"}}>
              <Button
                href={receiptUrl}
                style={{backgroundColor:"#0A0A0A",color:"white",padding:"14px 32px",fontSize:"12px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",textDecoration:"none",display:"inline-block"}}
              >
                Ver comprobante
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
