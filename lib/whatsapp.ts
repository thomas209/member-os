// Normaliza un telefono cargado a mano al formato que espera wa.me para
// numeros moviles de Argentina: 549 + codigo de area + numero, sin el 0
// inicial ni el 15 que se usan al marcar localmente.
// Es un best-effort: como el cajero lo tipea libremente, no hay garantia
// total — si el numero no resuelve bien, se puede corregir a mano en WhatsApp
// antes de mandar.
export function toWhatsappNumber(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("54")) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  // Patron tipico local: codigo de area (2 a 4 digitos) + "15" + numero
  digits = digits.replace(/^(\d{2,4})15/, "$1");

  if (digits.startsWith("9")) {
    return "54" + digits;
  }
  return "549" + digits;
}

export function buildWhatsappLink(phone: string, message: string): string {
  return "https://wa.me/" + toWhatsappNumber(phone) + "?text=" + encodeURIComponent(message);
}
