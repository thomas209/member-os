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
        className="co-campo"
        style={{ opacity: disabled ? 0.5 : 1 }}
      />
      {open && !disabled && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20,
          backgroundColor: "white", border: "1px solid rgba(10,10,10,0.08)", borderRadius: "14px", maxHeight: "220px", overflowY: "auto",
          boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
        }}>
          {filtered.map((s) => (
            <div
              key={s}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(s); setOpen(false); }}
              style={{ padding: "12px 16px", fontSize: "15px", cursor: "pointer" }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
