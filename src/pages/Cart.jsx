import { motion } from "framer-motion";
import { Trash2, ShoppingBag, ShieldCheck, Ticket } from "lucide-react";
import { Link } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import useCartStore from "../store/useCartStore";

const formatQAR = (amount) =>
  `QAR ${Number(amount).toLocaleString("en-QA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function Cart() {
  const { items, removeFromCart, clearCart } = useCartStore();

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0,
  );

  const discount = 0;
  const tax = 0;
  const total = subtotal - discount + tax;

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-black">Shopping Cart</h1>
          <p className="mt-3 text-gray-500">
            {items.length} item{items.length !== 1 ? "s" : ""} in your cart
          </p>
        </motion.div>

        {/* Empty State */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100"
          >
            <ShoppingBag size={90} className="mx-auto text-gray-300" />
            <h2 className="mt-6 text-3xl font-bold">Your cart is empty</h2>
            <p className="mt-4 text-gray-500">
              Looks like you haven't added anything yet.
            </p>
            <Link to="/">
              <button className="mt-8 bg-[#015df0] hover:bg-[#0A4CD6] text-white px-8 py-4 rounded-2xl font-semibold transition-all">
                Continue Shopping
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-5">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex gap-5"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-28 h-28 object-cover rounded-2xl"
                  />

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-gray-500 mt-2">
                      {formatQAR(item.price)}
                    </p>
                    <div className="mt-3 text-green-600 text-sm font-medium">
                      In Stock
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="h-fit p-3 rounded-xl hover:bg-red-50 text-red-500 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <div>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

                {/* Coupon */}
                <div className="flex gap-2 mb-6">
                  <div className="flex-1 relative">
                    <Ticket
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      placeholder="Coupon Code"
                      className="w-full h-12 pl-10 rounded-xl border outline-none"
                    />
                  </div>
                  <button className="px-4 rounded-xl border font-medium">
                    Apply
                  </button>
                </div>

                {/* Totals */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Items</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatQAR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatQAR(tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="text-green-600">
                      -{formatQAR(discount)}
                    </span>
                  </div>
                </div>

                <hr className="my-6" />

                <div className="flex justify-between text-2xl font-black">
                  <span>Total</span>
                  <span>{formatQAR(total)}</span>
                </div>

                {/* Checkout */}
                <Link to="/checkout">
                  <button
                    className="
    w-full
    mt-6
    bg-[#015DF0]
    hover:bg-[#0A4CD6]
    h-14
    text-white
    rounded-2xl
    font-bold
    transition-all
    "
                  >
                    Proceed To Checkout
                  </button>
                </Link>

                <button
                  onClick={clearCart}
                  className="w-full mt-3 border h-14 rounded-2xl font-medium hover:bg-gray-50 transition-all"
                >
                  Clear Cart
                </button>

                {/* Security */}
                <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
                  <ShieldCheck size={16} />
                  <span>Secure SSL Checkout</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default Cart;
