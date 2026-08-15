import {
  Body, Container, Head, Heading, Html,
  Img, Link, Preview, Section, Text, Button,
} from "@react-email/components";

const LOGO_URL = "https://res.cloudinary.com/dklvmlzds/image/upload/v1783912898/MEMBER_B_1_3_wyfasx.png";

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
          <Section style={{backgroundColor:"#0A0A0A",padding:"28px 48px",textAlign:"center"}}>
            <table role="presentation" style={{margin:"0 auto",borderCollapse:"collapse"}}>
              <tbody>
                <tr>
                  <td style={{backgroundColor:"white",borderRadius:"14px",padding:"14px 18px",lineHeight:0}}>
                    <Img src={LOGO_URL} height="32" alt="Member Club" style={{display:"block",margin:"0 auto",height:"32px",width:"auto"}} />
                  </td>
                </tr>
              </tbody>
            </table>
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
