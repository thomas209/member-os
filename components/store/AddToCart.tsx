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
  pickupLocation?: string; // "PINAMAR" | "CABA" | "AMBOS"
};

// Lugares de retiro (pick up)
const PICKUPS = {
  PINAMAR: {
    label: "Retiro en Pinamar",
    address: "Av. Constitución 270, Pinamar",
    href: "https://www.google.com/maps/search/?api=1&query=Member%20Club%2C%20Av.%20Constituci%C3%B3n%20270%2C%20Pinamar",
  },
  CABA: {
    label: "Retiro en Capital Federal",
    address: "Av. Callao 1371, Recoleta",
    href: "https://www.google.com/maps/search/?api=1&query=Av.%20Callao%201371%2C%20Recoleta%2C%20Buenos%20Aires",
  },
};

export default function AddToCart({ variants, product, sizeGuideType = "indumentaria", pickupLocation = "PINAMAR" }: Props) {
  const retiros = pickupLocation === "AMBOS" ? [PICKUPS.PINAMAR, PICKUPS.CABA] : pickupLocation === "CABA" ? [PICKUPS.CABA] : [PICKUPS.PINAMAR];
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
      <div className="pdp-talles">
        <div className="flex items-center justify-between pdp-talles-head">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">
            ¿Qué talle estás buscando?
          </p>
          <SizeGuideModal type={sizeGuideType} />
        </div>
        {/* Selector tipo "pastilla" (estilo Apple): todas las opciones dentro de una
            pastilla gris y el talle elegido resaltado con su propia pastilla */}
        <div className="relative flex w-full md:w-auto md:inline-flex flex-wrap gap-1 pdp-talles-pill rounded-[30px] bg-neutral-100">
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
                  flex-1 basis-[18%] md:flex-none md:basis-auto md:min-w-[64px] pdp-talle relative z-[1] rounded-full text-[15px] md:text-sm border-none bg-transparent transition-colors duration-300 cursor-pointer
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
          <p className="text-xs text-red-500" style={{ marginTop: 12 }}>{error}</p>
        )}
      </div>

      {/* BOTON — desktop */}
      <div className="desktop-cta">
        {selectedOutOfStock ? (
          <a
            href={buildStockAlertHref(selectedVariant!)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block min-w-[300px] pdp-cta rounded-full text-[17px] font-normal text-center border border-neutral-900 text-neutral-900 bg-white hover:bg-neutral-900 hover:text-white active:scale-[0.98] transition-all duration-200"
          >
            Avisame cuando haya stock
          </a>
        ) : (
          <button
            onClick={handleAdd}
            disabled={!hasStock}
            className={`
              min-w-[300px] pdp-cta rounded-full text-[17px] font-normal border-none active:scale-[0.98] transition-all duration-200
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

      {/* ENVIO Y RETIRO — estilo Apple: icono de lineas finas + texto
          (iconos "truck" y "shopping-bag" de Lucide, licencia libre ISC) */}
      <div className="pdp-envio flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
            <path d="M15 18H9" />
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
            <circle cx="17" cy="18" r="2" />
            <circle cx="7" cy="18" r="2" />
          </svg>
          <div>
            <p className="text-[14px] font-semibold text-neutral-900 leading-snug">Envío a todo el país</p>
            <p className="text-[13px] text-neutral-500 leading-snug" style={{ marginTop: 2 }}>Te lo mandamos a tu casa, estés donde estés.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {retiros.map((r, i) => (
              <div key={r.label}>
                <p className="text-[14px] font-semibold text-neutral-900 leading-snug">
                  {i === 0 ? "Pick up: " : ""}
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-normal text-[#0066CC] no-underline hover:underline underline-offset-2"
                  >
                    {r.label}
                  </a>
                </p>
                <p className="text-[13px] text-neutral-500 leading-snug" style={{ marginTop: 2 }}>
                  {r.address}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
          </svg>
          <div>
            <p className="text-[14px] font-semibold text-neutral-900 leading-snug">Encargos: 14 días</p>
            <p className="text-[13px] text-neutral-500 leading-snug" style={{ marginTop: 2 }}>
              Los productos por encargo llegan en aprox. 14 días.
            </p>
          </div>
        </div>
      </div>

      {/* BOTON STICKY — mobile */}
      <div className="mobile-sticky-cta fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-neutral-100 z-40 pdp-cta-bar">
        {selectedOutOfStock ? (
          <a
            href={buildStockAlertHref(selectedVariant!)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full pdp-cta-mobile rounded-full text-[17px] font-normal text-center border border-neutral-900 text-neutral-900 bg-white active:scale-[0.98] transition-all duration-200"
          >
            Avisame cuando haya stock
          </a>
        ) : (
          <button
            onClick={handleAdd}
            disabled={!hasStock}
            className={`
              w-full pdp-cta-mobile rounded-full text-[17px] font-normal border-none active:scale-[0.98] transition-all duration-200
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
