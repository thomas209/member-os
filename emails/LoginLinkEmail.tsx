import {
  Body, Container, Head, Heading, Html,
  Link, Preview, Section, Text, Button,
} from "@react-email/components";

type LoginLinkEmailProps = {
  loginUrl: string;
};

export default function LoginLinkEmail({ loginUrl }: LoginLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Tu link para entrar a tu cuenta de Member Club</Preview>
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
              Entrá a tu cuenta
            </Heading>
            <Text style={{fontSize:"15px",color:"#525252",marginBottom:"32px"}}>
              Tocá el botón para entrar. El link vence en 15 minutos y se puede usar una sola vez. Si no pediste este email, podés ignorarlo.
            </Text>

            <Section style={{textAlign:"center"}}>
              <Button
                href={loginUrl}
                style={{backgroundColor:"#0A0A0A",color:"white",padding:"14px 32px",fontSize:"12px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",textDecoration:"none",display:"inline-block"}}
              >
                Entrar a mi cuenta
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
