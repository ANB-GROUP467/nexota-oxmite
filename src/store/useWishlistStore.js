import { create } from "zustand";
import api from "../services/api";

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || value.productId || "";
};

const getProductId = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;

  if (item.product && typeof item.product === "object") {
    return getId(item.product);
  }

  return item.product || item.productId || item.product_id || getId(item);
};

const normalizeWishlistItem = (item) => {
  const product =
    item?.product && typeof item.product === "object" ? item.product : item;
  const productId = getProductId(item) || getId(product);
  const wishlistItemId =
    item?._id && item._id !== productId ? item._id : item?.wishlistItemId;

  return {
    ...product,
    id: productId,
    _id: productId,
    wishlistItemId,
    title: product?.title || product?.name || "Product",
    name: product?.name || product?.title || "Product",
    image: product?.image || product?.images?.[0] || "/placeholder.png",
    images: product?.images || [product?.image].filter(Boolean),
    price: Number(product?.price || 0),
    rating: Number(product?.rating || 0),
  };
};

const readWishlist = (data) => {
  const possibleLists = [
    data?.wishlist,
    data?.items,
    data?.products,
    data?.data?.wishlist,
    data?.data?.items,
    data?.data?.products,
    data?.data,
  ];

  const list = possibleLists.find((value) => Array.isArray(value));
  return Array.isArray(list) ? list.map(normalizeWishlistItem) : [];
};

const readSingleWishlistItem = (data) => {
  const possibleItems = [
    data?.wishlistItem,
    data?.item,
    data?.product,
    data?.wishlist,
    data?.data?.wishlistItem,
    data?.data?.item,
    data?.data?.product,
    data?.data,
  ];

  const item = possibleItems.find(
    (value) => value && typeof value === "object" && !Array.isArray(value),
  );

  return item ? normalizeWishlistItem(item) : null;
};

const readTokenFromStorage = () => {
  const directToken =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");

  if (directToken) return directToken;

  try {
    const authStorage = JSON.parse(
      localStorage.getItem("auth-storage") || "{}",
    );
    return authStorage?.state?.token || authStorage?.token || "";
  } catch {
    return "";
  }
};

const hasToken = () => Boolean(readTokenFromStorage());

const syncList = (set, list) => {
  set({
    wishlist: list,
    items: list,
  });
};

const useWishlistStore = create((set, get) => ({
  wishlist: [],
  items: [],
  loading: false,
  error: "",

  resetWishlist: () => {
    ["wishlist", "wishlist-storage"].forEach((key) =>
      localStorage.removeItem(key),
    );
    set({
      wishlist: [],
      items: [],
      loading: false,
      error: "",
    });
  },

  fetchWishlist: async () => {
    if (!hasToken()) {
      get().resetWishlist();
      return [];
    }

    try {
      set({ loading: true, error: "" });
      const { data } = await api.get("/wishlist");
      const list = readWishlist(data);
      syncList(set, list);
      return list;
    } catch (error) {
      if (error.response?.status === 401) {
        get().resetWishlist();
        return [];
      }

      set({
        error: error.response?.data?.message || "Failed to load wishlist.",
      });
      return get().wishlist;
    } finally {
      set({ loading: false });
    }
  },

  addWishlist: async (product) => {
    if (!hasToken()) {
      throw new Error("Please login to use wishlist.");
    }

    const productId = getId(product);
    if (!productId) return;

    const current = get().wishlist;
    if (current.some((item) => getProductId(item) === productId)) return;

    const optimisticItem = normalizeWishlistItem(product);
    syncList(set, [optimisticItem, ...current]);

    try {
      const { data } = await api.post("/wishlist", {
        product: productId,
        productId,
      });

      const list = readWishlist(data);
      const singleItem = readSingleWishlistItem(data);

      if (list.length > 0) {
        syncList(set, list);
      } else if (singleItem) {
        const latest = get().wishlist;
        const exists = latest.some(
          (item) => getProductId(item) === getProductId(singleItem),
        );

        syncList(set, exists ? latest : [singleItem, ...latest]);
      }
    } catch (error) {
      syncList(set, current);
      throw error;
    }
  },

  removeWishlist: async (productId) => {
    if (!hasToken()) {
      get().resetWishlist();
      return;
    }

    if (!productId) return;

    const current = get().wishlist;
    const next = current.filter((item) => getProductId(item) !== productId);

    syncList(set, next);

    try {
      const { data } = await api.delete(`/wishlist/${productId}`);
      const list = readWishlist(data);

      if (
        list.length > 0 ||
        Array.isArray(data?.wishlist) ||
        Array.isArray(data?.data)
      ) {
        syncList(set, list);
      }
    } catch (error) {
      syncList(set, current);
      throw error;
    }
  },

  toggleWishlist: async (product) => {
    const productId = getId(product);
    if (!productId) return;

    if (get().isInWishlist(productId)) {
      await get().removeWishlist(productId);
      return;
    }

    await get().addWishlist(product);
  },

  clearWishlist: async () => {
    const current = get().wishlist;
    syncList(set, []);

    if (!hasToken()) return;

    try {
      await api.delete("/wishlist/clear");
    } catch (error) {
      syncList(set, current);
      throw error;
    }
  },

  isInWishlist: (productId) =>
    get().wishlist.some((item) => getProductId(item) === String(productId)),

  addItem: (product) => get().addWishlist(product),
  removeItem: (productId) => get().removeWishlist(productId),
  removeFromWishlist: (productId) => get().removeWishlist(productId),
  getWishlist: () => get().fetchWishlist(),
  fetchItems: () => get().fetchWishlist(),
}));

if (
  typeof window !== "undefined" &&
  !window.__NEXOTA_WISHLIST_LOGOUT_LISTENER__
) {
  window.__NEXOTA_WISHLIST_LOGOUT_LISTENER__ = true;
  window.addEventListener("nexota:logout", () => {
    useWishlistStore.getState().resetWishlist();
  });
}

export default useWishlistStore;
