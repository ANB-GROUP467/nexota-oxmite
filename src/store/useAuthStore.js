import { create } from "zustand";
import api from "../services/api";
import useCartStore from "./useCartStore";
import useOrderStore from "./useOrderStore";
import useWishlistStore from "./useWishlistStore";

const readAuthStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("auth-storage") || "{}");
  } catch {
    return {};
  }
};

const readStoredToken = () => {
  const directToken =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");

  if (directToken) return directToken;

  const authStorage = readAuthStorage();
  return authStorage?.state?.token || authStorage?.token || "";
};

const saveAuthSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem("token", token);
  }

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  localStorage.setItem(
    "auth-storage",
    JSON.stringify({
      state: { token: token || "", user: user || null },
      version: 0,
    }),
  );
};

const clearAuthSession = () => {
  [
    "token",
    "accessToken",
    "authToken",
    "user",
    "auth-storage",
    "profile",
    "profile-storage",
    "cart",
    "cartItems",
    "cart-storage",
    "wishlist",
    "wishlist-storage",
    "orders",
    "order-storage",
    "profileData",
  ].forEach((key) => localStorage.removeItem(key));
};

const resetPrivateStores = () => {
  useWishlistStore.getState().resetWishlist();
  useOrderStore.getState().resetOrders();
  useCartStore.getState().resetForGuest();
};

const hydratePrivateStores = async (user) => {
  useCartStore.getState().setCartUser(user);

  await Promise.allSettled([
    useWishlistStore.getState().fetchWishlist(),
    useOrderStore.getState().fetchOrders(),
  ]);
};

const extractAuthPayload = (data) => ({
  token: data?.token || data?.accessToken || data?.data?.token || "",
  user: data?.user || data?.data?.user || data?.data || null,
});

const useAuthStore = create((set, get) => ({
  user: null,
  token: "",
  loading: false,
  initialized: false,
  error: "",

  initializeAuth: async () => {
    if (get().initialized) return get().user;

    const token = readStoredToken();

    if (!token) {
      clearAuthSession();
      resetPrivateStores();
      set({ user: null, token: "", initialized: true, loading: false });
      return null;
    }

    try {
      set({ loading: true, token, error: "" });
      const { data } = await api.get("/auth/me");
      const user = data?.user || data?.data?.user || data?.data || null;

      saveAuthSession({ token, user });
      set({ user, token, initialized: true, loading: false });
      await hydratePrivateStores(user);

      return user;
    } catch (error) {
      get().logout();
      set({
        initialized: true,
        loading: false,
        error: error.response?.data?.message || "Session expired",
      });
      return null;
    }
  },

  login: async (credentials) => {
    try {
      set({ loading: true, error: "" });
      const { data } = await api.post("/auth/login", credentials);
      const { token, user } = extractAuthPayload(data);

      if (!token || !user) {
        throw new Error("Invalid login response");
      }

      saveAuthSession({ token, user });
      set({ user, token, initialized: true, loading: false });
      await hydratePrivateStores(user);

      return { token, user };
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || "Login failed",
      });
      throw error;
    }
  },

  register: async (payload) => {
    try {
      set({ loading: true, error: "" });
      const { data } = await api.post("/auth/register", payload);
      const { token, user } = extractAuthPayload(data);

      if (!token || !user) {
        throw new Error("Invalid register response");
      }

      saveAuthSession({ token, user });
      set({ user, token, initialized: true, loading: false });
      await hydratePrivateStores(user);

      return { token, user };
    } catch (error) {
      set({
        loading: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Registration failed",
      });
      throw error;
    }
  },

  fetchMe: async () => {
    const token = get().token || readStoredToken();

    if (!token) {
      get().logout();
      return null;
    }

    const { data } = await api.get("/auth/me");
    const user = data?.user || data?.data?.user || data?.data || null;

    saveAuthSession({ token, user });
    set({ user, token, initialized: true });
    await hydratePrivateStores(user);

    return user;
  },

  updateProfile: async (payload) => {
    const endpoints = ["/auth/profile", "/auth/me"];
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const { data } = await api.put(endpoint, payload);
        const user = data?.user || data?.data?.user || data?.data || data;
        const token = get().token || readStoredToken();

        saveAuthSession({ token, user });
        set({ user });
        return user;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  },

  logout: () => {
    clearAuthSession();
    resetPrivateStores();
    set({
      user: null,
      token: "",
      loading: false,
      initialized: true,
      error: "",
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nexota:logout"));
    }
  },

  setUser: (user) => {
    const token = get().token || readStoredToken();
    saveAuthSession({ token, user });
    set({ user, token });
    hydratePrivateStores(user);
  },

  setToken: (token) => {
    saveAuthSession({ token, user: get().user });
    set({ token });
  },

  clearError: () => set({ error: "" }),
}));

export default useAuthStore;
