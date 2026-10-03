import { revalidatePath, revalidateTag } from "next/cache";

// La tienda guarda en cache la home, el catalogo y los "relacionados" para
// responder al instante. Cuando se cambia algo desde el admin se llama a esto
// y los clientes ven el cambio enseguida, sin esperar a que venza la cache.
export const TAG_TIENDA = "tienda";

export function refrescarTienda() {
  try {
    revalidateTag(TAG_TIENDA, { expire: 0 });
    revalidatePath("/");
  } catch {
    // si falla el refresco no rompemos el guardado: la cache vence sola
  }
}
