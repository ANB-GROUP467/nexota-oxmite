import api from "../services/api";

export const cancelOrder = async (orderId, reason = "") => {
  const { data } = await api.put(`/orders/${orderId}/cancel`, { reason });
  return data.order || data.data || data;
};

export const deleteOrder = async (orderId) => {
  const { data } = await api.delete(`/orders/${orderId}`);
  return data;
};

export const updateOrder = async (orderId, payload) => {
  const { data } = await api.put(`/orders/${orderId}`, payload);
  return data.order || data.data || data;
};

export const updateOrderStatus = async (orderId, payload) => {
  const { data } = await api.patch(`/orders/${orderId}/status`, payload);
  return data.order || data.data || data;
};
