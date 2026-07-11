"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const searchParams = useSearchParams();
  const invalidLink = searchParams.get("error") === "invalid";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(email.trim())) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      await fetch("/api/auth/customer/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div style={{ maxWidth: "440px", margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
        <h1 style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "16px" }}>
          Revisá tu email
        </h1>
        <p style={{ fontSize: "14px", color: "#737373", lineHeight: 1.6 }}>
          Te mandamos un link a <strong style={{ color: "#0A0A0A" }}>{email.trim()}</strong> para entrar a tu cuenta. Vence en 15 minutos.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "440px", margin: "80px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px", paddingBottom: "16px", borderBottom: "1px solid #E8E8E8" }}>
        Mi cuenta
      </h1>
      <p style={{ fontSize: "14px", color: "#737373", margin: "16px 0 24px" }}>
        Ingresá tu email y te mandamos un link para entrar. Sin contraseñas.
      </p>

      {invalidLink && (
        <p style={{ fontSize: "13px", color: "#DC2626", marginBottom: "16px" }}>
          Ese link ya venció o no es válido. Pedí uno nuevo.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#737373", marginBottom: "8px" }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="thomas@example.com"
          style={{ width: "100%", padding: "12px", border: "1px solid #D1D1D1", fontSize: "14px", outline: "none", marginBottom: "16px" }}
        />
        {status === "error" && (
          <p style={{ fontSize: "13px", color: "#DC2626", marginBottom: "16px" }}>Ingresá un email válido</p>
        )}
        <button
          type="submit"
          disabled={status === "sending"}
          style={{
            width: "100%", padding: "16px", backgroundColor: status === "sending" ? "#E8E8E8" : "#0A0A0A",
            color: status === "sending" ? "#A3A3A3" : "white", fontSize: "13px", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase", border: "none", cursor: status === "sending" ? "not-allowed" : "pointer",
          }}
        >
          {status === "sending" ? "Enviando..." : "Enviarme el link"}
        </button>
      </form>
    </div>
  );
}
