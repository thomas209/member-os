// Datos para pagos por transferencia bancaria directa (no pasa por
// Mercado Pago). Si cambia el banco/CBU en algun momento, alcanza con
// actualizar esto — no hay que tocar nada mas.
export const BANK_CBU = "0070169930004033136874";
export const BANK_HOLDER = "Thomas Matthew Caronia";
export const TRANSFER_DISCOUNT_PERCENT = 20;
// El descuento por transferencia solo aplica a productos que valen MAS de este
// monto (precio unitario). Los de este precio o menos van sin descuento.
export const TRANSFER_DISCOUNT_MIN_PRICE = 160000;
export const STORE_WHATSAPP_NUMBER = "1130866758";

// Descuento por transferencia: 20% solo sobre los productos de mas de $160.000.
export function calculateTransferDiscount(items: { price: number; quantity: number }[]): number {
  return items
    .filter((i) => i.price > TRANSFER_DISCOUNT_MIN_PRICE)
    .reduce((acc, i) => acc + i.price * i.quantity * (TRANSFER_DISCOUNT_PERCENT / 100), 0);
}
