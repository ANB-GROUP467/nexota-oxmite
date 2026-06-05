import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Heart,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronRight,
  Minus,
  Plus,
  Share2,
  BadgeCheck,
  Zap,
  ChevronDown,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import ProductCarousel from "../components/sliders/ProductCarousel";
import { products } from "../data/dummyData";
import useCartStore from "../store/useCartStore";
import useWishlistStore from "../store/useWishlistStore";

const formatQAR = (amount) =>
  `QAR ${Number(amount).toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StarRow({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = rating >= n;
        const half = !filled && rating >= n - 0.5;
        return (
          <Star
            key={n}
            size={size}
            style={{ color: filled || half ? "#f59e0b" : "#d1d5db" }}
            fill={filled ? "#f59e0b" : "none"}
          />
        );
      })}
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="font-semibold text-sm text-gray-800 group-hover:text-blue-600 transition-colors">
          {title}
        </span>
        <ChevronDown
          size={15}
          className="text-gray-400 shrink-0 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm text-gray-500 leading-relaxed space-y-1.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MOCK_REVIEWS = [
  {
    id: 1,
    name: "Ahmed Al-Rashidi",
    rating: 5,
    text: "Absolutely worth every riyal. Build quality is top-notch and delivery was faster than expected.",
    date: "2 days ago",
    verified: true,
  },
  {
    id: 2,
    name: "Fatima Hassan",
    rating: 4,
    text: "Great product overall. Setup was seamless. Would've given 5 stars but the box was slightly dented.",
    date: "1 week ago",
    verified: true,
  },
  {
    id: 3,
    name: "Omar Khalid",
    rating: 5,
    text: "Bought as a gift and the recipient was delighted. Packaging was premium and arrived in perfect condition.",
    date: "2 weeks ago",
    verified: false,
  },
];

function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
            {review.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-gray-800 truncate">
                {review.name}
              </span>
              {review.verified && (
                <BadgeCheck size={13} className="text-blue-500 shrink-0" />
              )}
            </div>
            <span className="text-xs text-gray-400">{review.date}</span>
          </div>
        </div>
        <div className="shrink-0">
          <StarRow rating={review.rating} size={12} />
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-500 leading-relaxed">
        {review.text}
      </p>
    </div>
  );
}

export default function Product() {
  const { slug } = useParams();
  const { items, addToCart, removeFromCart } = useCartStore();
  const { wishlist, addWishlist, removeWishlist } = useWishlistStore();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const product = products.find(
    (p) => (p.slug || p.title?.toLowerCase().replace(/\s+/g, "-")) === slug,
  );

  if (!product) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-5xl mb-5">🔍</div>
            <h1 className="text-3xl font-black mb-3 text-gray-900">
              Product Not Found
            </h1>
            <p className="text-gray-400 mb-8 text-sm">
              This product doesn't exist or has been removed.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl transition-colors text-sm"
            >
              Back to Home <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const gallery = product.images?.length
    ? product.images
    : [product.image, product.image, product.image, product.image];
  const selectedImage = gallery[selectedImageIndex];
  const isInCart = items.some((i) => i.id === product.id);
  const isWishlisted = wishlist.some((i) => i.id === product.id);
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;
  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 8);

  const stockStatus = !product.stock
    ? { label: "Out of Stock", color: "text-red-500", dot: "bg-red-500" }
    : product.stock <= 5
      ? {
          label: `Only ${product.stock} left!`,
          color: "text-orange-500",
          dot: "bg-orange-500",
        }
      : product.stock <= 20
        ? { label: "Low Stock", color: "text-amber-600", dot: "bg-amber-500" }
        : { label: "In Stock", color: "text-blue-600", dot: "bg-blue-500" };

  const handleWishlist = () =>
    isWishlisted ? removeWishlist(product.id) : addWishlist(product);

  const handleAddToCart = () => {
    if (isInCart) {
      removeFromCart(product.id);
      return;
    }
    addToCart({ ...product, quantity });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1800);
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <nav className="flex items-center gap-1.5 text-xs flex-wrap">
            <Link
              to="/"
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              Home
            </Link>
            <ChevronRight size={10} className="text-gray-300" />
            <Link
              to={`/${product.category}`}
              className="text-gray-400 hover:text-blue-600 transition-colors capitalize"
            >
              {product.category}
            </Link>
            <ChevronRight size={10} className="text-gray-300" />
            <span className="text-gray-600 font-medium truncate max-w-[140px] sm:max-w-xs">
              {product.title}
            </span>
          </nav>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-14">
            {/* ── Gallery ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Main image */}
              <div className="relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={selectedImage}
                    alt={product.title}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="w-full object-cover"
                    style={{ height: "clamp(260px, 42vw, 460px)" }}
                  />
                </AnimatePresence>

                {product.badge && (
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    {product.badge}
                  </div>
                )}
                {discount > 0 && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    -{discount}%
                  </div>
                )}
                <button
                  onClick={() =>
                    navigator.share?.({
                      title: product.title,
                      url: window.location.href,
                    })
                  }
                  className="absolute bottom-3 right-3 w-9 h-9 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  aria-label="Share"
                >
                  <Share2 size={14} className="text-gray-600" />
                </button>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 overflow-x-auto pb-1">
                {gallery.map((img, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    whileTap={{ scale: 0.95 }}
                    className="shrink-0 overflow-hidden rounded-xl sm:rounded-2xl border-2 transition-all"
                    style={{
                      borderColor:
                        selectedImageIndex === i ? "#2563eb" : "#e5e7eb",
                      boxShadow:
                        selectedImageIndex === i
                          ? "0 0 0 3px rgba(37,99,235,0.15)"
                          : "none",
                    }}
                  >
                    <img
                      src={img}
                      alt=""
                      style={{
                        width: "clamp(58px, 15vw, 78px)",
                        height: "clamp(58px, 15vw, 78px)",
                        objectFit: "cover",
                        filter:
                          selectedImageIndex !== i ? "brightness(0.7)" : "none",
                      }}
                    />
                  </motion.button>
                ))}
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-6">
                {[
                  {
                    icon: Truck,
                    label: "Free Delivery",
                    sub: "Orders QAR 200+",
                  },
                  {
                    icon: RotateCcw,
                    label: "Easy Returns",
                    sub: "15-day policy",
                  },
                  {
                    icon: ShieldCheck,
                    label: "Secure Payment",
                    sub: "SSL encrypted",
                  },
                ].map(({ icon: Icon, label, sub }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center text-center bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-blue-100 shadow-sm"
                  >
                    <Icon size={16} className="text-blue-500 mb-1.5" />
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-700 leading-tight">
                      {label}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5 leading-tight">
                      {sub}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Info panel ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {/* Brand pill */}
              <div className="flex items-center gap-2 flex-wrap">
                {product.brand && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {product.brand}
                  </span>
                )}
                <span className="text-xs text-gray-400 capitalize">
                  {product.category}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-[2rem] xl:text-4xl font-black mt-3 leading-tight tracking-tight text-gray-900">
                {product.title}
              </h1>

              {/* Rating + stock */}
              <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4 flex-wrap">
                <StarRow rating={product.rating} size={14} />
                <span className="font-bold text-sm text-amber-500">
                  {product.rating}
                </span>
                <span className="text-sm text-gray-400">
                  ({product.reviews?.toLocaleString() ?? "120"} reviews)
                </span>
                <span
                  className={`ml-auto text-xs font-semibold flex items-center gap-1.5 ${stockStatus.color}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${stockStatus.dot} animate-pulse`}
                  />
                  {stockStatus.label}
                </span>
              </div>

              {/* Price block */}
              <div className="mt-5 bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex items-end gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">
                  {formatQAR(product.price)}
                </span>
                {product.oldPrice && (
                  <>
                    <span className="text-base text-gray-400 line-through mb-0.5">
                      {formatQAR(product.oldPrice)}
                    </span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 mb-0.5">
                      Save {formatQAR(product.oldPrice - product.price)}
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                {product.description ||
                  "Premium quality product designed for performance, durability and everyday use. Built using modern materials and engineered for a superior user experience."}
              </p>

              <div className="w-full h-px bg-gray-100 my-5" />

              {/* Quantity */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                  Quantity
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center hover:bg-blue-50 transition-colors disabled:opacity-40 text-gray-600"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-9 text-center font-bold text-sm text-gray-800">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(product.stock || 99, q + 1))
                      }
                      disabled={quantity >= (product.stock || 99)}
                      className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center hover:bg-blue-50 transition-colors disabled:opacity-40 text-gray-600"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">
                    {product.stock ?? "—"} units available
                  </span>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex gap-3 mt-5">
                <motion.button
                  onClick={handleAddToCart}
                  disabled={!product.stock}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex-1 h-12 sm:h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed
                    ${addedToCart ? "bg-blue-400" : isInCart ? "bg-gray-600 hover:bg-gray-700" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  <AnimatePresence mode="wait">
                    {isInCart ? (
                      <motion.span
                        key="remove"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2"
                      >
                        <ShoppingCart size={15} /> Remove From Cart
                      </motion.span>
                    ) : addedToCart ? (
                      <motion.span
                        key="done"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2"
                      >
                        ✓ Added To Cart
                      </motion.span>
                    ) : (
                      <motion.span
                        key="add"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2"
                      >
                        <ShoppingCart size={15} /> Add To Cart
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <motion.button
                  onClick={handleWishlist}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex items-center justify-center transition-all shrink-0
                    ${isWishlisted ? "border-red-200 bg-red-50" : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50"}`}
                  aria-label={
                    isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                  }
                >
                  <Heart
                    size={17}
                    className={
                      isWishlisted
                        ? "fill-red-500 text-red-500"
                        : "text-gray-400"
                    }
                  />
                </motion.button>
              </div>

              {/* Express delivery */}
              <div className="mt-3 flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
                <Zap size={14} className="text-blue-600 shrink-0" />
                <span className="text-xs text-blue-700 leading-snug">
                  Express delivery available — order within{" "}
                  <strong>3h 22m</strong> for same-day dispatch
                </span>
              </div>

              <div className="w-full h-px bg-gray-100 my-5" />

              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit mb-5">
                {["details", "reviews"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold capitalize transition-all duration-200
                      ${activeTab === tab ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {tab}
                    {tab === "reviews" && (
                      <span
                        className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full
                        ${activeTab === "reviews" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"}`}
                      >
                        {product.reviews ?? 120}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "details" ? (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 sm:px-5 divide-y divide-gray-100 overflow-hidden">
                      <Accordion title="Product Highlights" defaultOpen>
                        <ul className="space-y-2">
                          {[
                            "Premium build quality with industry-leading materials",
                            "12-month manufacturer warranty included",
                            "Available in multiple colors and configurations",
                            "Compatible with all major accessories",
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <span className="text-blue-500 shrink-0 mt-0.5">
                                ✓
                              </span>{" "}
                              {item}
                            </li>
                          ))}
                        </ul>
                      </Accordion>
                      <Accordion title="Shipping & Delivery">
                        <ul className="space-y-1.5">
                          <li>
                            • Free standard delivery on orders over QAR 200
                          </li>
                          <li>
                            • Express delivery available (same-day in Doha)
                          </li>
                          <li>• Delivery across all Qatar regions</li>
                          <li>• Real-time tracking available after dispatch</li>
                        </ul>
                      </Accordion>
                      <Accordion title="Returns & Warranty">
                        <ul className="space-y-1.5">
                          <li>• 15-day hassle-free return policy</li>
                          <li>• Original packaging required for returns</li>
                          <li>• 12-month manufacturer warranty</li>
                          <li>
                            • Extended warranty plans available at checkout
                          </li>
                        </ul>
                      </Accordion>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="reviews"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-4 sm:gap-6 bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
                      <div className="text-center shrink-0">
                        <div className="text-4xl sm:text-5xl font-black text-gray-900">
                          {product.rating}
                        </div>
                        <StarRow rating={product.rating} size={12} />
                        <div className="text-xs text-gray-400 mt-1">
                          {product.reviews?.toLocaleString() ?? "120"} reviews
                        </div>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const pct =
                            star === 5
                              ? 72
                              : star === 4
                                ? 18
                                : star === 3
                                  ? 6
                                  : 2;
                          return (
                            <div
                              key={star}
                              className="flex items-center gap-1.5 sm:gap-2"
                            >
                              <span className="text-xs text-gray-500 w-3 shrink-0">
                                {star}
                              </span>
                              <Star
                                size={9}
                                fill="#f59e0b"
                                style={{ color: "#f59e0b" }}
                                className="shrink-0"
                              />
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 w-7 shrink-0 text-right">
                                {pct}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {MOCK_REVIEWS.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-16 sm:mt-20">
              <ProductCarousel
                title="Related Products"
                subtitle="You may also like"
                data={relatedProducts}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
