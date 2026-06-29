"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Archivar " + name + "? El producto no se mostrara en la tienda.")) return;
    setLoading(true);
    await fetch("/api/admin/products/" + id, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize:"11px",
        fontWeight:"600",
        letterSpacing:"0.08em",
        textTransform:"uppercase",
        color: loading ? "#A3A3A3" : hovered ? "white" : "#DC2626",
        background: loading ? "#F4F4F4" : hovered ? "#DC2626" : "white",
        border: "1px solid",
        borderColor: loading ? "#E8E8E8" : "#DC2626",
        padding:"8px 16px",
        cursor: loading ? "not-allowed" : "pointer",
        transition:"all 0.15s ease",
      }}
    >
      {loading ? "..." : "Archivar"}
    </button>
  );
}
