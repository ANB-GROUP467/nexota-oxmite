import { create } from "zustand";

const useCartStore = create((set, get) => ({
  items: [],

  addToCart: (product) => {
    const exists = get().items.find((item) => item.id === product.id);

    if (exists) return;

    set((state) => ({
      items: [...state.items, product],
    }));
  },

  removeFromCart: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  isInCart: (id) => get().items.some((item) => item.id === id),

  clearCart: () =>
    set({
      items: [],
    }),
}));

export default useCartStore;
