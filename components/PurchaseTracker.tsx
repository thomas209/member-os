"use client";

import { useEffect } from "react";
import { trackMeta } from "@/lib/metaPixel";

type Props = {
  orderId: string;
  value: number;
  items: { productId: string; quantity: number; unitPrice: number }[];
};

// Meta: "compra" desde el navegador al volver de Mercado Pago con el pago
// aprobado. El servidor manda la misma compra por Conversions API con el
// mismo eventID, y Meta se queda con una sola.
export default function PurchaseTracker({ orderId, value, items }: Props) {
  useEffect(() => {
    const key = "meta-purchase-" + orderId;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sin sessionStorage: igual se manda (Meta deduplica por eventID)
    }
    trackMeta(
      "Purchase",
      {
        value,
        currency: "ARS",
        content_type: "product",
        content_ids: items.map((i) => i.productId),
        contents: items.map((i) => ({ id: i.productId, quantity: i.quantity, item_price: i.unitPrice })),
        num_items: items.reduce((s, i) => s + i.quantity, 0),
      },
      "purchase-" + orderId
    );
  }, [orderId, value, items]);

  return null;
}
