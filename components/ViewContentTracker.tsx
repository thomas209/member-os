"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type ViewContentTrackerProps = {
  id: string;
  name: string;
  price: number;
  category: string;
};

// Dispara el evento estándar de Meta al entrar a una ficha de producto.
// Se usa junto con el Pixel para armar públicos de retargeting y catálogo
// dinámico ("la gente que vio este producto y no compró") el día que se
// corran anuncios.
export default function ViewContentTracker({ id, name, price, category }: ViewContentTrackerProps) {
  useEffect(() => {
    window.fbq?.("track", "ViewContent", {
      content_ids: [id],
      content_name: name,
      content_type: "product",
      content_category: category,
      value: price,
      currency: "ARS",
    });
  }, [id, name, price, category]);

  return null;
}
