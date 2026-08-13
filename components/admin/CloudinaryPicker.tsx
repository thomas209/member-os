"use client";
import { useEffect, useState } from "react";

type CloudinaryImage = {
  publicId: string;
  url: string;
  width: number;
  height: number;
};

type Props = {
  onSelect: (urls: string[]) => void;
  onClose: () => void;
};

// Selector de imagenes YA subidas a Cloudinary, para no tener que
// descargarlas y volver a subirlas por el flujo de siempre. Componente
// nuevo, independiente — no modifica ImageUpload.tsx mas que en el
// boton que lo abre.
export default function CloudinaryPicker({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const search = async (q: string, cursor?: string | null) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (cursor) params.set("next_cursor", cursor);
      const res = await fetch("/api/admin/cloudinary-search?" + params.toString());
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al buscar"); setLoading(false); return; }
      if (cursor) {
        setImages((prev) => [...prev, ...data.images]);
      } else {
        setImages(data.images);
      }
      setNextCursor(data.nextCursor);
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    search("");
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  const toggleSelect = (url: string) => {
    setSelected((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(10,10,10,0.6)",
        zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white", width: "min(900px, 100%)", maxHeight: "85vh",
          display: "flex", flexDirection: "column", border: "1px solid #E8E8E8",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #F4F4F4", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "16px", margin: 0 }}>Elegir de Cloudinary</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#737373" }}>×</button>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ padding: "14px 20px", borderBottom: "1px solid #F4F4F4", display: "flex", gap: "8px" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre..."
            style={{ flex: 1, border: "1px solid #E8E8E8", padding: "8px 10px", fontSize: "13px", outline: "none" }}
          />
          <button type="submit" style={{ backgroundColor: "#0A0A0A", color: "white", border: "none", padding: "0 16px", fontSize: "12px", cursor: "pointer" }}>
            Buscar
          </button>
        </form>

        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
          {error && <p style={{ fontSize: "12px", color: "#DC2626", marginBottom: "12px" }}>{error}</p>}

          {loading && images.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#A3A3A3" }}>Cargando...</p>
          ) : images.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#A3A3A3" }}>No se encontraron imagenes.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "10px" }}>
              {images.map((img) => {
                const isSelected = selected.includes(img.url);
                return (
                  <div
                    key={img.publicId}
                    onClick={() => toggleSelect(img.url)}
                    style={{
                      position: "relative", cursor: "pointer",
                      border: isSelected ? "2px solid #0A0A0A" : "1px solid #E8E8E8",
                    }}
                  >
                    <img src={img.url} alt="" style={{ width: "100%", height: "130px", objectFit: "cover", display: "block" }} />
                    {isSelected && (
                      <span style={{
                        position: "absolute", top: "6px", right: "6px", width: "18px", height: "18px",
                        backgroundColor: "#0A0A0A", color: "white", borderRadius: "50%", fontSize: "11px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {nextCursor && !loading && (
            <button
              onClick={() => search(query, nextCursor)}
              style={{ marginTop: "16px", background: "none", border: "1px solid #E8E8E8", padding: "8px 16px", fontSize: "12px", cursor: "pointer" }}
            >
              Cargar mas
            </button>
          )}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid #F4F4F4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "12px", color: "#737373", margin: 0 }}>{selected.length} seleccionada(s)</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onClose} style={{ background: "none", border: "1px solid #E8E8E8", padding: "8px 16px", fontSize: "12px", cursor: "pointer" }}>
              Cancelar
            </button>
            <button
              onClick={() => selected.length > 0 && onSelect(selected)}
              disabled={selected.length === 0}
              style={{
                backgroundColor: selected.length === 0 ? "#D1D1D1" : "#0A0A0A", color: "white", border: "none",
                padding: "8px 16px", fontSize: "12px", cursor: selected.length === 0 ? "default" : "pointer",
              }}
            >
              Usar {selected.length > 0 ? selected.length : ""} foto{selected.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
