"use client";
import { useState } from "react";

export default function ProductCard({ href, image, brand, name, price, comparePrice }: { href: string; image: string | null; brand: string; name: string; price: string; comparePrice?: string | null }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a href={href} style={{textDecoration:"none",color:"#0A0A0A",display:"block"}} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{aspectRatio:"4/5",backgroundColor:"#F4F4F4",marginBottom:"16px",overflow:"hidden"}}>
        {image ? (
          <img src={image} alt={name} style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.4s ease",transform:hovered?"scale(1.05)":"scale(1)"}} />
        ) : (
          <div style={{width:"100%",height:"100%",backgroundColor:"#E8E8E8",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:"11px",color:"#A3A3A3"}}>SIN IMAGEN</span>
          </div>
        )}
      </div>
      <p style={{fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",color:"#737373",marginBottom:"6px"}}>{brand}</p>
      <p style={{fontSize:"15px",fontWeight:"500",marginBottom:"8px"}}>{name}</p>
      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"32px"}}>
        <p style={{fontSize:"15px",fontWeight:"700"}}>${Number(price).toLocaleString("es-AR")}</p>
        {comparePrice && <p style={{fontSize:"13px",color:"#A3A3A3",textDecoration:"line-through"}}>${Number(comparePrice).toLocaleString("es-AR")}</p>}
      </div>
    </a>
  );
}
