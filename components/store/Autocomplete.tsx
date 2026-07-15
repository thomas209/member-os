"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
};

// Input de texto con sugerencias tipo desplegable: el usuario escribe y
// se filtran las opciones que matchean, pero puede seguir escribiendo
// lo que quiera (no lo bloquea si no encuentra su localidad exacta en
// la lista).
export default function Autocomplete({ name, value, onChange, suggestions, placeholder, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const query = value.trim().toLowerCase();
  const filtered = (query ? suggestions.filter((s) => s.toLowerCase().includes(query)) : suggestions).slice(0, 50);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        name={name}
        value={value}
        disabled={disabled}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: "100%", padding: "12px", border: "1px solid #D1D1D1", fontSize: "14px", outline: "none",
          backgroundColor: disabled ? "#F4F4F4" : "white", boxSizing: "border-box",
        }}
      />
      {open && !disabled && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 20,
          backgroundColor: "white", border: "1px solid #D1D1D1", maxHeight: "220px", overflowY: "auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}>
          {filtered.map((s) => (
            <div
              key={s}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(s); setOpen(false); }}
              style={{ padding: "10px 12px", fontSize: "13px", cursor: "pointer" }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
