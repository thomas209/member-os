"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  customerId: string;
  initialNotes: string;
  initialTags: string[];
};

const inputStyle: React.CSSProperties = { width: "100%", padding: "12px", border: "1px solid #D1D1D1", fontSize: "13px", outline: "none", backgroundColor: "white", fontFamily: "inherit" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#737373", marginBottom: "8px" };

export default function CustomerCrmPanel({ customerId, initialNotes, initialTags }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [tagsInput, setTagsInput] = useState(initialTags.join(", "));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const res = await fetch("/api/admin/customers/" + customerId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes, tags }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div style={{ backgroundColor: "white", padding: "24px", border: "1px solid #E8E8E8" }}>
      <h2 style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "20px" }}>CRM interno</h2>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Tags (separados por coma)</label>
        <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="VIP, inactivo" style={inputStyle} />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Notas internas</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ padding: "12px 24px", backgroundColor: saving ? "#E8E8E8" : "#0A0A0A", color: saving ? "#A3A3A3" : "white", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", border: "none", cursor: saving ? "not-allowed" : "pointer" }}
      >
        {saving ? "Guardando..." : "Guardar"}
      </button>
      {saved && <span style={{ marginLeft: "12px", fontSize: "12px", color: "#16A34A" }}>Guardado</span>}
    </div>
  );
}
