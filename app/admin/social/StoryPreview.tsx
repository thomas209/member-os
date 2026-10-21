"use client";
import { useState } from "react";

// Simula como se ve una historia de Instagram (pantalla completa 9:16).
export default function StoryPreview({ handle, picture, images }: { handle: string; picture: string | null; images: string[] }) {
  const [i, setI] = useState(0);
  return (
    <div style={{ position: "relative", width: "300px", aspectRatio: "9 / 16", borderRadius: "14px", overflow: "hidden", background: "#000", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {images[i]?.includes("/video/upload/")
        ? <video key={images[i]} src={images[i]} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={images[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
      <div style={{ position: "absolute", top: "8px", left: "8px", right: "8px", display: "flex", gap: "3px" }}>
        {images.map((_, k) => (
          <span key={k} style={{ flex: 1, height: "2px", borderRadius: "2px", background: k <= i ? "white" : "rgba(255,255,255,0.4)" }} />
        ))}
      </div>
      <div style={{ position: "absolute", top: "18px", left: "10px", display: "flex", alignItems: "center", gap: "8px", color: "white", fontSize: "13px", fontWeight: 600, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
        {picture ? <img src={picture} alt="" style={{ width: "28px", height: "28px", borderRadius: "50%" }} /> : <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#888" }} />}
        {handle} <span style={{ fontWeight: 400, opacity: 0.8 }}>· ahora</span>
      </div>
      {i > 0 && <button onClick={() => setI(i - 1)} style={{ position: "absolute", inset: "0 50% 0 0", background: "transparent", border: "none", cursor: "pointer" }} aria-label="Anterior" />}
      {i < images.length - 1 && <button onClick={() => setI(i + 1)} style={{ position: "absolute", inset: "0 0 0 50%", background: "transparent", border: "none", cursor: "pointer" }} aria-label="Siguiente" />}
      <div style={{ position: "absolute", bottom: "12px", left: "10px", right: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ flex: 1, border: "1px solid rgba(255,255,255,0.7)", borderRadius: "20px", padding: "8px 12px", color: "white", fontSize: "12px" }}>Enviar mensaje</div>
        <span style={{ color: "white", fontSize: "18px" }}>♡</span>
        <span style={{ color: "white", fontSize: "18px" }}>➤</span>
      </div>
    </div>
  );
}
