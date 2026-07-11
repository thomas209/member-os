"use client";
import { useCartStore } from "@/store/cart";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } = useCartStore();

  if (!isOpen) return null;

  return (
    <>
      <div onClick={closeCart} style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.5)",zIndex:100}} />
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:"420px",backgroundColor:"white",zIndex:101,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"24px",borderBottom:"1px solid #E8E8E8",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{fontSize:"13px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase"}}>Carrito ({items.length})</p>
          <button onClick={closeCart} style={{background:"none",border:"none",cursor:"pointer",fontSize:"24px",color:"#0A0A0A"}}>x</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"24px"}}>
          {items.length === 0 ? (
            <div style={{textAlign:"center",paddingTop:"80px"}}>
              <p style={{fontSize:"14px",color:"#737373"}}>Tu carrito esta vacio</p>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:"24px"}}>
              {items.map((item) => (
                <div key={item.variantId} style={{display:"flex",gap:"16px"}}>
                  <div style={{width:"80px",height:"100px",backgroundColor:"#F4F4F4",flexShrink:0,overflow:"hidden"}}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    ) : (
                      <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:"10px",color:"#A3A3A3"}}>IMG</span>
                      </div>
                    )}
                  </div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:"10px",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"4px"}}>{item.brand}</p>
                    <p style={{fontSize:"14px",fontWeight:"500",marginBottom:"4px"}}>{item.name}</p>
                    <p style={{fontSize:"12px",color:"#737373",marginBottom:"12px"}}>Talle {item.size}</p>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                        <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} style={{width:"28px",height:"28px",border:"1px solid #E8E8E8",backgroundColor:"white",cursor:"pointer"}}>-</button>
                        <span style={{fontSize:"13px"}}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          style={{
                            width:"28px",height:"28px",border:"1px solid #E8E8E8",
                            backgroundColor: item.quantity >= item.maxStock ? "#F4F4F4" : "white",
                            color: item.quantity >= item.maxStock ? "#D1D1D1" : "#0A0A0A",
                            cursor: item.quantity >= item.maxStock ? "not-allowed" : "pointer",
                          }}
                        >+</button>
                      </div>
                      <p style={{fontSize:"14px",fontWeight:"700"}}>${(item.price * item.quantity).toLocaleString("es-AR")}</p>
                    </div>
                    {item.quantity >= item.maxStock && (
                      <p style={{fontSize:"11px",color:"#A3A3A3",marginTop:"6px"}}>No hay mas stock disponible de este talle</p>
                    )}
                  </div>
                  <button onClick={() => removeItem(item.variantId)} style={{background:"none",border:"none",cursor:"pointer",color:"#A3A3A3",fontSize:"18px",alignSelf:"flex-start"}}>x</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div style={{padding:"24px",borderTop:"1px solid #E8E8E8"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"16px"}}>
              <p style={{fontSize:"13px",color:"#737373"}}>Total</p>
              <p style={{fontSize:"16px",fontWeight:"700"}}>${totalPrice().toLocaleString("es-AR")}</p>
            </div>
            <a href="/checkout" style={{display:"block",width:"100%",padding:"16px",backgroundColor:"#0A0A0A",color:"white",textAlign:"center",fontSize:"13px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",textDecoration:"none"}}>
              Ir al checkout
            </a>
          </div>
        )}
      </div>
    </>
  );
}
