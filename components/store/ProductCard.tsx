"use client";
import { useState } from "react";

export default function ProductCard({ href, image, secondImage, brand, name, price, comparePrice, inStock = true, isEncargo = false }: { href: string; image: string | null; secondImage?: string | null; brand: string; name: string; price: string; comparePrice?: string | null; inStock?: boolean; isEncargo?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a href={href} style={{textDecoration:"none",color:"#0A0A0A",display:"block"}} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{aspectRatio:"4/5",backgroundColor:"#F4F4F4",marginBottom:"16px",overflow:"hidden",position:"relative"}}>
        {!inStock && (
          <div style={{position:"absolute",top:"10px",left:"10px",zIndex:1,backgroundColor:"white",color:"#0A0A0A",fontSize:"10px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",padding:"5px 10px",border:"1px solid #0A0A0A"}}>
            Sin stock
          </div>
        )}
        {image ? (
          <>
            <img src={image} alt={name} style={{width:"100%",height:"100%",objectFit:"cover",transition:"opacity 0.35s ease, transform 0.4s ease",transform:hovered?"scale(1.05)":"scale(1)",opacity:(hovered && secondImage) ? 0 : inStock?1:0.4}} />
            {secondImage && (
              <img
                src={secondImage}
                alt={name}
                style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",transition:"opacity 0.35s ease, transform 0.4s ease",transform:hovered?"scale(1.05)":"scale(1)",opacity: hovered ? (inStock?1:0.4) : 0}}
              />
            )}
          </>
        ) : (
          <div style={{width:"100%",height:"100%",backgroundColor:"#E8E8E8",display:"flex",alignItems:"center",justifyContent:"center",opacity:inStock?1:0.4}}>
            <span style={{fontSize:"11px",color:"#A3A3A3"}}>SIN IMAGEN</span>
          </div>
        )}
      </div>
      <p style={{fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",color:"#737373",marginBottom:"6px"}}>{brand}</p>
      <p style={{fontSize:"15px",fontWeight:"500",marginBottom:"8px",color:inStock?"#0A0A0A":"#A3A3A3"}}>{name}</p>
      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:isEncargo?"4px":"32px"}}>
        <p style={{fontSize:"15px",fontWeight:"700",color:inStock?"#0A0A0A":"#A3A3A3"}}>${Number(price).toLocaleString("es-AR")}</p>
        {comparePrice && <p style={{fontSize:"13px",color:"#A3A3A3",textDecoration:"line-through"}}>${Number(comparePrice).toLocaleString("es-AR")}</p>}
      </div>
      {isEncargo && (
        <p style={{fontSize:"11px",color:"#737373",marginBottom:"32px"}}>Por encargo</p>
      )}
    </a>
  );
}
