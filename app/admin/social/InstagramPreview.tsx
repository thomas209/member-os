"use client";
import { useState } from "react";

// Simula como se ve el post en el feed de Instagram (celular).
export default function InstagramPreview({
  handle,
  picture,
  images,
  caption,
}: {
  handle: string;
  picture: string | null;
  images: string[];
  caption: string;
}) {
  const [i, setI] = useState(0);
  const [more, setMore] = useState(false);
  const short = caption.length > 125 && !more;
  return (
    <div style={{ width: "375px", background: "white", border: "1px solid #DBDBDB", borderRadius: "10px", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#000" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px" }}>
        {picture ? (
          <img src={picture} alt="" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#EFEFEF" }} />
        )}
        <span style={{ fontSize: "14px", fontWeight: 600 }}>{handle}</span>
        <span style={{ marginLeft: "auto", fontSize: "18px" }}>⋯</span>
      </div>
      <div style={{ position: "relative", width: "375px", aspectRatio: "4 / 5", background: "#FAFAFA" }}>
        <img src={images[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        {images.length > 1 && (
          <>
            <span style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.6)", color: "white", fontSize: "12px", borderRadius: "12px", padding: "3px 8px" }}>
              {i + 1}/{images.length}
            </span>
            {i > 0 && <button onClick={() => setI(i - 1)} style={arrow("left")}>‹</button>}
            {i < images.length - 1 && <button onClick={() => setI(i + 1)} style={arrow("right")}>›</button>}
          </>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "10px 12px 4px", fontSize: "22px" }}>
        <span>♡</span><span>💬</span><span>➤</span>
        {images.length > 1 && (
          <div style={{ display: "flex", gap: "4px", margin: "0 auto" }}>
            {images.map((_, k) => <span key={k} style={{ width: "6px", height: "6px", borderRadius: "50%", background: k === i ? "#0095F6" : "#C7C7C7" }} />)}
          </div>
        )}
        <span style={{ marginLeft: images.length > 1 ? 0 : "auto" }}>🔖</span>
      </div>
      <div style={{ padding: "4px 12px 14px", fontSize: "14px", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
        <b>{handle}</b> {short ? caption.slice(0, 125) + "… " : caption}
        {short && <button onClick={() => setMore(true)} style={{ border: "none", background: "none", color: "#737373", cursor: "pointer", padding: 0, fontSize: "14px" }}>más</button>}
      </div>
    </div>
  );
}

function arrow(side: "left" | "right"): React.CSSProperties {
  return { position: "absolute", top: "50%", [side]: "8px", transform: "translateY(-50%)", width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.9)", fontSize: "20px", lineHeight: "26px", cursor: "pointer" };
}
