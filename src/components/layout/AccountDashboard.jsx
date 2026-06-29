import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bell,
  CheckCircle,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Heart,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Package,
  RefreshCw,
  Shield,
  Star,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import api from "../../services/api";
import useAuthStore from "../../store/useAuthStore";

const BRAND_BLUE = "#015DF0";
const BRAND_NAVY = "#0D1B3E";
const EMPTY_ARRAY = [];

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "orders", label: "My Orders", icon: Package, path: "/orders" },
  { id: "wishlist", label: "Wishlist", icon: Heart, path: "/wishlist" },
  { id: "addresses", label: "Addresses", icon: MapPin, path: "/addresses" },
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

const formatQAR = (amount) =>
  `QAR ${Number(amount || 0).toLocaleString("en-QA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) => {
  if (!date) return "N/A";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-QA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

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
  return (
    findToken(value.state) || findToken(value.auth) || findToken(value.user)
  );
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
  return value._id || value.id || value.$oid || "";
};

const readList = (data, keys) => {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
};

const normalizeProfile = (user) => ({
  _id: getId(user),
  name: user?.name || user?.displayName || "",
  email: user?.email || "",
  phone: user?.phone || "",
  avatar: user?.avatar || user?.photoURL || "",
  role: user?.role || "customer",
  memberTier: user?.memberTier || "Silver",
  points: Number(user?.points || 0),
});

const normalizeOrder = (order) => {
  const id = getId(order) || order.orderId || order.orderNumber;
  const items = order.items || order.orderItems || order.products || [];
  return {
    id,
    shortId: String(id || "")
      .slice(-6)
      .toUpperCase(),
    status: order.status || order.orderStatus || "Pending",
    date: order.date || order.createdAt || order.updatedAt,
    total: Number(order.total || order.totalAmount || order.totalPrice || 0),
    itemsCount: items.length,
  };
};

const normalizeAddress = (address) => ({
  ...address,
  id: getId(address),
  fullName: address.fullName || address.name || "Address",
  city: address.city || address.area || "",
  isDefault: Boolean(address.isDefault || address.default),
});

const normalizeWishlist = (item) => {
  const product =
    item?.product && typeof item.product === "object" ? item.product : item;
  const id = getId(product) || item.product || item.productId || getId(item);
  return { ...product, id, _id: id };
};

async function firstOk(paths, options) {
  for (const path of paths) {
    try {
      const { data } = await api.get(path, options);
      return data;
    } catch (error) {
      if (error.response?.status === 401) throw error;
    }
  }
  return null;
}

async function firstMutation(method, paths, payload, options) {
  for (const path of paths) {
    try {
      const { data } =
        method === "delete"
          ? await api.delete(path, options)
          : await api[method](path, payload, options);
      return data;
    } catch (error) {
      if (error.response?.status === 401) throw error;
    }
  }
  return null;
}

function ShellCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function LoadingBlock({ label }) {
  return (
    <ShellCard className="p-10 text-center">
      <Loader2 size={34} className="mx-auto animate-spin text-[#015DF0]" />
      <p className="mt-3 text-sm font-semibold text-slate-500">{label}</p>
    </ShellCard>
  );
}

function StatCard({ icon: Icon, label, value, to, color = "blue" }) {
  const colors = {
    blue: "from-[#015DF0] to-[#0D1B3E]",
    navy: "from-[#0D1B3E] to-slate-950",
    yellow: "from-[#FEEE00] to-amber-500 text-[#0D1B3E]",
    green: "from-emerald-500 to-teal-700",
  };

  const content = (
    <ShellCard className={`p-5 text-white bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
          <Icon size={20} />
        </div>
        <ChevronRight size={18} className="opacity-60" />
      </div>
      <p className="mt-5 text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-semibold opacity-75">{label}</p>
    </ShellCard>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

function InfoLine({ icon: Icon, label, value, to }) {
  const content = (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
      <Icon size={16} className="text-[#015DF0]" />
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="ml-auto truncate text-sm font-black text-slate-900">
        {value}
      </span>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

function OrderPreview({ order }) {
  return (
    <Link
      to={`/orders/${order.id}`}
      className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100">
        <Package size={17} className="text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-900">
          Order #{order.shortId || order.id}
        </p>
        <p className="text-xs font-semibold text-slate-500">
          {formatDate(order.date)} - {order.status}
        </p>
      </div>
      <span className="hidden text-sm font-black text-[#015DF0] sm:block">
        {formatQAR(order.total)}
      </span>
      <ChevronRight size={17} className="text-slate-400" />
    </Link>
  );
}

function OverviewTab({ data, loading }) {
  const activeOrders = data.orders.filter((order) =>
    ["pending", "processing", "shipped"].includes(
      String(order.status).toLowerCase(),
    ),
  ).length;
  const deliveredOrders = data.orders.filter(
    (order) => String(order.status).toLowerCase() === "delivered",
  ).length;
  const totalSpent = data.orders
    .filter((order) => String(order.status).toLowerCase() !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);
  const recentOrders = data.orders.slice(0, 4);

  if (loading) return <LoadingBlock label="Loading account dashboard..." />;

  return (
    <div className="space-y-6">
      <ShellCard className="overflow-hidden border-0 bg-[#0D1B3E] text-white">
        <div className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-white/60">Welcome back</p>
            <h1 className="mt-1 text-3xl font-black">
              {data.profile.name || "Nexota Customer"}
            </h1>
            <p className="mt-2 text-sm font-medium text-white/60">
              {data.profile.memberTier} member -{" "}
              {data.profile.points.toLocaleString()} points
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/orders"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-black text-[#0D1B3E]"
            >
              My Orders
            </Link>
            <Link
              to="/addresses"
              className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-black"
              style={{ backgroundColor: "#FEEE00", color: BRAND_NAVY }}
            >
              Addresses
            </Link>
          </div>
        </div>
      </ShellCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Package}
          label="Total Orders"
          value={data.orders.length}
          to="/orders"
          color="navy"
        />
        <StatCard
          icon={Truck}
          label="Active Orders"
          value={activeOrders}
          to="/orders"
        />
        <StatCard
          icon={CheckCircle}
          label="Delivered"
          value={deliveredOrders}
          to="/orders"
          color="green"
        />
        <StatCard
          icon={CreditCard}
          label="Total Spent"
          value={formatQAR(totalSpent)}
          color="yellow"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ShellCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-900">Recent Orders</h2>
            <Link to="/orders" className="text-sm font-black text-[#015DF0]">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center">
              <Package size={42} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-500">
                Your orders will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <OrderPreview key={order.id} order={order} />
              ))}
            </div>
          )}
        </ShellCard>

        <ShellCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-900">
              Account Summary
            </h2>
            <Link to="/profile" className="text-sm font-black text-[#015DF0]">
              Edit profile
            </Link>
          </div>
          <div className="space-y-3">
            <InfoLine
              icon={Mail}
              label="Email"
              value={data.profile.email || "Not added"}
            />
            <InfoLine
              icon={MapPin}
              label="Addresses"
              value={`${data.addresses.length} saved`}
              to="/addresses"
            />
            <InfoLine
              icon={Heart}
              label="Wishlist"
              value={`${data.wishlist.length} products`}
              to="/wishlist"
            />
            <InfoLine
              icon={Star}
              label="Tier"
              value={data.profile.memberTier}
            />
          </div>
        </ShellCard>
      </div>
    </div>
  );
}

function ProfileTab({ profile, onSave, saving }) {
  const [form, setForm] = useState(profile);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <ShellCard className="p-6">
      <h2 className="text-xl font-black text-slate-900">Profile</h2>
      <p className="mt-1 text-sm font-medium text-slate-500">
        Keep your account information updated.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field
          label="Full Name"
          value={form.name}
          onChange={(value) => update("name", value)}
        />
        <Field
          label="Email"
          value={form.email}
          onChange={(value) => update("email", value)}
        />
        <Field
          label="Phone"
          value={form.phone}
          onChange={(value) => update("phone", value)}
        />
      </div>
      <button
        type="button"
        onClick={() => onSave(form)}
        disabled={saving}
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-[#015DF0] px-6 text-sm font-black text-white disabled:opacity-60"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <User size={16} />
        )}
        Save Profile
      </button>
    </ShellCard>
  );
}

function NotificationsTab({ notifications, onMarkAllRead }) {
  return (
    <ShellCard className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Notifications</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Account updates and order alerts.
          </p>
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          Mark all read
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
            No notifications yet.
          </div>
        ) : (
          notifications.map((item, index) => (
            <div
              key={item.id || index}
              className={`rounded-xl border p-4 ${
                item.read
                  ? "border-slate-200 bg-white"
                  : "border-blue-100 bg-blue-50"
              }`}
            >
              <p className="font-black text-slate-900">
                {item.title || "Notification"}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {item.message}
              </p>
            </div>
          ))
        )}
      </div>
    </ShellCard>
  );
}

function SecurityTab({ onChangePassword, saving }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [visible, setVisible] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <ShellCard className="p-6">
      <h2 className="text-xl font-black text-slate-900">Security</h2>
      <p className="mt-1 text-sm font-medium text-slate-500">
        Change password and protect your account.
      </p>
      <div className="mt-6 max-w-xl space-y-4">
        <PasswordField
          label="Current Password"
          value={form.current}
          visible={visible}
          onToggle={() => setVisible((v) => !v)}
          onChange={(value) => update("current", value)}
        />
        <PasswordField
          label="New Password"
          value={form.next}
          visible={visible}
          onToggle={() => setVisible((v) => !v)}
          onChange={(value) => update("next", value)}
        />
        <PasswordField
          label="Confirm Password"
          value={form.confirm}
          visible={visible}
          onToggle={() => setVisible((v) => !v)}
          onChange={(value) => update("confirm", value)}
        />
      </div>
      <button
        type="button"
        onClick={() =>
          onChangePassword(form, () =>
            setForm({ current: "", next: "", confirm: "" }),
          )
        }
        disabled={saving}
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-[#0D1B3E] px-6 text-sm font-black text-white disabled:opacity-60"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Lock size={16} />
        )}
        Update Password
      </button>
    </ShellCard>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-[#015DF0] focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

function PasswordField({ label, value, visible, onToggle, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div className="relative mt-1">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-slate-200 px-4 pr-12 text-sm font-semibold outline-none focus:border-[#015DF0] focus:ring-4 focus:ring-blue-50"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}

function AccountDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token || state.accessToken || "");
  const logout = useAuthStore((state) => state.logout);
  const updateProfileStore = useAuthStore((state) => state.updateProfile);
  const changePasswordStore = useAuthStore((state) => state.changePassword);
  const notifications = useAuthStore(
    (state) => state.notifications || EMPTY_ARRAY,
  );
  const markAllRead = useAuthStore((state) => state.markAllNotificationsRead);

  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [data, setData] = useState({
    profile: normalizeProfile(user),
    orders: [],
    wishlist: [],
    addresses: [],
    notifications: [],
  });

  const authToken = token || getStoredToken();
  const authHeaders = useMemo(
    () =>
      authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {},
    [authToken],
  );

  const showNotice = (type, message) => {
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 3200);
  };

  const refreshDashboard = async () => {
    if (!authToken) {
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const [profileRes, ordersRes, wishlistRes, addressesRes] =
        await Promise.allSettled([
          firstOk(["/auth/me", "/auth/profile"], authHeaders),
          firstOk(["/orders", "/orders/my-orders"], authHeaders),
          firstOk(["/wishlist"], authHeaders),
          firstOk(["/auth/addresses"], authHeaders),
        ]);

      const profileData =
        profileRes.status === "fulfilled"
          ? profileRes.value?.user ||
            profileRes.value?.profile ||
            profileRes.value
          : null;
      const ordersData =
        ordersRes.status === "fulfilled"
          ? readList(ordersRes.value, ["orders", "items", "data"])
          : [];
      const wishlistData =
        wishlistRes.status === "fulfilled"
          ? readList(wishlistRes.value, [
              "wishlist",
              "items",
              "products",
              "data",
            ])
          : [];
      const directAddresses =
        addressesRes.status === "fulfilled"
          ? readList(addressesRes.value, ["addresses", "data"])
          : [];
      const addressesData =
        directAddresses.length > 0
          ? directAddresses
          : addressesRes.status === "fulfilled"
            ? addressesRes.value?.user?.addresses ||
              profileData?.addresses ||
              []
            : profileData?.addresses || [];

      setData({
        profile: normalizeProfile(profileData || user),
        orders: ordersData.map(normalizeOrder),
        wishlist: wishlistData.map(normalizeWishlist),
        addresses: addressesData.map(normalizeAddress),
        notifications,
      });
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }
      showNotice("error", "Dashboard data load nahi ho saka.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const handleNav = (item) => {
    if (item.path) {
      navigate(item.path);
      return;
    }
    setActiveTab(item.id);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout?.();
    navigate("/");
  };

  const handleSaveProfile = async (profile) => {
    setSaving(true);
    try {
      const saved = await firstMutation(
        "put",
        ["/auth/profile", "/auth/me"],
        profile,
        authHeaders,
      );
      await updateProfileStore?.(profile);
      setData((prev) => ({
        ...prev,
        profile: normalizeProfile(saved?.user || saved?.profile || profile),
      }));
      showNotice("success", "Profile updated.");
    } catch {
      showNotice("error", "Profile update nahi ho saka.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (form, reset) => {
    if (!form.current || !form.next || !form.confirm) {
      showNotice("error", "Fill all password fields.");
      return;
    }
    if (form.next.length < 8) {
      showNotice("error", "New password must be at least 8 characters.");
      return;
    }
    if (form.next !== form.confirm) {
      showNotice("error", "Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      await firstMutation(
        "put",
        ["/auth/change-password", "/auth/password"],
        {
          currentPassword: form.current,
          oldPassword: form.current,
          newPassword: form.next,
        },
        authHeaders,
      );
      await changePasswordStore?.(form.current, form.next);
      reset?.();
      showNotice("success", "Password updated.");
    } catch {
      showNotice("error", "Password update nahi ho saka.");
    } finally {
      setSaving(false);
    }
  };

  const activeLabel =
    NAV.find((item) => item.id === activeTab)?.label || "Dashboard";

  const tabContent = {
    overview: <OverviewTab data={data} loading={loading} />,
    profile: (
      <ProfileTab
        profile={data.profile}
        onSave={handleSaveProfile}
        saving={saving}
      />
    ),
    notifications: (
      <NotificationsTab
        notifications={data.notifications}
        onMarkAllRead={() => {
          markAllRead?.();
          setData((prev) => ({
            ...prev,
            notifications: prev.notifications.map((item) => ({
              ...item,
              read: true,
            })),
          }));
        }}
      />
    ),
    security: (
      <SecurityTab onChangePassword={handleChangePassword} saving={saving} />
    ),
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-xs text-slate-500">
          <Link to="/" className="font-bold hover:text-slate-900">
            Home
          </Link>
          <ChevronRight size={12} />
          <span>My Account</span>
          <ChevronRight size={12} />
          <span className="font-bold text-slate-900">{activeLabel}</span>
          <button
            type="button"
            onClick={refreshDashboard}
            className="ml-auto hidden items-center gap-2 rounded-xl border px-3 py-2 font-bold text-slate-600 hover:bg-slate-50 sm:inline-flex"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="ml-auto rounded-xl p-2 hover:bg-slate-100 sm:ml-0 lg:hidden"
          >
            <LayoutDashboard size={16} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-7">
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mb-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold ${
                notice.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
              }`}
            >
              {notice.type === "error" ? (
                <AlertCircle size={16} />
              ) : (
                <CheckCircle size={16} />
              )}
              {notice.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-6">
          <aside className="hidden w-64 shrink-0 space-y-4 lg:block">
            <ShellCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0D1B3E] text-lg font-black text-white">
                  {(data.profile.name || "U").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">
                    {data.profile.name || "User"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {data.profile.email}
                  </p>
                </div>
              </div>
            </ShellCard>

            <ShellCard className="overflow-hidden">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id && !item.path;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item)}
                    className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left text-sm font-bold last:border-b-0 ${
                      active
                        ? "bg-blue-50 text-[#015DF0]"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </ShellCard>
          </aside>

          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSidebarOpen(false)}
                  className="fixed inset-0 z-50 bg-black/40 lg:hidden"
                />
                <motion.aside
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  className="fixed left-0 top-0 z-50 h-screen w-72 bg-white p-4 lg:hidden"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-black text-slate-900">My Account</h2>
                    <button type="button" onClick={() => setSidebarOpen(false)}>
                      <XCircle size={20} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {NAV.map((item) => {
                      const Icon = item.icon;
                      const active = activeTab === item.id && !item.path;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNav(item)}
                          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold ${
                            active
                              ? "bg-blue-50 text-[#015DF0]"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Icon size={16} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          <main className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {tabContent[activeTab] || tabContent.overview}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AccountDashboard;
