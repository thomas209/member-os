"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useCartStore } from "@/store/cart";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { STORE_WHATSAPP_NUMBER } from "@/lib/bankDetails";
import SizeGuideModal from "@/components/store/SizeGuideModal";

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
  sizeGuideType?: "calzado" | "indumentaria";
};

export default function AddToCart({ variants, product, sizeGuideType = "indumentaria" }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  // Pastilla que se desliza hasta el talle elegido (efecto tipo Apple)
  const sizeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [pillAnimada, setPillAnimada] = useState(false);
  const medirPill = () => {
    const el = selectedVariant ? sizeRefs.current[selectedVariant.id] : null;
    setPill(el ? { left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight } : null);
  };
  useLayoutEffect(medirPill, [selectedVariant]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    window.addEventListener("resize", medirPill);
    return () => window.removeEventListener("resize", medirPill);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  // La primera vez que aparece la pastilla no se anima (aparece en su lugar)
  useEffect(() => {
    if (pill && !pillAnimada) requestAnimationFrame(() => setPillAnimada(true));
  }, [pill, pillAnimada]);
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
      setError(
        selectedVariant.stock === 1
          ? "Ya tenés la última unidad disponible de este talle en el carrito"
          : `Ya tenés las ${selectedVariant.stock} unidades disponibles de este talle en el carrito`
      );
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
      <div className="mb-12 md:mb-16">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">
            ¿Qué talle estás buscando?
          </p>
          <SizeGuideModal type={sizeGuideType} />
        </div>
        {/* Selector tipo "pastilla" (estilo Apple): todas las opciones dentro de una
            pastilla gris y el talle elegido resaltado con su propia pastilla */}
        <div className="relative flex w-full md:w-auto md:inline-flex flex-wrap gap-1 p-1.5 rounded-[30px] bg-neutral-100">
          {pill && (
            <span
              aria-hidden
              className="absolute rounded-full bg-neutral-900 shadow-md pointer-events-none"
              style={{
                left: pill.left,
                top: pill.top,
                width: pill.width,
                height: pill.height,
                transition: pillAnimada ? "left 0.3s cubic-bezier(0.32,0.72,0,1), top 0.3s cubic-bezier(0.32,0.72,0,1), width 0.3s cubic-bezier(0.32,0.72,0,1)" : "none",
              }}
            />
          )}
          {variants.map((variant) => {
            const isSelected = selectedVariant?.id === variant.id;
            const outOfStock = variant.stock === 0;
            return (
              <button
                key={variant.id}
                ref={(el) => { sizeRefs.current[variant.id] = el; }}
                onClick={() => { setSelectedVariant(variant); setError(""); }}
                className={`
                  flex-1 basis-[18%] md:flex-none md:basis-auto md:min-w-[64px] px-4 md:px-5 py-3.5 md:py-3 relative z-[1] rounded-full text-[15px] md:text-sm border-none bg-transparent transition-colors duration-300 cursor-pointer
                  ${isSelected && outOfStock
                    ? "text-neutral-400 font-semibold line-through"
                    : isSelected
                    ? "text-white font-semibold"
                    : outOfStock
                    ? "text-neutral-300 font-medium line-through hover:text-neutral-400"
                    : "text-neutral-600 font-medium hover:text-neutral-900"
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
      <div className="desktop-cta pt-2">
        {selectedOutOfStock ? (
          <a
            href={buildStockAlertHref(selectedVariant!)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block min-w-[300px] px-10 py-3.5 rounded-full text-[17px] font-normal text-center border border-neutral-900 text-neutral-900 bg-white hover:bg-neutral-900 hover:text-white active:scale-[0.98] transition-all duration-200"
          >
            Avisame cuando haya stock
          </a>
        ) : (
          <button
            onClick={handleAdd}
            disabled={!hasStock}
            className={`
              min-w-[300px] px-10 py-3.5 rounded-full text-[17px] font-normal border-none active:scale-[0.98] transition-all duration-200
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
      <div className="mobile-sticky-cta fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-neutral-100 z-40 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        {selectedOutOfStock ? (
          <a
            href={buildStockAlertHref(selectedVariant!)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3.5 rounded-full text-[17px] font-normal text-center border border-neutral-900 text-neutral-900 bg-white active:scale-[0.98] transition-all duration-200"
          >
            Avisame cuando haya stock
          </a>
        ) : (
          <button
            onClick={handleAdd}
            disabled={!hasStock}
            className={`
              w-full py-3.5 rounded-full text-[17px] font-normal border-none active:scale-[0.98] transition-all duration-200
              ${added
                ? "bg-green-600 text-white cursor-pointer"
                : hasStock
                ? "bg-neutral-900 text-white cursor-pointer hover:bg-neutral-700 active:bg-neutral-800"
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
