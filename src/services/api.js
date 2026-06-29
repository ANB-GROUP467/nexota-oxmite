import axios from "axios";

const api = axios.create({
  baseURL: "https://backend-for-nexota-ecommerce-fyob.vercel.app/api",
});
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

api.interceptors.request.use((config) => {
  const token = readTokenFromStorage();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nexota:unauthorized"));
    }

    return Promise.reject(error);
  },
);

export default api;
