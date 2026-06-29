"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { setError("Completa todos los campos"); return; }
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email, password, redirect: false,
    });
    if (result?.error) {
      setError("Email o password incorrecto");
      setLoading(false);
    } else {
      router.push("/admin/orders");
    }
  };

  return (
    <div style={{minHeight:"100vh",backgroundColor:"#0A0A0A",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"400px",backgroundColor:"white",padding:"48px"}}>
        <p style={{fontSize:"11px",letterSpacing:"0.15em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>Member OS</p>
        <h1 style={{fontSize:"24px",fontWeight:"700",letterSpacing:"-0.02em",marginBottom:"40px"}}>Backoffice</h1>

        <div style={{marginBottom:"16px"}}>
          <label style={{display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@memberclub.com"
            style={{width:"100%",padding:"12px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none"}}
          />
        </div>

        <div style={{marginBottom:"24px"}}>
          <label style={{display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>Password</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{width:"100%",padding:"12px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none"}}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {error && <p style={{fontSize:"13px",color:"#DC2626",marginBottom:"16px"}}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading}
          style={{width:"100%",padding:"14px",backgroundColor:loading?"#E8E8E8":"#0A0A0A",color:loading?"#A3A3A3":"white",fontSize:"13px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",border:"none",cursor:loading?"not-allowed":"pointer"}}>
          {loading ? "Entrando..." : "Ingresar"}
        </button>
      </div>
    </div>
  );
}
