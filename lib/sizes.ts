// Ordena los talles como los espera el cliente, sin depender del orden en que
// se cargaron: ropa XXS -> XXXL, y numeros de menor a mayor. Si hay algun
// talle que no reconoce, deja el orden original.
const ROPA = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL"];

export function ordenarTalles<T extends { size: string }>(variants: T[]): T[] {
  const clave = (s: string) => s.trim().toUpperCase();
  if (variants.every((v) => ROPA.includes(clave(v.size)))) {
    return [...variants].sort((a, b) => ROPA.indexOf(clave(a.size)) - ROPA.indexOf(clave(b.size)));
  }
  const num = (s: string) => parseFloat(s.replace(",", "."));
  if (variants.every((v) => /^\d+([.,]\d+)?$/.test(v.size.trim()))) {
    return [...variants].sort((a, b) => num(a.size) - num(b.size));
  }
  return variants;
}
