import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── API base URL — apne .env se aata hai ─────────────────────────────────────
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Helper: auth token header ────────────────────────────────────────────────
const authHeader = () => {
  const token =
    localStorage.getItem("token") ||
    JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── useAddressStore ──────────────────────────────────────────────────────────
const useAddressStore = create(
  persist(
    (set, get) => ({
      addresses: [],
      loading: false,
      error: null,

      // ── Fetch all addresses ─────────────────────────────────────────────────
      fetchAddresses: async () => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API}/addresses`, {
            headers: {
              "Content-Type": "application/json",
              ...authHeader(),
            },
          });
          if (!res.ok) throw new Error("Failed to fetch addresses");
          const data = await res.json();
          // Backend se array directly ya { addresses: [] } dono handle karta hai
          const list = Array.isArray(data) ? data : data.addresses || [];
          set({ addresses: list, loading: false });
        } catch (err) {
          set({ error: err.message, loading: false });
        }
      },

      // ── Add new address ─────────────────────────────────────────────────────
      addAddress: async (addressData) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API}/addresses`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeader(),
            },
            body: JSON.stringify(addressData),
          });
          if (!res.ok) throw new Error("Failed to add address");
          const newAddress = await res.json();
          const added = newAddress.address || newAddress;

          set((state) => ({
            // Agar pehla address hai toh automatically default ban jaye
            addresses:
              state.addresses.length === 0
                ? [{ ...added, isDefault: true }]
                : [...state.addresses, added],
            loading: false,
          }));
          return { success: true, address: added };
        } catch (err) {
          set({ error: err.message, loading: false });
          return { success: false, error: err.message };
        }
      },

      // ── Update address ──────────────────────────────────────────────────────
      updateAddress: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API}/addresses/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...authHeader(),
            },
            body: JSON.stringify(updates),
          });
          if (!res.ok) throw new Error("Failed to update address");
          const data = await res.json();
          const updated = data.address || data;

          set((state) => ({
            addresses: state.addresses.map((a) =>
              (a.id || a._id) === id ? { ...a, ...updated } : a,
            ),
            loading: false,
          }));
          return { success: true };
        } catch (err) {
          set({ error: err.message, loading: false });
          return { success: false, error: err.message };
        }
      },

      // ── Delete address ──────────────────────────────────────────────────────
      deleteAddress: async (id) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API}/addresses/${id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...authHeader(),
            },
          });
          if (!res.ok) throw new Error("Failed to delete address");

          set((state) => {
            const remaining = state.addresses.filter(
              (a) => (a.id || a._id) !== id,
            );
            // Agar deleted address default tha toh pehle wala default ban jaye
            const wasDefault = state.addresses.find(
              (a) => (a.id || a._id) === id,
            )?.isDefault;
            if (wasDefault && remaining.length > 0) {
              remaining[0].isDefault = true;
            }
            return { addresses: remaining, loading: false };
          });
          return { success: true };
        } catch (err) {
          set({ error: err.message, loading: false });
          return { success: false, error: err.message };
        }
      },

      // ── Set default address ─────────────────────────────────────────────────
      setDefault: async (id) => {
        // Optimistic update — pehle UI update karo, phir API call
        set((state) => ({
          addresses: state.addresses.map((a) => ({
            ...a,
            isDefault: (a.id || a._id) === id,
            default: (a.id || a._id) === id,
          })),
        }));
        try {
          await fetch(`${API}/addresses/${id}/default`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...authHeader(),
            },
          });
        } catch (err) {
          // API fail hone pe revert karo
          set({ error: err.message });
          await get().fetchAddresses();
        }
      },

      // ── Clear error ─────────────────────────────────────────────────────────
      clearError: () => set({ error: null }),

      // ── Reset store (logout pe) ─────────────────────────────────────────────
      reset: () => set({ addresses: [], loading: false, error: null }),
    }),
    {
      name: "address-storage", // localStorage key
      partialize: (state) => ({
        addresses: state.addresses, // sirf addresses persist karo, loading/error nahi
      }),
    },
  ),
);

export default useAddressStore;

// ─── Stable selectors — component mein seedha use karo ───────────────────────
// ✅ Yeh har render pe naya object nahi banega → infinite loop nahi hoga

export const selectAddresses = (s) => s.addresses;
export const selectAddressLoading = (s) => s.loading;
export const selectAddressError = (s) => s.error;

// Default address — stable derived selector
export const selectDefaultAddress = (s) =>
  s.addresses.find((a) => a.isDefault || a.default) ?? s.addresses[0] ?? null;

// Actions — yeh functions stable hote hain Zustand mein, caching ki zarurat nahi
export const selectFetchAddresses = (s) => s.fetchAddresses;
export const selectAddAddress = (s) => s.addAddress;
export const selectUpdateAddress = (s) => s.updateAddress;
export const selectDeleteAddress = (s) => s.deleteAddress;
export const selectSetDefault = (s) => s.setDefault;
export const selectResetAddresses = (s) => s.reset;
