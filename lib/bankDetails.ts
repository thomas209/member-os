// Datos para pagos por transferencia bancaria directa (no pasa por
// Mercado Pago). Si cambia el banco/CBU en algun momento, alcanza con
// actualizar esto — no hay que tocar nada mas.
export const BANK_CBU = "0070169930004033136874";
export const BANK_HOLDER = "Thomas Matthew Caronia";
export const TRANSFER_DISCOUNT_PERCENT = 10;
export const STORE_WHATSAPP_NUMBER = "1130866758";

export function calculateTransferDiscount(subtotal: number): number {
  return subtotal * (TRANSFER_DISCOUNT_PERCENT / 100);
}
