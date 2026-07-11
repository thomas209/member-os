// Config de envio del ecommerce. Fijo por ahora (no hay integracion real
// con un correo todavia) — cuando se integre Andreani de verdad esto se
// reemplaza por una cotizacion dinamica.
export const SHIPPING_COST = 18000;
export const FREE_SHIPPING_THRESHOLD = 180000;

export function calculateShippingCost(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}
