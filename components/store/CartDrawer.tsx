"use client";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";

// Carrito: hoja de vidrio. En el celular sube desde abajo; en compu entra
// desde la derecha. La logica (cantidades, tope de stock, total) no cambia.
export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } = useCartStore();

  if (!isOpen) return null;

  const total = totalPrice();
  const unidades = items.reduce((a, i) => a + i.quantity, 0);

  return (
    <>
      <div onClick={closeCart} className="cart-velo" />
      <div className="cart-hoja" role="dialog" aria-label="Carrito">
        <div className="cart-cab">
          <p className="cart-titulo">Carrito {unidades > 0 && <span className="cart-n">{unidades}</span>}</p>
          <button onClick={closeCart} className="cart-cerrar" aria-label="Cerrar carrito">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></svg>
          </button>
        </div>

        <div className="cart-cuerpo">
          {items.length === 0 ? (
            <div className="cart-vacio">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="1.5" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
              <p>Tu carrito está vacío</p>
              <Link href="/catalog" onClick={closeCart} className="cart-cta cart-cta-chico">Ver el catálogo</Link>
            </div>
          ) : (
            <div className="cart-items">
              {items.map((item) => {
                const tope = item.quantity >= item.maxStock;
                return (
                  <div key={item.variantId} className="cart-item">
                    <Link href={"/product/" + item.slug} onClick={closeCart} className="cart-foto">
                      {item.image && <img src={item.image} alt={item.name} />}
                    </Link>
                    <div className="cart-info">
                      <p className="cart-marca">{item.brand}</p>
                      <p className="cart-nombre">{item.name}</p>
                      <p className="cart-detalle">Talle {item.size}{item.isEncargo ? " · Por encargo" : ""}</p>
                      <div className="cart-fila">
                        <div className="cart-cant">
                          <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} aria-label="Quitar una unidad">−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} disabled={tope} aria-label="Sumar una unidad">+</button>
                        </div>
                        <p className="precio cart-precio">${(item.price * item.quantity).toLocaleString("es-AR")}</p>
                      </div>
                      {tope && (
                        <p className="cart-aviso">
                          {item.maxStock === 1 ? "Es la última unidad disponible" : `Ya tenés las ${item.maxStock} unidades disponibles`}
                        </p>
                      )}
                      <button onClick={() => removeItem(item.variantId)} className="cart-quitar">Quitar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-pie">
            {total < FREE_SHIPPING_THRESHOLD && (
              <p className="cart-aviso">Te faltan ${(FREE_SHIPPING_THRESHOLD - total).toLocaleString("es-AR")} para el envío gratis</p>
            )}
            <div className="cart-total">
              <p>Total</p>
              <p className="precio">${total.toLocaleString("es-AR")}</p>
            </div>
            <Link href="/checkout" onClick={closeCart} className="cart-cta">Finalizar compra</Link>
            <button onClick={closeCart} className="cart-seguir">Seguir comprando</button>
          </div>
        )}
      </div>
    </>
  );
}
