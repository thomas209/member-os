"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch("/api/auth/customer/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
        color: "#737373", background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer", padding: 0,
      }}
    >
      {loading ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
