import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import useOrderStore from "../store/useOrderStore";
import useAuthStore from "../store/useAuthStore";
import api from "../services/api";
import {
  Package,
  Calendar,
  CreditCard,
  Truck,
  Loader2,
  XCircle,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Clock,
  Zap,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

/* ─── Fonts (add once in index.html) ──────────────────────────────────────
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Geist:wght@700;800;900&display=swap" rel="stylesheet" />
────────────────────────────────────────────────────────────────────────── */

const formatQAR = (amount) =>
  `QAR ${Number(amount || 0).toLocaleString("en-QA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-QA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const parseJson = (v) => {
  try {
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};
const findToken = (v) => {
  if (!v || typeof v !== "object") return "";
  if (typeof v.token === "string") return v.token;
  if (typeof v.accessToken === "string") return v.accessToken;
  if (typeof v.jwt === "string") return v.jwt;
  return findToken(v.state) || findToken(v.auth) || "";
};
const getStoredToken = () => {
  const d =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");
  if (d) return d;
  for (let i = 0; i < localStorage.length; i += 1) {
    const t = findToken(parseJson(localStorage.getItem(localStorage.key(i))));
    if (t) return t;
  }
  return "";
};

const getOrderId = (o) => o?._id || o?.id || "";
const normalizeOrderItem = (item) => {
  const p =
    item.product && typeof item.product === "object" ? item.product : null;
  return {
    id: item._id || item.id || p?._id || item.product,
    title: item.title || item.name || p?.title || "Product",
    image:
      item.image || item.images?.[0] || p?.images?.[0] || "/placeholder.png",
    price: Number(item.price || p?.price || 0),
    quantity: item.quantity || item.qty || 1,
  };
};
const normalizeOrder = (o) => ({
  ...o,
  id: getOrderId(o),
  date: o.date || o.createdAt || o.updatedAt,
  status: o.status || o.orderStatus || "Pending",
  paymentMethod: o.paymentMethod || "N/A",
  total: o.total || o.totalAmount || o.totalPrice || 0,
  items: (o.items || o.orderItems || []).map(normalizeOrderItem),
});

const canCancelOrder = (s) =>
  ["pending", "processing"].includes(String(s || "").toLowerCase());
const canDeleteOrder = (s) =>
  ["cancelled", "delivered"].includes(String(s || "").toLowerCase());

/* ── Status config ── */
const STATUS = {
  Pending: {
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  Processing: {
    icon: Zap,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  Shipped: {
    icon: Truck,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    dot: "bg-violet-500",
  },
  Delivered: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  Cancelled: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  Returned: {
    icon: RotateCcw,
    color: "text-gray-500",
    bg: "bg-gray-50",
    border: "border-gray-200",
    dot: "bg-gray-400",
  },
};
const getSC = (s) => STATUS[s] || STATUS.Pending;

/* ══════════════════════════════════════
   EMPTY STATE ILLUSTRATION
══════════════════════════════════════ */
function EmptyOrdersSVG() {
  return (
    <svg
      viewBox="0 0 520 380"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[300px] mx-auto"
      aria-hidden="true"
    >
      {/* Ground shadow */}
      <ellipse
        cx="260"
        cy="355"
        rx="110"
        ry="11"
        fill="#dbeafe"
        opacity="0.55"
      />

      {/* ── Clipboard / order sheet ── */}
      <rect
        x="140"
        y="60"
        width="240"
        height="270"
        rx="16"
        fill="white"
        stroke="#e2e8f0"
        strokeWidth="2"
      />
      {/* clip top bar */}
      <rect x="210" y="48" width="100" height="26" rx="13" fill="#3b82f6" />
      <rect
        x="228"
        y="54"
        width="64"
        height="14"
        rx="7"
        fill="white"
        opacity="0.35"
      />

      {/* ── Lines on clipboard ── */}
      {/* Header row */}
      <rect x="162" y="98" width="80" height="10" rx="5" fill="#BFDBFE" />
      <rect x="256" y="98" width="50" height="10" rx="5" fill="#BFDBFE" />
      <rect x="320" y="98" width="44" height="10" rx="5" fill="#BFDBFE" />

      {/* Row 1 */}
      <rect
        x="162"
        y="126"
        width="30"
        height="30"
        rx="8"
        fill="#EFF6FF"
        stroke="#BFDBFE"
        strokeWidth="1.5"
      />
      <rect x="202" y="130" width="90" height="8" rx="4" fill="#e2e8f0" />
      <rect x="202" y="143" width="60" height="6" rx="3" fill="#f1f5f9" />
      <rect x="320" y="132" width="44" height="8" rx="4" fill="#BFDBFE" />

      {/* Row 2 */}
      <rect
        x="162"
        y="170"
        width="30"
        height="30"
        rx="8"
        fill="#EFF6FF"
        stroke="#BFDBFE"
        strokeWidth="1.5"
      />
      <rect x="202" y="174" width="110" height="8" rx="4" fill="#e2e8f0" />
      <rect x="202" y="187" width="70" height="6" rx="3" fill="#f1f5f9" />
      <rect x="320" y="176" width="44" height="8" rx="4" fill="#BFDBFE" />

      {/* Row 3 — faded / empty */}
      <rect
        x="162"
        y="214"
        width="30"
        height="30"
        rx="8"
        fill="#f8fafc"
        stroke="#e2e8f0"
        strokeWidth="1.5"
      />
      <rect x="202" y="218" width="70" height="8" rx="4" fill="#f1f5f9" />
      <rect x="202" y="231" width="40" height="6" rx="3" fill="#f8fafc" />
      <rect x="320" y="220" width="44" height="8" rx="4" fill="#f1f5f9" />

      {/* Total row */}
      <rect x="162" y="258" width="196" height="1.5" rx="1" fill="#e2e8f0" />
      <rect x="260" y="270" width="98" height="12" rx="6" fill="#BFDBFE" />

      {/* ── Big question mark ── */}
      <circle
        cx="260"
        cy="200"
        r="44"
        fill="white"
        stroke="#BFDBFE"
        strokeWidth="2"
      />

      {/* ? glyph */}
      <text
        x="260"
        y="213"
        textAnchor="middle"
        fontFamily="'Geist', sans-serif"
        fontWeight="900"
        fontSize="40"
        fill="#3b82f6"
      >
        ?
      </text>

      {/* ── Floating x marks ── */}
      {[
        [95, 120, 10, "#F59E0B"],
        [415, 135, 10, "#F59E0B"],
        [88, 240, 8, "#93C5FD"],
        [422, 250, 8, "#93C5FD"],
        [105, 310, 7, "#F59E0B"],
        [408, 190, 7, "#93C5FD"],
      ].map(([cx, cy, r, c], i) => (
        <g key={i}>
          <line
            x1={cx - r}
            y1={cy - r}
            x2={cx + r}
            y2={cy + r}
            stroke={c}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1={cx + r}
            y1={cy - r}
            x2={cx - r}
            y2={cy + r}
            stroke={c}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      ))}

      {/* ── Floating dots ── */}
      {[
        [82, 170, 5, "#BFDBFE"],
        [432, 170, 4, "#BFDBFE"],
        [100, 290, 3.5, "#FDE68A"],
        [418, 300, 3.5, "#FDE68A"],
        [430, 90, 3, "#BFDBFE"],
        [90, 80, 3, "#FDE68A"],
      ].map(([cx, cy, r, f], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={f} opacity="0.75" />
      ))}
    </svg>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
function Orders() {
  const localOrders = useOrderStore((s) => s.orders || []);
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      const { data } = await api.put(`/orders/${orderId}/cancel`, {
        reason: "Cancelled by customer",
      });
      const updated = normalizeOrder(data.order || data.data);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel order.");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Delete this order from your history?")) return;
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete order.");
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchOrders = async () => {
      const authToken = token || getStoredToken();
      if (!authToken) {
        navigate("/login");
        return;
      }
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get("/orders", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!mounted) return;
        const list = data?.orders || data?.data || [];
        setOrders(
          (Array.isArray(list) ? list : localOrders).map(normalizeOrder),
        );
      } catch (err) {
        if (!mounted) return;
        if (err.response?.status === 401) {
          navigate("/login");
          return;
        }
        setError(err.response?.data?.message || "Failed to load orders.");
        setOrders((localOrders || []).map(normalizeOrder));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchOrders();
    return () => {
      mounted = false;
    };
  }, [localOrders, navigate, token]);

  /* ── Loading ── */
  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Loader2 size={28} className="text-[#015DF0] animate-spin" />
          </div>
          <p
            className="text-gray-400 text-sm"
            style={{ fontFamily: "'Inter',sans-serif" }}
          >
            Loading your orders…
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Geist:wght@700;800;900&display=swap');`}</style>

      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
        style={{ fontFamily: "'Inter',sans-serif" }}
      >
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-xs font-semibold text-[#015DF0] uppercase tracking-widest mb-1">
            Account
          </p>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1
              className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight"
              style={{ fontFamily: "'Geist',sans-serif" }}
            >
              My Orders
            </h1>
            {orders.length > 0 && (
              <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                {orders.length} order{orders.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="mt-2 text-gray-400 text-sm">
            View and track all your orders
          </p>
        </motion.div>

        {/* ── Empty state ── */}
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-14 flex flex-col items-center text-center"
          >
            <EmptyOrdersSVG />

            <h2
              className="mt-6 text-2xl font-black text-gray-900"
              style={{ fontFamily: "'Geist',sans-serif" }}
            >
              No Orders Yet
            </h2>
            <p className="mt-2 text-gray-400 text-sm max-w-xs">
              {error ||
                "Looks like you haven't placed any orders. Start shopping to see them here!"}
            </p>

            {/* CTA button */}
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-8 inline-flex items-center gap-2.5 bg-[#015DF0] hover:bg-[#0A4CD6] text-white px-7 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-md shadow-blue-200"
                style={{ fontFamily: "'Geist',sans-serif" }}
              >
                <ShoppingBag size={16} />
                Browse Products
                <ArrowRight size={15} />
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          /* ── Orders list ── */
          <div className="space-y-4">
            <AnimatePresence>
              {orders.map((order, idx) => {
                const sc = getSC(order.status);
                const StatusIcon = sc.icon;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -24, scale: 0.97 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    {/* Card top accent strip */}
                    <div className={`h-1 w-full ${sc.dot}`} />

                    <div className="p-5 sm:p-6">
                      {/* ── Header row ── */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              className="font-black text-lg text-gray-900"
                              style={{ fontFamily: "'Geist',sans-serif" }}
                            >
                              Order #{String(order.id).slice(-6).toUpperCase()}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
                            <Calendar size={12} />
                            {formatDate(order.date)}
                          </div>
                        </div>

                        {/* Status badge */}
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold w-fit ${sc.bg} ${sc.border} ${sc.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`}
                          />
                          <StatusIcon size={12} />
                          {order.status}
                        </div>
                      </div>

                      {/* ── Meta row ── */}
                      <div className="grid grid-cols-3 gap-3 mt-5 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Payment
                          </p>
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                            <CreditCard size={13} className="text-gray-400" />
                            <span className="truncate">
                              {order.paymentMethod}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Items
                          </p>
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                            <Package size={13} className="text-gray-400" />
                            {order.items.length} product
                            {order.items.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Total
                          </p>
                          <p
                            className="text-sm font-black text-[#015DF0]"
                            style={{ fontFamily: "'Geist',sans-serif" }}
                          >
                            {formatQAR(order.total)}
                          </p>
                        </div>
                      </div>

                      {/* ── Product thumbnails ── */}
                      {order.items.length > 0 && (
                        <div className="mt-4 space-y-2.5">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all"
                            >
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-semibold text-gray-800 line-clamp-1">
                                  {item.title}
                                </h5>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Qty: {item.quantity} · {formatQAR(item.price)}
                                </p>
                              </div>
                              <span
                                className="text-sm font-black text-gray-800 shrink-0"
                                style={{ fontFamily: "'Geist',sans-serif" }}
                              >
                                {formatQAR(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ── Action row ── */}
                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        <Link to={`/orders/${order.id}`}>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-1.5 bg-[#015DF0] hover:bg-[#0A4CD6] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-200"
                            style={{ fontFamily: "'Geist',sans-serif" }}
                          >
                            View Details
                            <ChevronRight size={13} />
                          </motion.button>
                        </Link>

                        {canCancelOrder(order.status) && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all"
                          >
                            <XCircle size={13} />
                            Cancel Order
                          </button>
                        )}

                        {canDeleteOrder(order.status) && (
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 transition-all"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        )}

                        {/* Track */}
                        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
                          <Truck size={13} />
                          <span className="hidden sm:inline">
                            Track from dashboard
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Browse more */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center pt-4"
            >
              <Link to="/">
                <button
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#015DF0] hover:underline"
                  style={{ fontFamily: "'Geist',sans-serif" }}
                >
                  <ShoppingBag size={15} />
                  Browse More Products
                  <ArrowRight size={14} />
                </button>
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default Orders;
