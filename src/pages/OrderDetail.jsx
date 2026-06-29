import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  Loader2,
  LockKeyhole,
  MapPin,
  PackageCheck,
  PackageSearch,
  Receipt,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import useAuthStore from "../store/useAuthStore";
import useOrderStore from "../store/useOrderStore";
import api from "../services/api";
import { formatQAR, getCartItemPricing, roundMoney } from "../services/price";

const EMPTY_ARRAY = [];
const BRAND_NAVY = "#0D1B3E";
const BRAND_BLUE = "#015DF0";
const BRAND_YELLOW = "#FEEE00";

const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Refunded"];

const TRACKING_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

const STATUS_CONFIG = {
  Pending: {
    icon: Clock,
    label: "Pending",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
  },
  Processing: {
    icon: RefreshCw,
    label: "Processing",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  Shipped: {
    icon: Truck,
    label: "Shipped",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  Delivered: {
    icon: CheckCircle2,
    label: "Delivered",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  Cancelled: {
    icon: XCircle,
    label: "Cancelled",
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  Returned: {
    icon: RotateCcw,
    label: "Returned",
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
};

const normalizeStatus = (value) => {
  const status = String(value || "Pending").trim();
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const statusConfig = (status) =>
  STATUS_CONFIG[normalizeStatus(status)] || STATUS_CONFIG.Pending;

const parseJson = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const findToken = (value) => {
  if (!value || typeof value !== "object") return "";
  if (typeof value.token === "string") return value.token;
  if (typeof value.accessToken === "string") return value.accessToken;
  if (typeof value.jwt === "string") return value.jwt;
  return findToken(value.state) || findToken(value.auth) || "";
};

const getStoredToken = () => {
  const direct =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");

  if (direct) return direct;

  for (let i = 0; i < localStorage.length; i += 1) {
    const token = findToken(
      parseJson(localStorage.getItem(localStorage.key(i))),
    );
    if (token) return token;
  }

  return "";
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object")
    return value._id || value.id || value.$oid || "";
  return String(value);
};

const formatDate = (value, withTime = false) => {
  if (!value) return "N/A";
  const date = new Date(value?.$date || value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-QA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

const numberValue = (...values) => {
  const found = values.find(
    (value) => value !== undefined && value !== null && value !== "",
  );
  const numeric = Number(found);
  return Number.isFinite(numeric) ? numeric : 0;
};

const firstArray = (...values) =>
  values.find((value) => Array.isArray(value)) || EMPTY_ARRAY;

const extractApiOrder = (data) =>
  data?.order ||
  data?.data?.order ||
  data?.data ||
  data?.result ||
  data ||
  null;

const getAddressLines = (address = {}) => {
  const lineOne = [
    address.address,
    address.street,
    address.building && `Building ${address.building}`,
    address.floor && `Floor ${address.floor}`,
    address.apartment && `Apt ${address.apartment}`,
  ].filter(Boolean);

  const lineTwo = [
    address.area,
    address.zone && `Zone ${address.zone}`,
    address.city,
    address.country,
    address.postalCode,
  ].filter(Boolean);

  return [lineOne.join(", "), lineTwo.join(", ")].filter(Boolean);
};

const getMapUrl = (address = {}) => {
  if (address.mapUrl) return address.mapUrl;
  if (address.latitude && address.longitude) {
    return `https://www.google.com/maps?q=${address.latitude},${address.longitude}`;
  }
  return "";
};

const normalizeOrderItem = (item = {}) => {
  const product =
    item.product && typeof item.product === "object" ? item.product : {};
  const productId = getId(product) || getId(item.product) || getId(item);
  const quantity = numberValue(item.quantity, item.qty, 1) || 1;
  const title =
    item.title || item.name || product.title || product.name || "Product";
  const image =
    item.image ||
    item.thumbnail ||
    item.images?.[0] ||
    product.image ||
    product.thumbnail ||
    product.images?.[0] ||
    "/placeholder.png";

  const merged = {
    ...product,
    ...item,
    _id: productId,
    id: productId,
    title,
    image,
    images: item.images || product.images || [image],
    quantity,
  };

  const pricing = getCartItemPricing(merged);
  const unitPrice = numberValue(
    item.finalPrice,
    item.price,
    item.salePrice,
    pricing.finalPrice,
    product.finalPrice,
    product.price,
  );
  const originalUnitPrice = numberValue(
    item.originalPrice,
    item.oldPrice,
    pricing.originalPrice,
    product.oldPrice,
    product.originalPrice,
    unitPrice,
  );
  const discountPercent = numberValue(
    item.discountPercent,
    item.discountPercentage,
    pricing.discountPercent,
    product.discountPercent,
    product.discountPercentage,
  );
  const lineTotal = roundMoney(
    numberValue(item.lineTotal, item.total, unitPrice * quantity),
  );
  const originalLineTotal = roundMoney(
    numberValue(item.originalLineTotal, originalUnitPrice * quantity),
  );
  const explicitDiscount = numberValue(item.discountAmount);
  const computedDiscount = roundMoney(originalLineTotal - lineTotal);
  const discountAmount = roundMoney(
    Math.max(explicitDiscount, computedDiscount, 0),
  );

  return {
    id:
      item.variantId ||
      item.variantSku ||
      productId ||
      item._id ||
      item.id ||
      title,
    productId,
    variantId: item.variantId || "",
    variantSku: item.variantSku || item.sku || "",
    selectedOptions: item.selectedOptions || {},
    title,
    image,
    quantity,
    price: unitPrice,
    originalPrice: originalUnitPrice,
    discountPercent,
    discountAmount: Math.max(discountAmount, 0),
    lineTotal,
    originalLineTotal,
    product: merged,
  };
};

const getSelectedOptionEntries = (item) =>
  Object.entries(item.selectedOptions || {}).filter(([, value]) => value);

const calculateSummary = (order, items) => {
  const originalItemsTotal = roundMoney(
    items.reduce((sum, item) => sum + item.originalLineTotal, 0),
  );
  const itemsTotal = roundMoney(
    items.reduce((sum, item) => sum + item.lineTotal, 0),
  );
  const itemDiscount = roundMoney(
    items.reduce((sum, item) => sum + item.discountAmount, 0),
  );

  const originalSubtotal = numberValue(
    order.originalSubtotal,
    order.originalItemsPrice,
    order.itemsOriginalPrice,
    originalItemsTotal,
  );
  const subtotal = numberValue(
    order.subtotal,
    order.itemsPrice,
    order.productsTotal,
    order.itemsTotal,
    itemsTotal,
  );
  const explicitProductDiscount = numberValue(
    order.productDiscount,
    order.productDiscountTotal,
    order.itemsDiscount,
  );
  const productDiscount = Math.max(explicitProductDiscount, itemDiscount);
  const couponDiscount = numberValue(
    order.couponDiscount,
    order.discount,
    order.discountAmount,
    order.coupon?.discount,
  );
  const shipping = numberValue(
    order.shippingFee,
    order.shippingPrice,
    order.deliveryFee,
  );
  const vat = numberValue(
    order.vat,
    order.tax,
    order.taxPrice,
    order.vatAmount,
  );
  const total = numberValue(
    order.totalAmount,
    order.totalPrice,
    order.total,
    subtotal + shipping + vat - couponDiscount,
  );

  return {
    originalSubtotal: roundMoney(originalSubtotal),
    subtotal: roundMoney(subtotal),
    productDiscount: roundMoney(productDiscount),
    couponDiscount: roundMoney(couponDiscount),
    shipping: roundMoney(shipping),
    vat: roundMoney(vat),
    total: roundMoney(total),
  };
};

const normalizeOrder = (raw = {}) => {
  const items = firstArray(raw.items, raw.orderItems, raw.products).map(
    normalizeOrderItem,
  );
  const status = normalizeStatus(raw.orderStatus || raw.status);
  const shippingAddress =
    raw.shippingAddress || raw.address || raw.deliveryAddress || {};
  const summary = calculateSummary(raw, items);

  return {
    ...raw,
    id: getId(raw) || raw.orderId || raw.orderNumber || "",
    orderNumber:
      raw.orderNumber || raw.invoiceNumber || raw.orderId || getId(raw),
    user: raw.user || raw.customer || null,
    date: raw.createdAt || raw.date || raw.orderedAt || raw.updatedAt,
    updatedAt: raw.updatedAt,
    deliveredAt: raw.deliveredAt,
    cancelledAt: raw.cancelledAt,
    cancelReason: raw.cancelReason || raw.reason || "",
    status,
    paymentStatus: raw.paymentStatus || (raw.isPaid ? "Paid" : "Pending"),
    paymentMethod: raw.paymentMethod || raw.payment?.method || "COD",
    trackingNumber: raw.trackingNumber || raw.trackingId || "",
    courier: raw.courier || raw.shippingCarrier || "",
    adminNote: raw.adminNote || "",
    note: raw.note || raw.customerNote || "",
    shippingAddress,
    items,
    summary,
  };
};

const canCancelOrder = (status) =>
  ["pending", "processing"].includes(String(status || "").toLowerCase());

const canDeleteOrder = (status) =>
  ["cancelled", "delivered", "returned"].includes(
    String(status || "").toLowerCase(),
  );

const canEditOrder = (status) =>
  ["pending", "processing"].includes(String(status || "").toLowerCase());

function AccountRequiredState({ orderId }) {
  const openAuth = () => {
    window.dispatchEvent(
      new CustomEvent("nexota:auth-required", {
        detail: {
          intent: "orders",
          redirectTo: `/orders/${orderId}`,
          title: "Login to view this order",
          mode: "login",
          startStep: "identifier",
        },
      }),
    );
  };

  return (
    <MainLayout>
      <main className="bg-[#f6f7fb] px-4 py-14">
        <div className="mx-auto flex min-h-[520px] max-w-3xl flex-col items-center justify-center text-center">
          <div className="relative h-56 w-72">
            <div className="absolute bottom-4 left-1/2 h-2 w-64 -translate-x-1/2 rounded-full bg-slate-200" />
            <div className="absolute left-1/2 top-4 h-40 w-32 -translate-x-1/2 rounded-lg border-4 border-slate-300 bg-white">
              <div className="absolute -right-1 -top-1 h-12 w-12 rounded-bl-lg border-b-4 border-l-4 border-slate-300 bg-[#f6f7fb]" />
              <div className="mx-auto mt-12 grid h-12 w-12 place-items-center rounded-full bg-slate-100">
                <LockKeyhole size={26} className="text-white" fill="#CBD5E1" />
              </div>
              <div className="mx-auto mt-5 h-3 w-16 rounded-full bg-slate-200" />
              <div className="mx-auto mt-4 h-3 w-20 rounded-full bg-slate-200" />
            </div>
            <div
              className="absolute left-8 top-12 grid h-16 w-16 place-items-center rounded-full border-4 border-yellow-300 shadow-sm"
              style={{ backgroundColor: BRAND_YELLOW }}
            >
              <span
                className="text-3xl font-black"
                style={{ color: BRAND_NAVY }}
              >
                !
              </span>
            </div>
            <div className="absolute right-8 top-24 grid h-12 w-12 place-items-center rounded-xl bg-blue-50">
              <PackageSearch size={26} style={{ color: BRAND_BLUE }} />
            </div>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold text-slate-800">
            Account required
          </h1>
          <p className="mt-3 text-lg font-medium text-slate-500">
            Please sign in or register to see this order
          </p>
          <button
            type="button"
            onClick={openAuth}
            className="mt-8 h-14 rounded-lg px-8 text-base font-extrabold uppercase text-white shadow-sm transition hover:brightness-95"
            style={{ backgroundColor: BRAND_BLUE }}
          >
            Login/Signup
          </button>
        </div>
      </main>
    </MainLayout>
  );
}

function Card({ children, className = "" }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`}
    >
      {children}
    </motion.section>
  );
}

function StatusBadge({ status }) {
  const config = statusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-extrabold ${config.badge}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      <Icon size={15} />
      {config.label}
    </span>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  positive = false,
  negative = false,
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-3 ${
        strong ? "text-lg font-black text-slate-950" : "text-sm"
      }`}
    >
      <span className={strong ? "" : "text-slate-500"}>{label}</span>
      <span
        className={`font-bold ${
          positive
            ? "text-emerald-600"
            : negative
              ? "text-red-600"
              : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#015DF0] focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

function EditOrderModal({ order, updating, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    paymentMethod: order.paymentMethod || "COD",
    fullName: order.shippingAddress.fullName || "",
    phone: order.shippingAddress.phone || "",
    country: order.shippingAddress.country || "",
    city: order.shippingAddress.city || "",
    area: order.shippingAddress.area || "",
    street: order.shippingAddress.street || order.shippingAddress.address || "",
    building: order.shippingAddress.building || "",
    floor: order.shippingAddress.floor || "",
    apartment: order.shippingAddress.apartment || "",
    zone: order.shippingAddress.zone || "",
    landmark: order.shippingAddress.landmark || "",
    deliveryInstructions: order.shippingAddress.deliveryInstructions || "",
  }));

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      paymentMethod: form.paymentMethod,
      shippingAddress: {
        fullName: form.fullName,
        phone: form.phone,
        country: form.country,
        city: form.city,
        area: form.area,
        street: form.street,
        address: form.street,
        building: form.building,
        floor: form.floor,
        apartment: form.apartment,
        zone: form.zone,
        landmark: form.landmark,
        deliveryInstructions: form.deliveryInstructions,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <motion.form
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">Update Order</h2>
            <p className="text-sm text-slate-500">
              You can edit pending or processing order details.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Payment method
            </span>
            <select
              value={form.paymentMethod}
              onChange={(event) => update("paymentMethod", event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#015DF0] focus:ring-4 focus:ring-blue-50"
            >
              <option value="COD">Cash on Delivery</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="QPAY">QPay</option>
              <option value="NAPS">NAPS</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </label>

          <TextInput
            label="Full name"
            value={form.fullName}
            onChange={(v) => update("fullName", v)}
          />
          <TextInput
            label="Phone"
            value={form.phone}
            onChange={(v) => update("phone", v)}
          />
          <TextInput
            label="Country"
            value={form.country}
            onChange={(v) => update("country", v)}
          />
          <TextInput
            label="City"
            value={form.city}
            onChange={(v) => update("city", v)}
          />
          <TextInput
            label="Area"
            value={form.area}
            onChange={(v) => update("area", v)}
          />
          <TextInput
            label="Zone"
            value={form.zone}
            onChange={(v) => update("zone", v)}
          />
          <TextInput
            label="Street address"
            value={form.street}
            onChange={(v) => update("street", v)}
          />
          <TextInput
            label="Building"
            value={form.building}
            onChange={(v) => update("building", v)}
          />
          <TextInput
            label="Floor"
            value={form.floor}
            onChange={(v) => update("floor", v)}
          />
          <TextInput
            label="Apartment"
            value={form.apartment}
            onChange={(v) => update("apartment", v)}
          />
          <TextInput
            label="Landmark"
            value={form.landmark}
            onChange={(v) => update("landmark", v)}
          />
          <TextInput
            label="Delivery instructions"
            value={form.deliveryInstructions}
            onChange={(v) => update("deliveryInstructions", v)}
          />
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updating}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#015DF0] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#0A4CD6] disabled:opacity-60"
          >
            {updating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Changes
          </button>
        </div>
      </motion.form>
    </div>
  );
}

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const localOrders = useOrderStore((state) => state.orders || EMPTY_ARRAY);
  const token = useAuthStore((state) => state.token || state.accessToken || "");
  const user = useAuthStore((state) => state.user || null);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("Pending");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("Pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const authToken = token || getStoredToken();
  const isLoggedIn = Boolean(authToken);
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const authHeaders = useMemo(
    () =>
      authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {},
    [authToken],
  );

  const setNormalizedOrder = useCallback((value) => {
    const normalized = value ? normalizeOrder(value) : null;
    setOrder(normalized);
    setSelectedStatus(normalized?.status || "Pending");
    setSelectedPaymentStatus(normalized?.paymentStatus || "Pending");
    setTrackingNumber(normalized?.trackingNumber || "");
    setAdminNote(normalized?.adminNote || "");
  }, []);

  const fetchOrder = useCallback(async () => {
    if (!authToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await api.get(`/orders/${id}`, authHeaders);
      setNormalizedOrder(extractApiOrder(data));
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Please login again to view this order.");
        setNormalizedOrder(null);
        return;
      }

      const fallback = localOrders.find(
        (item) => String(item.id || item._id || item.orderId) === String(id),
      );

      if (fallback) {
        setNormalizedOrder(fallback);
        return;
      }

      console.error("Order details fetch error:", err);
      setError(err.response?.data?.message || "Order not found.");
      setNormalizedOrder(null);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, authToken, id, localOrders, setNormalizedOrder]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const updateOrderFromResponse = (data) => {
    const updated = extractApiOrder(data);
    if (updated) setNormalizedOrder(updated);
  };

  const handleCancelOrder = async () => {
    const reason = window.prompt("Cancel reason", "Cancelled by customer");
    if (reason === null) return;

    try {
      setUpdating(true);
      const { data } = await api.put(
        `/orders/${id}/cancel`,
        { reason },
        authHeaders,
      );
      updateOrderFromResponse(data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = async () => {
    const confirmed = window.confirm("Delete this order from your history?");
    if (!confirmed) return;

    try {
      setUpdating(true);
      await api.delete(`/orders/${id}`, authHeaders);
      navigate("/orders");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete order.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveOrder = async (payload) => {
    try {
      setUpdating(true);
      const { data } = await api.put(`/orders/${id}`, payload, authHeaders);
      updateOrderFromResponse(data);
      setShowEdit(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update order.");
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      setUpdating(true);
      const { data } = await api.patch(
        `/orders/${id}/status`,
        {
          status: selectedStatus,
          paymentStatus: selectedPaymentStatus,
          trackingNumber,
          adminNote,
        },
        authHeaders,
      );
      updateOrderFromResponse(data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update order status.");
    } finally {
      setUpdating(false);
    }
  };

  if (!isLoggedIn) {
    return <AccountRequiredState orderId={id} />;
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-5xl px-4 py-12">
          <Card className="p-12 text-center">
            <Loader2
              size={42}
              className="mx-auto animate-spin text-[#015DF0]"
            />
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Loading order details...
            </p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-5xl px-4 py-12">
          <Card className="p-12 text-center">
            <PackageSearch size={64} className="mx-auto text-slate-300" />
            <h1 className="mt-5 text-2xl font-black text-slate-950">
              Order Not Found
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">
              {error || "We could not find this order."}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={fetchOrder}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw size={16} />
                Retry
              </button>
              <Link
                to="/orders"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#015DF0] px-5 text-sm font-black text-white hover:bg-[#0A4CD6]"
              >
                <ArrowLeft size={16} />
                Back to Orders
              </Link>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const config = statusConfig(order.status);
  const StatusIcon = config.icon;
  const stepIndex = TRACKING_STEPS.indexOf(order.status);
  const mapUrl = getMapUrl(order.shippingAddress);
  const addressLines = getAddressLines(order.shippingAddress);
  const editable = canEditOrder(order.status) || isAdmin;
  const cancellable = canCancelOrder(order.status) || isAdmin;
  const deletable = canDeleteOrder(order.status) || isAdmin;

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f6f7fb]">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
          <nav className="mb-5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Link to="/" className="hover:text-[#015DF0]">
              Home
            </Link>
            <ChevronRight size={12} />
            <Link to="/orders" className="hover:text-[#015DF0]">
              Orders
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-900">
              #
              {String(order.orderNumber || order.id)
                .slice(-8)
                .toUpperCase()}
            </span>
          </nav>

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                to="/orders"
                className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#015DF0]"
              >
                <ArrowLeft size={16} />
                Back to Orders
              </Link>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Order{" "}
                <span className="text-[#015DF0]">
                  #
                  {String(order.orderNumber || order.id)
                    .slice(-8)
                    .toUpperCase()}
                </span>
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Placed on {formatDate(order.date, true)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge status={order.status} />
              {editable && (
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 size={16} />
                  Update
                </button>
              )}
              {cancellable && order.status !== "Cancelled" && (
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={updating}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 text-sm font-extrabold text-red-600 hover:bg-red-100 disabled:opacity-60"
                >
                  <XCircle size={16} />
                  Cancel
                </button>
              )}
              {deletable && (
                <button
                  type="button"
                  onClick={handleDeleteOrder}
                  disabled={updating}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
            </div>
          </div>

          {isAdmin && (
            <Card className="mb-6 p-5">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#015DF0]" />
                <h2 className="text-lg font-black text-slate-950">
                  Admin Controls
                </h2>
              </div>
              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr_1.5fr_auto]">
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#015DF0]"
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedPaymentStatus}
                  onChange={(event) =>
                    setSelectedPaymentStatus(event.target.value)
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#015DF0]"
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <input
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                  placeholder="Tracking number"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#015DF0]"
                />
                <input
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  placeholder="Admin note"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#015DF0]"
                />
                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#015DF0] px-5 text-sm font-black text-white hover:bg-[#0A4CD6] disabled:opacity-60"
                >
                  {updating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save
                </button>
              </div>
            </Card>
          )}

          {order.status === "Cancelled" && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <div className="flex gap-2">
                <AlertTriangle size={18} className="shrink-0" />
                <p>
                  This order was cancelled
                  {order.cancelledAt
                    ? ` on ${formatDate(order.cancelledAt, true)}`
                    : ""}
                  .{order.cancelReason ? ` Reason: ${order.cancelReason}` : ""}
                </p>
              </div>
            </div>
          )}

          {order.status !== "Cancelled" && (
            <Card className="mb-6 p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <StatusIcon size={18} className="text-[#015DF0]" />
                  <h2 className="text-lg font-black text-slate-950">
                    Order Progress
                  </h2>
                </div>
                {order.trackingNumber && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    Track: {order.trackingNumber}
                  </span>
                )}
              </div>

              <div className="relative grid grid-cols-4 gap-2">
                <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-100" />
                <div
                  className="absolute left-0 top-4 h-0.5 bg-[#015DF0] transition-all"
                  style={{
                    width:
                      stepIndex <= 0
                        ? "0%"
                        : `${(stepIndex / (TRACKING_STEPS.length - 1)) * 100}%`,
                  }}
                />
                {TRACKING_STEPS.map((step, index) => {
                  const done = stepIndex >= index;
                  return (
                    <div
                      key={step}
                      className="relative z-10 flex flex-col items-center gap-2"
                    >
                      <div
                        className={`grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-black ${
                          done
                            ? "border-[#015DF0] bg-[#015DF0] text-white"
                            : "border-slate-200 bg-white text-slate-300"
                        }`}
                      >
                        {done && index < stepIndex ? (
                          <CheckCircle2 size={15} />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={`text-center text-[11px] font-black sm:text-xs ${
                          done ? "text-[#015DF0]" : "text-slate-300"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
            <div className="space-y-6">
              <Card>
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <PackageCheck size={18} className="text-[#015DF0]" />
                    <h2 className="text-lg font-black text-slate-950">
                      Products
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {order.items.map((item, index) => (
                      <motion.div
                        key={`${item.productId}-${item.variantId || item.variantSku || "base"}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="grid grid-cols-[76px_1fr] gap-4 p-5 sm:grid-cols-[88px_1fr_auto]"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-20 w-20 rounded-2xl border border-slate-100 object-cover sm:h-22 sm:w-22"
                          onError={(event) => {
                            event.currentTarget.src = "/placeholder.png";
                          }}
                        />
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-sm font-black text-slate-950 sm:text-base">
                            {item.title}
                          </h3>
                          {getSelectedOptionEntries(item).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {getSelectedOptionEntries(item).map(
                                ([key, value]) => (
                                  <span
                                    key={key}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold capitalize text-slate-600"
                                  >
                                    {key}: {value}
                                  </span>
                                ),
                              )}
                              {item.variantSku && (
                                <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black text-[#015DF0]">
                                  SKU: {item.variantSku}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                              Qty: {item.quantity}
                            </span>
                            {item.discountPercent > 0 && (
                              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-600">
                                -{item.discountPercent}%
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-xs font-semibold text-slate-500">
                            {formatQAR(item.price)} each
                            {item.originalPrice > item.price && (
                              <span className="ml-2 text-slate-400 line-through">
                                {formatQAR(item.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="col-span-2 text-left sm:col-span-1 sm:text-right">
                          <p className="text-lg font-black text-slate-950">
                            {formatQAR(item.lineTotal)}
                          </p>
                          {item.discountAmount > 0 && (
                            <p className="mt-1 text-xs font-bold text-emerald-600">
                              Saved {formatQAR(item.discountAmount)}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </Card>

              <Card>
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-[#015DF0]" />
                    <h2 className="text-lg font-black text-slate-950">
                      Delivery Address
                    </h2>
                  </div>
                </div>
                <div className="p-5">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-base font-black text-slate-950">
                      {order.shippingAddress.fullName ||
                        user?.name ||
                        "Customer"}
                    </p>
                    {order.shippingAddress.phone && (
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {order.shippingAddress.phone}
                      </p>
                    )}
                    <div className="mt-3 space-y-1 text-sm font-medium leading-6 text-slate-600">
                      {addressLines.length > 0 ? (
                        addressLines.map((line) => <p key={line}>{line}</p>)
                      ) : (
                        <p>No address saved for this order.</p>
                      )}
                      {order.shippingAddress.landmark && (
                        <p>Landmark: {order.shippingAddress.landmark}</p>
                      )}
                      {order.shippingAddress.deliveryInstructions && (
                        <p>
                          Note: {order.shippingAddress.deliveryInstructions}
                        </p>
                      )}
                    </div>

                    {mapUrl && (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-[#015DF0] shadow-sm hover:bg-blue-50"
                      >
                        <ExternalLink size={15} />
                        Open map
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Receipt size={18} className="text-[#015DF0]" />
                    <h2 className="text-lg font-black text-slate-950">
                      Order Summary
                    </h2>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 px-5 py-2">
                  {order.summary.originalSubtotal > order.summary.subtotal && (
                    <SummaryRow
                      label="Original subtotal"
                      value={formatQAR(order.summary.originalSubtotal)}
                    />
                  )}
                  {order.summary.productDiscount > 0 && (
                    <SummaryRow
                      label="Product discount"
                      value={`-${formatQAR(order.summary.productDiscount)}`}
                      positive
                    />
                  )}
                  <SummaryRow
                    label="Items total"
                    value={formatQAR(order.summary.subtotal)}
                  />
                  <SummaryRow
                    label="Shipping"
                    value={
                      order.summary.shipping > 0 ? (
                        formatQAR(order.summary.shipping)
                      ) : (
                        <span className="text-emerald-600">Free</span>
                      )
                    }
                  />
                  {order.summary.vat > 0 && (
                    <SummaryRow
                      label="VAT / Tax"
                      value={formatQAR(order.summary.vat)}
                    />
                  )}
                  {order.summary.couponDiscount > 0 && (
                    <SummaryRow
                      label="Coupon discount"
                      value={`-${formatQAR(order.summary.couponDiscount)}`}
                      positive
                    />
                  )}
                  <SummaryRow
                    label="Total"
                    value={formatQAR(order.summary.total)}
                    strong
                  />
                </div>
                <div className="mx-5 mb-5 rounded-2xl bg-[#0D1B3E] p-4 text-white">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-[#FEEE00]" />
                    <p className="text-sm font-black">Secure checkout</p>
                  </div>
                  <p className="mt-1 text-xs font-medium text-white/70">
                    Payment and delivery information is attached to your order.
                  </p>
                </div>
              </Card>

              <Card>
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-[#015DF0]" />
                    <h2 className="text-lg font-black text-slate-950">
                      Order Info
                    </h2>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 px-5 py-2 text-sm">
                  <SummaryRow
                    label="Date"
                    value={formatDate(order.date, true)}
                  />
                  <SummaryRow label="Payment" value={order.paymentMethod} />
                  <SummaryRow
                    label="Payment status"
                    value={order.paymentStatus}
                  />
                  <SummaryRow label="Status" value={order.status} />
                  {order.courier && (
                    <SummaryRow label="Courier" value={order.courier} />
                  )}
                  {order.trackingNumber && (
                    <SummaryRow label="Tracking" value={order.trackingNumber} />
                  )}
                  {order.updatedAt && (
                    <SummaryRow
                      label="Updated"
                      value={formatDate(order.updatedAt, true)}
                    />
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showEdit && (
          <EditOrderModal
            order={order}
            updating={updating}
            onClose={() => setShowEdit(false)}
            onSave={handleSaveOrder}
          />
        )}
      </AnimatePresence>
    </MainLayout>
  );
}

export default OrderDetails;
