// Pago dividido del punto de venta: una venta se puede cobrar en parte con
// efectivo, tarjeta y/o transferencia. En ese caso Order.paymentMethod es
// "MIXTO" y Order.paymentSplit guarda cuanto se pago con cada medio.

export const POS_METHODS = ["EFECTIVO", "TARJETA", "TRANSFERENCIA"] as const;
export type PosMethod = (typeof POS_METHODS)[number];
export type PaymentSplit = Partial<Record<PosMethod, number>>;

export const METHOD_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  MERCADOPAGO: "Mercado Pago",
  MIXTO: "Pago dividido",
};

// Lee el JSON guardado y se queda solo con montos validos (> 0).
export function readSplit(raw: unknown): PaymentSplit {
  const out: PaymentSplit = {};
  if (!raw || typeof raw !== "object") return out;
  for (const m of POS_METHODS) {
    const v = Number((raw as Record<string, unknown>)[m]);
    if (Number.isFinite(v) && v > 0) out[m] = v;
  }
  return out;
}

// Cuanto entro por cada medio en una venta. Las ventas de un solo medio
// cuentan el total completo en ese medio (las viejas sin medio = efectivo,
// igual que antes).
export function breakdown(paymentMethod: string | null | undefined, paymentSplit: unknown, total: number): Record<PosMethod, number> {
  const res: Record<PosMethod, number> = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 };
  if (paymentMethod === "MIXTO") {
    const s = readSplit(paymentSplit);
    for (const m of POS_METHODS) res[m] = s[m] || 0;
    return res;
  }
  const m = (paymentMethod || "EFECTIVO") as PosMethod;
  if (m in res) res[m] = total;
  return res;
}

// Texto para mostrar: "Efectivo" o "Efectivo $30.000 + Tarjeta $50.000".
export function paymentLabel(paymentMethod: string | null | undefined, paymentSplit?: unknown): string {
  if (paymentMethod === "MIXTO") {
    const s = readSplit(paymentSplit);
    const parts = POS_METHODS.filter((m) => s[m]).map((m) => METHOD_LABELS[m] + " $" + Math.round(s[m]!).toLocaleString("es-AR"));
    return parts.length ? parts.join(" + ") : METHOD_LABELS.MIXTO;
  }
  if (!paymentMethod) return "-";
  return METHOD_LABELS[paymentMethod] || paymentMethod;
}
