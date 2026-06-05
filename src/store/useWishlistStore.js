import { create } from "zustand";

const useWishlistStore = create((set) => ({
  wishlist: [],

  addWishlist: (product) =>
    set((state) => ({
      wishlist: [...state.wishlist, product],
    })),

  removeWishlist: (id) =>
    set((state) => ({
      wishlist: state.wishlist.filter((item) => item.id !== id),
    })),
}));

export default useWishlistStore;
