"use client";
import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { STORE_WHATSAPP_NUMBER } from "@/lib/bankDetails";

type Variant = {
  id: string;
  size: string;
  stock: number;
};

type Props = {
  variants: Variant[];
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    price: number;
    image: string | null;
    isEncargo?: boolean;
  };
};

export default function AddToCart({ variants, product }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    if (!selectedVariant) {
      setError("Seleccioná un talle antes de continuar");
      return;
    }
    const wasAdded = addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      size: selectedVariant.size,
      price: product.price,
      image: product.image,
      maxStock: selectedVariant.stock,
      isEncargo: product.isEncargo,
    });
    if (!wasAdded) {
      setError("Ya tenés en el carrito todo el stock disponible de este talle (" + selectedVariant.stock + ")");
      return;
    }
    setError("");
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const hasStock = variants.some((v) => v.stock > 0);
  const selectedOutOfStock = selectedVariant !== null && selectedVariant.stock === 0;

  const buildStockAlertHref = (variant: Variant) => {
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    const message = `Hola! Quiero que me avisen cuando haya stock de ${product.brand} ${product.name} talle ${variant.size}.\n${pageUrl}`;
    return buildWhatsappLink(STORE_WHATSAPP_NUMBER, message);
  };

  return (
    <>
      {/* SELECTOR DE TALLES */}
      <div className="mb-8">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-4">
          ¿Qué talle estás buscando?
        </p>
        <div className="grid grid-cols-3 gap-2">
          {variants.map((variant) => {
            const isSelected = selectedVariant?.id === variant.id;
            const outOfStock = variant.stock === 0;
            return (
              <button
                key={variant.id}
                onClick={() => { setSelectedVariant(variant); setError(""); }}
                className={`
                  py-4 text-sm font-medium border transition-all cursor-pointer
                  ${isSelected && outOfStock
                    ? "border-neutral-900 text-neutral-900 line-through"
                    : isSelected
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : outOfStock
                    ? "border-neutral-200 text-neutral-300 line-through hover:border-neutral-400"
                    : "border-neutral-300 text-neutral-900 hover:border-neutral-900"
                  }
                `}
              >
                {variant.size}
              </button>
            );
          })}
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-3">{error}</p>
        )}
      </div>

      {/* BOTON — desktop */}
      <div className="desktop-cta">
        {selectedOutOfStock ? (
          <a
            href={buildStockAlertHref(selectedVariant!)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-5 text-[13px] font-semibold tracking-widest uppercase text-center border border-neutral-900 text-neutral-900 bg-white hover:bg-neutral-900 hover:text-white transition-colors"
          >
            Avisame cuando haya stock
          </a>
        ) : (
          <button
            onClick={handleAdd}
            disabled={!hasStock}
            className={`
              w-full py-5 text-[13px] font-semibold tracking-widest uppercase border-none transition-colors
              ${added
                ? "bg-green-600 text-white cursor-pointer"
                : hasStock
                ? "bg-neutral-900 text-white cursor-pointer hover:bg-neutral-700"
                : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              }
            `}
          >
            {added ? "Agregado ✓" : hasStock ? "Agregar al carrito" : "Sin stock"}
          </button>
        )}
      </div>

      {/* BOTON STICKY — mobile */}
      <div className="mobile-sticky-cta fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 z-40">
        {selectedOutOfStock ? (
          <a
            href={buildStockAlertHref(selectedVariant!)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-6 text-sm font-semibold tracking-widest uppercase text-center border-2 border-neutral-900 text-neutral-900 bg-white"
          >
            Avisame cuando haya stock
          </a>
        ) : (
          <button
            onClick={handleAdd}
            disabled={!hasStock}
            className={`
              w-full py-6 text-sm font-semibold tracking-widest uppercase border-none transition-colors
              ${added
                ? "bg-green-600 text-white cursor-pointer"
                : hasStock
                ? "bg-neutral-900 text-white cursor-pointer"
                : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              }
            `}
          >
            {added ? "Agregado ✓" : !selectedVariant ? "Seleccioná un talle" : "Agregar al carrito"}
          </button>
        )}
      </div>
    </>
  );
}
