import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  size: string;
  price: number;
  image: string | null;
  quantity: number;
  // Stock disponible al momento de agregarlo (puede quedar desactualizado
  // si cambia mientras el carrito sigue abierto; el checkout siempre
  // revalida el stock real igual, esto solo evita que el carrito deje
  // sumar de mas a simple vista).
  maxStock: number;
};

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => boolean;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      // Devuelve false si ya estaba en el tope de stock (no se agrego nada
      // nuevo), para que el que llama pueda avisar al usuario.
      addItem: (item) => {
        const items = get().items;
        const existing = items.find((i) => i.variantId === item.variantId);
        if (existing) {
          if (existing.quantity >= existing.maxStock) {
            set({ isOpen: true });
            return false;
          }
          set({
            items: items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + 1, maxStock: item.maxStock }
                : i
            ),
            isOpen: true,
          });
        } else {
          set({ items: [...items, { ...item, quantity: 1 }], isOpen: true });
        }
        return true;
      },

      removeItem: (variantId) =>
        set({ items: get().items.filter((i) => i.variantId !== variantId) }),

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: i.maxStock ? Math.min(quantity, i.maxStock) : quantity }
              : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    }),
    { name: "member-cart" }
  )
);
