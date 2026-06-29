import { create } from "zustand";
import api from "../services/api";

const getOrderId = (order) => String(order?._id || order?.id || "");

const readOrders = (data) => {
  const list = data?.orders || data?.data || data?.items || [];
  return Array.isArray(list) ? list : [];
};

const hasToken = () =>
  Boolean(
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken"),
  );

const useOrderStore = create((set, get) => ({
  orders: [],
  items: [],
  selectedOrder: null,
  loading: false,
  error: "",

  resetOrders: () => {
    ["orders", "order-storage"].forEach((key) => localStorage.removeItem(key));
    set({
      orders: [],
      items: [],
      selectedOrder: null,
      loading: false,
      error: "",
    });
  },

  fetchOrders: async () => {
    if (!hasToken()) {
      get().resetOrders();
      return [];
    }

    try {
      set({ loading: true, error: "" });
      const { data } = await api.get("/orders");
      const orders = readOrders(data);

      set({
        orders,
        items: orders,
      });

      return orders;
    } catch (error) {
      if (error.response?.status === 401) {
        get().resetOrders();
        return [];
      }

      set({
        error: error.response?.data?.message || "Failed to load orders.",
      });
      return get().orders;
    } finally {
      set({ loading: false });
    }
  },

  fetchOrderById: async (id) => {
    if (!hasToken() || !id) return null;

    try {
      set({ loading: true, error: "" });
      const { data } = await api.get(`/orders/${id}`);
      const order = data?.order || data?.data || null;
      set({ selectedOrder: order });
      return order;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to load order.",
      });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  createOrder: async (payload) => {
    if (!hasToken()) {
      throw new Error("Please login before placing order.");
    }

    const { data } = await api.post("/orders", payload);
    const order = data?.order || data?.data || data;

    set({
      orders: [order, ...get().orders],
      items: [order, ...get().orders],
      selectedOrder: order,
    });

    return order;
  },

  cancelOrder: async (id, reason = "") => {
    const { data } = await api.put(`/orders/${id}/cancel`, { reason });
    const updatedOrder = data?.order || data?.data || data;

    const orders = get().orders.map((order) =>
      getOrderId(order) === String(id) ? updatedOrder : order,
    );

    set({
      orders,
      items: orders,
      selectedOrder:
        getOrderId(get().selectedOrder) === String(id)
          ? updatedOrder
          : get().selectedOrder,
    });

    return updatedOrder;
  },

  updateOrder: async (id, payload) => {
    const { data } = await api.patch(`/orders/${id}`, payload);
    const updatedOrder = data?.order || data?.data || data;

    const orders = get().orders.map((order) =>
      getOrderId(order) === String(id) ? updatedOrder : order,
    );

    set({
      orders,
      items: orders,
      selectedOrder:
        getOrderId(get().selectedOrder) === String(id)
          ? updatedOrder
          : get().selectedOrder,
    });

    return updatedOrder;
  },

  deleteOrder: async (id) => {
    await api.delete(`/orders/${id}`);

    const orders = get().orders.filter(
      (order) => getOrderId(order) !== String(id),
    );

    set({
      orders,
      items: orders,
      selectedOrder:
        getOrderId(get().selectedOrder) === String(id)
          ? null
          : get().selectedOrder,
    });
  },

  addOrder: (order) => {
    const orders = [order, ...get().orders];
    set({ orders, items: orders });
  },
}));

if (typeof window !== "undefined" && !window.__NEXOTA_ORDER_LOGOUT_LISTENER__) {
  window.__NEXOTA_ORDER_LOGOUT_LISTENER__ = true;
  window.addEventListener("nexota:logout", () => {
    useOrderStore.getState().resetOrders();
  });
}

export default useOrderStore;
