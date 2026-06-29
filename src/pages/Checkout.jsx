import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Home,
  LocateFixed,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  Ticket,
  Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import MainLayout from "../layouts/MainLayout";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";
import api from "../services/api";
import { formatQAR, getCartItemPricing, roundMoney } from "../services/price";

const STEPS = ["Shipping", "Payment", "Review"];
const EMPTY_ARRAY = [];

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || value.productId || "";
};

const isDealItem = (item) =>
  item?.itemType === "deal" || item?.deal || item?.dealPrice !== undefined;

const getCartItemId = (item) => {
  if (isDealItem(item)) {
    return getId(item.deal) || getId(item) || item.slug;
  }

  return getId(item.product) || getId(item);
};

const getCartItemImage = (item) =>
  item.image ||
  item.images?.[0] ||
  item.product?.images?.[0] ||
  item.products?.[0]?.product?.images?.[0] ||
  "/placeholder.png";

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

const findUser = (value) => {
  if (!value || typeof value !== "object") return null;
  if (value._id || value.id || value.email) return value;
  return findUser(value.user) || findUser(value.state) || findUser(value.auth);
};

const getStoredAuth = () => {
  let token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    "";
  let user = parseJson(localStorage.getItem("user"));

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    const parsed = parseJson(localStorage.getItem(key));

    if (!token) token = findToken(parsed);
    if (!user) user = findUser(parsed);
  }

  return { token, user };
};

const emptyAddress = (user) => ({
  label: "Home",
  fullName: user?.name || "",
  email: user?.email || "",
  phone: user?.phone || "",
  country: "Qatar",
  city: "",
  area: "",
  street: "",
  building: "",
  floor: "",
  apartment: "",
  zone: "",
  landmark: "",
  postalCode: "",
  deliveryInstructions: "",
  latitude: "",
  longitude: "",
  mapUrl: "",
  isDefault: false,
});

const normalizeAddress = (address = {}, user) => ({
  _id: address._id || address.id || "",
  label: address.label || "Home",
  fullName: address.fullName || address.name || user?.name || "",
  email: address.email || user?.email || "",
  phone: address.phone || "",
  country: address.country || "Qatar",
  city: address.city || "",
  area: address.area || "",
  street: address.street || address.address || "",
  building: address.building || "",
  floor: address.floor || "",
  apartment: address.apartment || "",
  zone: address.zone || "",
  landmark: address.landmark || "",
  postalCode: address.postalCode || "",
  deliveryInstructions: address.deliveryInstructions || "",
  latitude: address.latitude || "",
  longitude: address.longitude || "",
  mapUrl: address.mapUrl || "",
  isDefault: Boolean(address.isDefault),
});

const addressToOrderPayload = (address) => ({
  fullName: address.fullName,
  email: address.email,
  phone: address.phone,
  country: address.country,
  city: address.city,
  area: address.area,
  street: address.street,
  building: address.building,
  floor: address.floor,
  apartment: address.apartment,
  zone: address.zone,
  landmark: address.landmark,
  postalCode: address.postalCode,
  deliveryInstructions: address.deliveryInstructions,
  latitude: address.latitude,
  longitude: address.longitude,
  mapUrl: address.mapUrl,
  address: [
    address.street,
    address.building && `Building ${address.building}`,
    address.floor && `Floor ${address.floor}`,
    address.apartment && `Apt ${address.apartment}`,
    address.area,
    address.zone && `Zone ${address.zone}`,
    address.city,
    address.country,
  ]
    .filter(Boolean)
    .join(", "),
});

const getBrowserLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GPS location is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });

const reverseGeocode = async ({ latitude, longitude }) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${latitude}&lon=${longitude}`,
  );

  if (!response.ok) {
    throw new Error("Unable to fetch address from current location.");
  }

  const data = await response.json();
  const address = data.address || {};
  const street = [address.house_number, address.road || address.pedestrian]
    .filter(Boolean)
    .join(" ");

  return {
    country: address.country || "Qatar",
    city:
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      "",
    area:
      address.suburb ||
      address.neighbourhood ||
      address.quarter ||
      address.residential ||
      "",
    street,
    building: address.house_number || "",
    zone: address.postcode || "",
    postalCode: address.postcode || "",
    landmark: data.name && data.name !== street ? data.name : "",
    latitude: String(latitude),
    longitude: String(longitude),
    mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
  };
};

function StepBar({ current }) {
  return (
    <div className="mb-10 flex items-center gap-0 overflow-x-auto pb-2">
      {STEPS.map((step, i) => (
        <div key={step} className="flex shrink-0 items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${
                i < current
                  ? "border-green-500 bg-green-500 text-white"
                  : i === current
                    ? "border-[#015DF0] bg-[#015DF0] text-white"
                    : "border-gray-200 bg-white text-gray-400"
              }`}
            >
              {i < current ? <CheckCircle2 size={16} /> : i + 1}
            </div>
            <span
              className={`mt-1 text-xs font-semibold ${
                i === current
                  ? "text-[#015DF0]"
                  : i < current
                    ? "text-green-500"
                    : "text-gray-400"
              }`}
            >
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`mx-1 mb-5 h-0.5 w-16 rounded-full transition-all sm:w-24 ${
                i < current ? "bg-green-400" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Input({
  label,
  placeholder,
  type = "text",
  className = "",
  value,
  onChange,
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-gray-200 p-4 text-sm text-gray-800 transition-all placeholder:text-gray-400 focus:border-[#015DF0] focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function PayOption({ value, current, onChange, label, icon }) {
  const active = current === value;

  return (
    <label
      className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
        active
          ? "border-[#015DF0] bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <input
        type="radio"
        className="hidden"
        checked={active}
        onChange={() => onChange(value)}
      />
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          active ? "border-[#015DF0]" : "border-gray-300"
        }`}
      >
        {active && <div className="h-2.5 w-2.5 rounded-full bg-[#015DF0]" />}
      </div>
      <span className="text-sm font-black text-slate-500">{icon}</span>
      <span
        className={`text-sm font-semibold ${
          active ? "text-[#015DF0]" : "text-gray-700"
        }`}
      >
        {label}
      </span>
    </label>
  );
}

const validateAddress = (address) => {
  if (!address.fullName.trim()) return "Full name is required.";
  if (!address.email.trim()) return "Email address is required.";
  if (!address.phone.trim()) return "Phone number is required.";
  if (!address.city.trim()) return "City is required.";
  if (!address.area.trim()) return "Area is required.";
  if (!address.street.trim()) return "Street is required.";
  if (!address.building.trim()) return "Building / house number is required.";
  return null;
};

function Checkout() {
  const cartItems = useCartStore(
    (state) => state.items || state.cart || EMPTY_ARRAY,
  );
  const clearCart = useCartStore((state) => state.clearCart);
  const { user, token } = useAuthStore();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [step, setStep] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("new");
  const [addressForm, setAddressForm] = useState(() => emptyAddress(user));
  const [saveAddress, setSaveAddress] = useState(true);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const pricedItems = useMemo(
    () =>
      cartItems.map((item) => ({
        ...item,
        itemType: isDealItem(item) ? "deal" : item.itemType || "product",
        pricing: getCartItemPricing(item),
      })),
    [cartItems],
  );

  const selectedAddress =
    selectedAddressId === "new"
      ? addressForm
      : addresses.find((address) => getId(address) === selectedAddressId) ||
        addressForm;

  const paymentLabels = {
    cod: "COD",
    card: "Credit / Debit Card",
    qpay: "QPay",
    naps: "NAPS",
    bank: "Bank Transfer",
  };

  const subtotal = roundMoney(
    pricedItems.reduce((sum, item) => sum + item.pricing.lineTotal, 0),
  );
  const originalSubtotal = roundMoney(
    pricedItems.reduce(
      (sum, item) => sum + item.pricing.originalPrice * item.pricing.quantity,
      0,
    ),
  );
  const productDiscountTotal = roundMoney(
    pricedItems.reduce(
      (sum, item) => sum + item.pricing.discountAmount * item.pricing.quantity,
      0,
    ),
  );
  const shipping = subtotal > 200 ? 0 : 25;
  const tax = roundMoney(subtotal * 0.05);
  const couponDiscount = couponApplied ? roundMoney(subtotal * 0.1) : 0;
  const total = roundMoney(subtotal + shipping + tax - couponDiscount);

  useEffect(() => {
    setAddressForm((current) => ({
      ...current,
      fullName: current.fullName || user?.name || "",
      email: current.email || user?.email || "",
      phone: current.phone || user?.phone || "",
    }));
  }, [user]);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!token) return;

      try {
        setAddressesLoading(true);
        const { data } = await api.get("/auth/addresses");
        const list = data?.addresses || data?.data || [];
        const normalized = Array.isArray(list)
          ? list.map((address) => normalizeAddress(address, user))
          : [];

        setAddresses(normalized);

        const defaultAddress = normalized.find((address) => address.isDefault);
        if (defaultAddress) setSelectedAddressId(getId(defaultAddress));
        else if (normalized[0]) setSelectedAddressId(getId(normalized[0]));
      } catch (error) {
        console.error("Address fetch error:", error);
      } finally {
        setAddressesLoading(false);
      }
    };

    fetchAddresses();
  }, [token, user]);

  const updateAddressField = (field, value) => {
    setSelectedAddressId("new");
    setAddressForm((current) => ({ ...current, [field]: value }));
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      setSelectedAddressId("new");

      const position = await getBrowserLocation();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      let locationAddress = {
        latitude: String(latitude),
        longitude: String(longitude),
        mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
      };

      try {
        locationAddress = {
          ...locationAddress,
          ...(await reverseGeocode({ latitude, longitude })),
        };
      } catch {
        toast.error(
          "GPS mil gaya, lekin address auto-fill nahi hua. Manual details complete kar dein.",
        );
      }

      setAddressForm((current) => ({
        ...current,
        ...locationAddress,
      }));

      toast.success("Current location added. Please confirm address details.");
    } catch (error) {
      toast.error(
        error.code === 1
          ? "Location permission denied. Please allow GPS or enter address manually."
          : error.message || "Could not get current location.",
      );
    } finally {
      setLocating(false);
    }
  };

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === "NEXOTA10") {
      setCouponApplied(true);
      toast.success("Coupon applied - 10% off!");
    } else {
      toast.error("Invalid coupon code.");
    }
  };

  const persistAddressIfNeeded = async () => {
    if (selectedAddressId !== "new" || !saveAddress) return selectedAddress;

    const { data } = await api.post("/auth/addresses", {
      ...selectedAddress,
      isDefault: addresses.length === 0 || selectedAddress.isDefault,
    });

    const createdAddress = normalizeAddress(data?.address || data?.data, user);
    setAddresses((current) => [createdAddress, ...current]);
    setSelectedAddressId(getId(createdAddress));
    return createdAddress;
  };

  const handleContinueToPayment = async () => {
    const error = validateAddress(selectedAddress);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      await persistAddressIfNeeded();
      setStep(1);
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to save address.",
      );
    }
  };

  const handlePlaceOrder = async () => {
    const error = validateAddress(selectedAddress);
    if (error) {
      toast.error(error);
      setStep(0);
      return;
    }

    const storedAuth = getStoredAuth();
    const authToken = token || storedAuth.token;
    const authUser = user || storedAuth.user;
    const userId = authUser?._id || authUser?.id;

    if (!authToken) {
      window.dispatchEvent(
        new CustomEvent("nexota:auth-required", {
          detail: {
            intent: "checkout",
            redirectTo: "/checkout",
            title: "Login to continue checkout",
          },
        }),
      );
      return;
    }

    setLoading(true);
    setStep(2);

    try {
      const finalAddress = await persistAddressIfNeeded();

      const orderItems = pricedItems.map((item) => {
        const itemType = isDealItem(item) ? "deal" : "product";
        const itemId = getCartItemId(item);
        const image = getCartItemImage(item);

        return {
          ...(itemType === "product" ? { product: itemId } : { deal: itemId }),
          itemType,
          title: item.title || item.name || item.product?.title,
          name: item.title || item.name || item.product?.title,
          image,
          qty: item.pricing.quantity,
          quantity: item.pricing.quantity,
          price: item.pricing.finalPrice,
          originalPrice: item.pricing.originalPrice,
          discountPercent: item.pricing.discountPercent,
          discountAmount: item.pricing.discountAmount,
          includedProducts: itemType === "deal" ? item.products || [] : [],
        };
      });

      const orderPayload = {
        ...(userId ? { user: userId } : {}),
        orderItems,
        items: orderItems,
        shippingAddress: addressToOrderPayload(finalAddress),
        paymentMethod: paymentLabels[paymentMethod],
        subtotal,
        shippingFee: shipping,
        shippingPrice: shipping,
        taxPrice: tax,
        discount: couponDiscount,
        productDiscount: productDiscountTotal,
        originalSubtotal,
        totalAmount: total,
        totalPrice: total,
        orderStatus: "Pending",
      };

      const { data } = await api.post("/orders", orderPayload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!data?.success) {
        throw new Error(data?.message || "Failed to place order.");
      }

      toast.success(
        `Order placed! ID: #${(data.order?._id || data.data?._id || "")
          .slice(-6)
          .toUpperCase()}`,
        { duration: 5000 },
      );

      clearCart?.();
      setTimeout(() => navigate("/orders"), 1000);
    } catch (err) {
      console.error("Order error:", err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong. Please try again.",
      );
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <div className="rounded-3xl border bg-white p-10 shadow-sm">
            <h2 className="mb-4 text-3xl font-black text-gray-900">
              Your Cart Is Empty
            </h2>
            <p className="mb-8 text-gray-500">
              Add some products before proceeding to checkout.
            </p>
            <button
              onClick={() => navigate("/")}
              className="rounded-2xl bg-[#015DF0] px-8 py-4 font-bold text-white transition-all hover:bg-[#0A4CD6]"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-400">
            <span
              className="cursor-pointer hover:text-[#015DF0]"
              onClick={() => navigate("/")}
            >
              Home
            </span>
            <ChevronRight size={13} />
            <span className="font-medium text-gray-700">Checkout</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 md:text-5xl">
            Checkout
          </h1>
        </div>

        <StepBar current={step} />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-6 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                  <MapPin size={18} className="text-[#015DF0]" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Delivery Address
                </h2>
              </div>

              {addressesLoading && (
                <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                  Loading saved addresses...
                </div>
              )}

              {addresses.length > 0 && (
                <div className="mb-5 grid gap-3 md:grid-cols-2">
                  {addresses.map((address) => {
                    const id = getId(address);
                    const active = selectedAddressId === id;

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedAddressId(id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          active
                            ? "border-[#015DF0] bg-blue-50"
                            : "border-slate-200 bg-white hover:border-blue-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Home size={17} className="text-[#015DF0]" />
                          <span className="font-black text-slate-900">
                            {address.label}
                          </span>
                          {address.isDefault && (
                            <span className="rounded-full bg-[#015DF0] px-2 py-0.5 text-[10px] font-black text-white">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-500">
                          {addressToOrderPayload(address).address}
                        </p>
                        <p className="mt-2 text-xs font-bold text-slate-500">
                          {address.fullName} - {address.phone}
                        </p>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setSelectedAddressId("new")}
                    className={`rounded-2xl border border-dashed p-4 text-left transition ${
                      selectedAddressId === "new"
                        ? "border-[#015DF0] bg-blue-50"
                        : "border-slate-300 bg-slate-50 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-slate-900">
                      <Plus size={17} className="text-[#015DF0]" />
                      Add new address
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Use another exact delivery address for this order.
                    </p>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="mb-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-5 text-sm font-black text-[#015DF0] transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {locating ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <LocateFixed size={17} />
                )}
                {locating
                  ? "Detecting location..."
                  : "Use current GPS location"}
              </button>

              {(selectedAddressId === "new" || addresses.length === 0) && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Label"
                    placeholder="Home / Office"
                    value={addressForm.label}
                    onChange={(e) =>
                      updateAddressField("label", e.target.value)
                    }
                  />
                  <Input
                    label="Full name"
                    placeholder="Full Name *"
                    value={addressForm.fullName}
                    onChange={(e) =>
                      updateAddressField("fullName", e.target.value)
                    }
                  />
                  <Input
                    label="Email"
                    placeholder="Email Address *"
                    type="email"
                    value={addressForm.email}
                    onChange={(e) =>
                      updateAddressField("email", e.target.value)
                    }
                  />
                  <Input
                    label="Phone"
                    placeholder="Phone Number (+974) *"
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) =>
                      updateAddressField("phone", e.target.value)
                    }
                  />
                  <Input
                    label="City"
                    placeholder="City *"
                    value={addressForm.city}
                    onChange={(e) => updateAddressField("city", e.target.value)}
                  />
                  <Input
                    label="Area"
                    placeholder="Area / District *"
                    value={addressForm.area}
                    onChange={(e) => updateAddressField("area", e.target.value)}
                  />
                  <Input
                    label="Street"
                    placeholder="Street name / number *"
                    value={addressForm.street}
                    onChange={(e) =>
                      updateAddressField("street", e.target.value)
                    }
                  />
                  <Input
                    label="Building"
                    placeholder="Building / House number *"
                    value={addressForm.building}
                    onChange={(e) =>
                      updateAddressField("building", e.target.value)
                    }
                  />
                  <Input
                    label="Floor"
                    placeholder="Floor"
                    value={addressForm.floor}
                    onChange={(e) =>
                      updateAddressField("floor", e.target.value)
                    }
                  />
                  <Input
                    label="Apartment"
                    placeholder="Apartment / Villa"
                    value={addressForm.apartment}
                    onChange={(e) =>
                      updateAddressField("apartment", e.target.value)
                    }
                  />
                  <Input
                    label="Zone"
                    placeholder="Zone / Block"
                    value={addressForm.zone}
                    onChange={(e) => updateAddressField("zone", e.target.value)}
                  />
                  <Input
                    label="Landmark"
                    placeholder="Nearby landmark"
                    value={addressForm.landmark}
                    onChange={(e) =>
                      updateAddressField("landmark", e.target.value)
                    }
                  />

                  {addressForm.latitude && addressForm.longitude && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-slate-600 md:col-span-2">
                      GPS location attached:{" "}
                      <a
                        href={addressForm.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-black text-[#015DF0] hover:underline"
                      >
                        {addressForm.latitude}, {addressForm.longitude}
                      </a>
                    </div>
                  )}

                  <Input
                    label="Delivery instructions"
                    placeholder="Delivery instructions"
                    className="md:col-span-2"
                    value={addressForm.deliveryInstructions}
                    onChange={(e) =>
                      updateAddressField("deliveryInstructions", e.target.value)
                    }
                  />

                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                    />
                    Save this address for next orders
                  </label>
                </div>
              )}

              <button
                onClick={handleContinueToPayment}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#015DF0] px-8 text-sm font-bold text-white transition-all hover:bg-[#0A4CD6] sm:w-auto"
              >
                Continue to Payment <ChevronRight size={16} />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-6 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                  <CreditCard size={18} className="text-[#015DF0]" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Payment Method
                </h2>
              </div>

              <div className="space-y-3">
                <PayOption
                  value="cod"
                  current={paymentMethod}
                  onChange={setPaymentMethod}
                  label="Cash On Delivery"
                  icon="COD"
                />
                <PayOption
                  value="card"
                  current={paymentMethod}
                  onChange={setPaymentMethod}
                  label="Credit / Debit Card"
                  icon="CARD"
                />
                <PayOption
                  value="qpay"
                  current={paymentMethod}
                  onChange={setPaymentMethod}
                  label="QPay (Qatar)"
                  icon="QP"
                />
                <PayOption
                  value="naps"
                  current={paymentMethod}
                  onChange={setPaymentMethod}
                  label="NAPS (Debit Card Qatar)"
                  icon="NP"
                />
                <PayOption
                  value="bank"
                  current={paymentMethod}
                  onChange={setPaymentMethod}
                  label="Bank Transfer"
                  icon="BT"
                />
              </div>
            </motion.div>
          </div>

          <div>
            <div className="sticky top-24 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-bold text-gray-900">
                Order Summary
              </h2>

              <div className="mb-5 max-h-56 space-y-3 overflow-y-auto pr-1">
                {pricedItems.map((item) => {
                  const key = item.cartLineId || getCartItemId(item);
                  const image = getCartItemImage(item);
                  const itemType = isDealItem(item) ? "deal" : "product";

                  return (
                    <div key={key} className="flex items-center gap-3">
                      <img
                        src={image}
                        alt={item.title || item.name}
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                              itemType === "deal"
                                ? "bg-yellow-100 text-[#0D1B3E]"
                                : "bg-blue-50 text-[#015DF0]"
                            }`}
                          >
                            {itemType === "deal" ? "DEAL" : "ITEM"}
                          </span>
                          {itemType === "deal" && (
                            <span className="text-[10px] font-bold text-slate-400">
                              {item.products?.length || 0} included
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-xs font-semibold text-gray-800">
                          {item.title || item.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Qty: {item.pricing.quantity}
                        </p>
                        {item.pricing.discountPercent > 0 && (
                          <p className="text-[11px] font-bold text-green-600">
                            -{item.pricing.discountPercent}% discount applied
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="block text-xs font-bold text-gray-700">
                          {formatQAR(item.pricing.finalPrice)}
                        </span>
                        {item.pricing.hasDiscount && (
                          <span className="text-[11px] text-gray-400 line-through">
                            {formatQAR(item.pricing.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mb-5 flex gap-2">
                <div className="relative flex-1">
                  <Ticket
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    placeholder="Coupon Code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    disabled={couponApplied}
                    className="h-11 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-sm focus:border-[#015DF0] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponApplied}
                  className="h-11 whitespace-nowrap rounded-xl bg-[#015DF0] px-4 text-sm font-bold text-white transition-all hover:bg-[#0A4CD6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply
                </button>
              </div>

              {couponApplied && (
                <div className="mb-4 flex items-center gap-1 text-xs font-semibold text-green-600">
                  <CheckCircle2 size={13} /> Coupon NEXOTA10 applied - 10% off!
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Original subtotal</span>
                  <span>{formatQAR(originalSubtotal)}</span>
                </div>
                {productDiscountTotal > 0 && (
                  <div className="flex justify-between font-semibold text-green-600">
                    <span>Product discount</span>
                    <span>-{formatQAR(productDiscountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Items total ({pricedItems.length})</span>
                  <span>{formatQAR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="font-semibold text-green-600">Free</span>
                    ) : (
                      formatQAR(shipping)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT (5%)</span>
                  <span>{formatQAR(tax)}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between font-semibold text-green-600">
                    <span>Discount (10%)</span>
                    <span>-{formatQAR(couponDiscount)}</span>
                  </div>
                )}
              </div>

              <hr className="my-4 border-gray-100" />

              <div className="flex justify-between text-xl font-black text-gray-900">
                <span>Total</span>
                <span>{formatQAR(total)}</span>
              </div>

              {shipping > 0 && (
                <p className="mt-1 text-right text-xs text-gray-400">
                  Add {formatQAR(200 - subtotal)} more for free shipping
                </p>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#015DF0] text-sm font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-[#0A4CD6] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Place Order - {formatQAR(total)}
                  </>
                )}
              </button>

              <div className="mt-5 space-y-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Truck size={13} /> Fast delivery across Qatar
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={13} /> Secure SSL Checkout
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Checkout;
