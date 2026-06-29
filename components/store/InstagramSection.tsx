export default function InstagramSection() {
  return (
    <section style={{backgroundColor: "#0A0A0A", padding: "64px 16px", textAlign: "center"}}>
      <p style={{fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "16px"}}>
        Seguinos
      </p>
      <h2 style={{fontSize: "36px", fontWeight: "400", fontFamily: "Georgia, serif", color: "white", letterSpacing: "0.02em", marginBottom: "8px"}}>
        @member_ba
      </h2>
      <p style={{fontSize: "13px", color: "rgba(255,255,255,0.3)", marginBottom: "32px", letterSpacing: "0.02em"}}>
        Novedades, drops y contenido exclusivo
      </p>
      <a
        href="https://instagram.com/member_ba"
        target="_blank"
        rel="noopener noreferrer"
        style={{display: "inline-block", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "14px 40px", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none"}}
      >
        Seguir en Instagram
      </a>
    </section>
  );
}
