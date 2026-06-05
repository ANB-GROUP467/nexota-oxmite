import { useState } from "react";
import { motion } from "framer-motion";
import useOrderStore from "../store/useOrderStore";
import {
  CreditCard,
  Truck,
  ShieldCheck,
  Ticket,
  MapPin,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import MainLayout from "../layouts/MainLayout";
import useCartStore from "../store/useCartStore";

// ─── Currency helper ──────────────────────────────────────────────────────────
const formatQAR = (amount) =>
  `QAR ${Number(amount).toLocaleString("en-QA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = ["Shipping", "Payment", "Review"];

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${
                  i < current
                    ? "bg-green-500 border-green-500 text-white"
                    : i === current
                      ? "bg-primary border-primary text-white"
                      : "bg-white border-gray-200 text-gray-400"
                }`}
            >
              {i < current ? <CheckCircle2 size={16} /> : i + 1}
            </div>
            <span
              className={`text-xs mt-1 font-semibold ${
                i === current
                  ? "text-primary"
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
              className={`h-0.5 w-16 sm:w-24 mx-1 mb-5 rounded-full transition-all ${i < current ? "bg-green-400" : "bg-gray-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Input component ──────────────────────────────────────────────────────────
function Input({
  placeholder,
  type = "text",
  className = "",
  value,
  onChange,
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-800 placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${className}`}
    />
  );
}

// ─── Payment option ───────────────────────────────────────────────────────────
function PayOption({ id, value, current, onChange, label, icon }) {
  const active = current === value;
  return (
    <label
      className={`flex items-center gap-4 border-2 rounded-2xl p-4 cursor-pointer transition-all
        ${active ? "border-primary bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
    >
      <input
        type="radio"
        className="hidden"
        checked={active}
        onChange={() => onChange(value)}
      />
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
        ${active ? "border-primary" : "border-gray-300"}`}
      >
        {active && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
      </div>
      <span className="text-xl">{icon}</span>
      <span
        className={`font-semibold text-sm ${active ? "text-primary" : "text-gray-700"}`}
      >
        {label}
      </span>
    </label>
  );
}

// ─── Main Checkout page ───────────────────────────────────────────────────────
function Checkout() {
  const { items, clearCart } = useCartStore();
  const addOrder = useOrderStore((state) => state.addOrder);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [step, setStep] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    street: "",
    zone: "",
  });

  const paymentLabels = {
    cod: "Cash On Delivery",
    card: "Credit / Debit Card",
    qpay: "QPay",
    naps: "NAPS",
    bank: "Bank Transfer",
  };

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.qty || 1),
    0,
  );
  const shipping = subtotal > 200 ? 0 : 25;
  const tax = subtotal * 0.05;
  const discount = couponApplied ? subtotal * 0.1 : 0;
  const total = subtotal + shipping + tax - discount;

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto py-24 px-4 text-center">
          <div className="bg-white rounded-3xl p-10 shadow-sm border">
            <h2 className="text-3xl font-black text-gray-900 mb-4">
              Your Cart Is Empty
            </h2>

            <p className="text-gray-500 mb-8">
              Add some products before proceeding to checkout.
            </p>

            <button
              onClick={() => navigate("/")}
              className="
            bg-[#015DF0]
            hover:bg-[#0A4CD6]
            text-white
            px-8
            py-4
            rounded-2xl
            font-bold
            transition-all
            "
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === "NEXOTA10") setCouponApplied(true);
  };
  const handlePlaceOrder = () => {
    const order = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      status: "Processing",
      total,
      paymentMethod: paymentLabels[paymentMethod],
      customer,
      items,
    };

    addOrder(order);

    const orderTime = new Date().toLocaleString();

    toast.success(
      `Order Placed Successfully!

Customer: ${customer.fullName}
Payment: ${paymentLabels[paymentMethod]}
Amount: ${formatQAR(total)}
Time: ${orderTime}`,
      {
        duration: 5000,
      },
    );

    setTimeout(() => {
      clearCart();
      navigate("/");
    }, 2000);
  };

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <span className="hover:text-primary cursor-pointer">Home</span>
            <ChevronRight size={13} />
            <span className="text-gray-700 font-medium">Checkout</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900">
            Checkout
          </h1>
        </div>

        <StepBar current={step} />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── LEFT ─────────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Details */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <MapPin size={18} className="text-primary" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Shipping Details
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="Full Name"
                  value={customer.fullName}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      fullName: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Email Address"
                  type="email"
                  value={customer.email}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      email: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Phone Number (+974)"
                  type="tel"
                  value={customer.phone}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      phone: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="City / Area"
                  value={customer.city}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      city: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Street / Building"
                  value={customer.street}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      street: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Zone / Block"
                  value={customer.zone}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      zone: e.target.value,
                    })
                  }
                />
              </div>

              <textarea
                placeholder="Additional delivery notes (optional)"
                rows={3}
                className="mt-4 w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-800 placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              />

              <button
                onClick={() => setStep(1)}
                className="mt-5 w-full sm:w-auto px-8 h-12 rounded-2xl bg-primary hover:bg-primaryHover text-white font-bold text-sm transition-all flex items-center gap-2"
              >
                Continue to Payment <ChevronRight size={16} />
              </button>
            </motion.div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <CreditCard size={18} className="text-primary" />
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
                  icon="💵"
                />
                <PayOption
                  value="card"
                  current={paymentMethod}
                  onChange={setPaymentMethod}
                  label="Credit / Debit Card"
                  icon="💳"
                />
                <PayOption
                  value="qpay"
                  current={paymentMethod}
                  onChange={setPaymentMethod}
                  label="QPay (Qatar)"
                  icon="🇶🇦"
                />
                <PayOption
                  value="naps"
                  current={paymentMethod}
                  onChange={setPaymentMethod}
                  label="NAPS (Debit Card Qatar)"
                  icon="🏦"
                />
                <PayOption
                  value="bank"
                  current={paymentMethod}
                  onChange={setPaymentMethod}
                  label="Bank Transfer"
                  icon="🏛️"
                />
              </div>

              {paymentMethod === "card" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-5 grid md:grid-cols-2 gap-4 border-t border-gray-100 pt-5"
                >
                  <Input placeholder="Card Number" className="md:col-span-2" />
                  <Input placeholder="MM / YY" />
                  <Input placeholder="CVV" />
                  <Input placeholder="Name on Card" className="md:col-span-2" />
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* ── RIGHT: Order Summary ──────────────────────────────────────── */}
          <div>
            <div className="sticky top-24 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-5">
                Order Summary
              </h2>

              {/* Cart items preview */}
              {items.length > 0 && (
                <div className="space-y-3 mb-5 max-h-48 overflow-y-auto pr-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-12 h-12 object-cover rounded-xl shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          Qty: {item.qty || 1}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-gray-700 shrink-0">
                        {formatQAR(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Coupon */}
              <div className="flex gap-2 mb-5">
                <div className="relative flex-1">
                  <Ticket
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    placeholder="Coupon Code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="w-full h-11 border border-gray-200 rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  className="px-4 h-11 bg-primary hover:bg-primaryHover text-white text-sm font-bold rounded-xl transition-all whitespace-nowrap"
                >
                  Apply
                </button>
              </div>
              {couponApplied && (
                <div className="text-xs text-green-600 font-semibold mb-4 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Coupon NEXOTA10 applied — 10% off!
                </div>
              )}

              {/* Price breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({items.length})</span>
                  <span>{formatQAR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600 font-semibold">Free</span>
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
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Discount (10%)</span>
                    <span>-{formatQAR(discount)}</span>
                  </div>
                )}
              </div>

              <hr className="my-4 border-gray-100" />

              <div className="flex justify-between text-xl font-black text-gray-900">
                <span>Total</span>
                <span>{formatQAR(total)}</span>
              </div>

              {shipping > 0 && (
                <p className="text-xs text-gray-400 mt-1 text-right">
                  Add {formatQAR(200 - subtotal)} more for free shipping
                </p>
              )}

              <button
                onClick={handlePlaceOrder}
                className="
  w-full
  mt-5
  h-14
  rounded-2xl
  bg-[#015DF0]
  hover:bg-[#0A4CD6]
  text-white
  font-bold
  text-sm
  transition-all
  flex
  items-center
  justify-center
  gap-2
  shadow-md
  shadow-blue-200
  "
              >
                <ShieldCheck size={16} />
                Place Order — {formatQAR(total)}
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
