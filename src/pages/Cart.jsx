import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Ticket,
  Trash2,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import useCartStore from "../store/useCartStore";
import useWishlistStore from "../store/useWishlistStore";
import { formatQAR, getProductPricing, roundMoney } from "../services/price";
import {
  buildVariantCartItem,
  getDefaultVariant,
  getProductVariants,
} from "../services/productService";

const LIMIT = 8;

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || value.productId || "";
};

const isDealItem = (item) =>
  item?.itemType === "deal" || item?.deal || item?.dealPrice !== undefined;

const getProductId = (product) =>
  getId(
    product?.product && typeof product.product === "object"
      ? product.product
      : product,
  ) ||
  product?.product ||
  product?.slug ||
  product?.title;

const getItemId = (item) => {
  if (isDealItem(item)) {
    return getId(item?.deal) || getId(item) || item?.slug || item?.title;
  }

  return getProductId(item);
};

const getProductPath = (product) => {
  const target = product?.slug || getProductId(product);
  return target ? `/product/${encodeURIComponent(target)}` : "/products";
};

const getItemPath = (item) => {
  if (isDealItem(item)) {
    const target = item?.slug || getItemId(item);
    return target ? `/deal/${encodeURIComponent(target)}` : "/deals";
  }

  return getProductPath(item);
};

const getImage = (item) =>
  item?.image ||
  item?.thumbnail ||
  item?.images?.[0] ||
  item?.product?.images?.[0] ||
  item?.products?.[0]?.product?.images?.[0] ||
  "/placeholder.png";

const normalizeProduct = (product = {}) => {
  const isDeal = isDealItem(product);
  const source =
    product.product && typeof product.product === "object"
      ? product.product
      : product;

  const id = isDeal
    ? getId(product?.deal) || getId(product)
    : getId(source) || getId(product);

  const image = getImage({ ...source, ...product });

  return {
    ...source,
    ...product,
    _id: id,
    id,
    itemType: isDeal ? "deal" : product.itemType || "product",
    deal: product.deal || (isDeal ? id : undefined),
    product: isDeal ? undefined : product.product || id,
    title:
      product.title ||
      product.name ||
      source.title ||
      source.name ||
      (isDeal ? "Deal" : "Product"),
    slug: product.slug || source.slug || id,
    image,
    images: source.images?.length
      ? source.images
      : product.images?.length
        ? product.images
        : [image],
    price: Number(
      product.price ??
        product.dealPrice ??
        source.price ??
        source.dealPrice ??
        0,
    ),
    oldPrice: Number(
      product.oldPrice ??
        product.originalPrice ??
        source.oldPrice ??
        source.originalPrice ??
        0,
    ),
    originalPrice: Number(
      product.originalPrice ??
        product.oldPrice ??
        source.originalPrice ??
        source.oldPrice ??
        0,
    ),
    dealPrice: Number(
      product.dealPrice ?? source.dealPrice ?? product.price ?? 0,
    ),
    quantity: Number(product.quantity || product.qty || 1),
    rating: Number(source.rating || product.rating || 0),
    reviewsCount: Number(source.reviewsCount || product.reviewsCount || 0),
    stock: Number(product.stock ?? source.stock ?? 0),
    products: product.products || source.products || [],
  };
};

function StarRow({ rating, size = 12 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          style={{ color: rating >= n ? "#f59e0b" : "#d1d5db" }}
          fill={rating >= n ? "#f59e0b" : "none"}
        />
      ))}
    </div>
  );
}

function EmptyCartSVG() {
  return (
    <svg
      viewBox="0 0 520 400"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto w-full max-w-[260px] sm:max-w-[320px]"
      aria-hidden="true"
    >
      <ellipse
        cx="260"
        cy="368"
        rx="105"
        ry="12"
        fill="#dbeafe"
        opacity="0.6"
      />
      <path
        d="M148 148 L168 285 L352 285 L372 148 Z"
        fill="#EFF6FF"
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect x="130" y="138" width="260" height="18" rx="9" fill="#3b82f6" />
      <rect x="164" y="96" width="10" height="44" rx="5" fill="#2563eb" />
      <rect x="346" y="96" width="10" height="44" rx="5" fill="#2563eb" />
      <line
        x1="120"
        y1="96"
        x2="400"
        y2="96"
        stroke="#1d4ed8"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="202" cy="304" r="24" fill="#2563eb" />
      <circle cx="202" cy="304" r="13" fill="#93C5FD" />
      <circle cx="318" cy="304" r="24" fill="#2563eb" />
      <circle cx="318" cy="304" r="13" fill="#93C5FD" />
      <circle
        cx="260"
        cy="216"
        r="40"
        fill="white"
        stroke="#BFDBFE"
        strokeWidth="2"
      />
      <ellipse cx="246" cy="205" rx="4.5" ry="5.5" fill="#1d4ed8" />
      <ellipse cx="274" cy="205" rx="4.5" ry="5.5" fill="#1d4ed8" />
      <path
        d="M244 232 Q260 222 276 232"
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SuggestedProductCard({ product }) {
  const normalized = normalizeProduct(product);
  const variants = getProductVariants(normalized);
  const defaultVariant = getDefaultVariant(normalized, variants);
  const pricing = getProductPricing(defaultVariant || normalized);

  const cartItems = useCartStore((state) => state.items || state.cart || []);
  const addToCart = useCartStore((state) => state.addToCart || state.addItem);
  const removeFromCart = useCartStore(
    (state) => state.removeFromCart || state.removeItem || state.removeCart,
  );

  const wishlist = useWishlistStore(
    (state) => state.wishlist || state.items || [],
  );
  const addWishlist = useWishlistStore(
    (state) => state.addWishlist || state.addToWishlist || state.addItem,
  );
  const removeWishlist = useWishlistStore(
    (state) =>
      state.removeWishlist || state.removeFromWishlist || state.removeItem,
  );

  const [added, setAdded] = useState(false);
  const productId = getProductId(normalized);
  const isInCart = cartItems.some((item) => getProductId(item) === productId);
  const isWishlisted = wishlist.some(
    (item) => getProductId(item) === productId,
  );
  const productPath = getProductPath(normalized);

  const stockStatus = !normalized.stock
    ? { label: "Out of Stock", color: "text-red-500" }
    : normalized.stock <= 5
      ? { label: `Only ${normalized.stock} left`, color: "text-orange-500" }
      : { label: "In Stock", color: "text-emerald-600" };

  const handleCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isInCart) {
      removeFromCart?.(productId);
      return;
    }

    addToCart?.(buildVariantCartItem(normalized, defaultVariant, 1), 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isWishlisted) removeWishlist?.(productId);
    else addWishlist?.(normalized);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      <div className="relative overflow-hidden bg-gray-50">
        <Link to={productPath} className="block aspect-square sm:aspect-[4/3]">
          <img
            src={getImage(normalized)}
            alt={normalized.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.src = "/placeholder.png";
            }}
          />
        </Link>

        {pricing.discountPercent > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-red-500 px-2 py-1 text-[10px] font-black text-white">
            -{pricing.discountPercent}%
          </span>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          className={`absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
            isWishlisted
              ? "border-red-200 bg-red-50"
              : "border-gray-200 bg-white/90 text-gray-400 sm:opacity-0 sm:group-hover:opacity-100"
          }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={15}
            className={
              isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"
            }
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        {normalized.brand?.name && (
          <span className="mb-1.5 w-fit rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
            {normalized.brand.name}
          </span>
        )}

        <Link to={productPath} className="block">
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-snug text-gray-800 transition-colors hover:text-blue-600">
            {normalized.title}
          </h3>
        </Link>

        {normalized.rating > 0 && (
          <div className="mb-2 mt-2 flex items-center gap-1.5">
            <StarRow rating={normalized.rating} />
            <span className="text-[10px] font-semibold text-amber-500">
              {normalized.rating.toFixed(1)}
            </span>
          </div>
        )}

        <div className="mb-3 mt-auto flex flex-wrap items-baseline gap-2">
          <span className="text-base font-black text-gray-900">
            {formatQAR(pricing.finalPrice)}
          </span>
          {pricing.originalPrice > pricing.finalPrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatQAR(pricing.originalPrice)}
            </span>
          )}
        </div>

        <span
          className={`mb-2.5 text-[10px] font-semibold ${stockStatus.color}`}
        >
          {stockStatus.label}
        </span>

        <motion.button
          type="button"
          onClick={handleCart}
          disabled={!normalized.stock}
          whileTap={{ scale: 0.97 }}
          className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
            added
              ? "bg-blue-400 text-white"
              : isInCart
                ? "bg-gray-700 text-white hover:bg-gray-800"
                : "bg-[#015DF0] text-white hover:bg-[#0A4CD6]"
          }`}
        >
          <ShoppingCart size={14} />
          {added ? "Added" : isInCart ? "Remove" : "Add to Cart"}
        </motion.button>
      </div>
    </motion.article>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="aspect-square bg-gray-100 sm:aspect-[4/3]" />
      <div className="space-y-2.5 p-3.5">
        <div className="h-3 w-1/3 rounded-full bg-gray-100" />
        <div className="h-3.5 w-full rounded-full bg-gray-100" />
        <div className="h-3.5 w-4/5 rounded-full bg-gray-100" />
        <div className="mt-1 h-4 w-1/2 rounded-full bg-gray-100" />
        <div className="mt-2 h-10 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

function CartItem({ item, index, onIncrease, onDecrease, onRemove }) {
  const product = normalizeProduct(item);
  const pricing = getProductPricing(product);
  const quantity = Number(item.quantity || item.qty || 1);
  const lineId = item.cartLineId || product.cartLineId || getItemId(product);
  const itemType = isDealItem(product) ? "deal" : "product";

  const selectedOptions = Object.entries(item.selectedOptions || {}).filter(
    ([, value]) => value,
  );

  const stockStatus = !product.stock
    ? { label: "Out of Stock", color: "text-red-500", dot: "bg-red-500" }
    : product.stock <= 5
      ? {
          label: `Only ${product.stock} left`,
          color: "text-orange-500",
          dot: "bg-orange-400",
        }
      : { label: "In Stock", color: "text-emerald-600", dot: "bg-emerald-500" };

  return (
    <motion.div
      key={lineId}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -28, scale: 0.97 }}
      transition={{ delay: index * 0.04, duration: 0.28 }}
      className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-[112px_1fr_auto] sm:p-5"
    >
      <Link to={getItemPath(product)} className="block w-full sm:w-28">
        <img
          src={getImage(product)}
          alt={product.title}
          className="aspect-square w-full rounded-xl object-cover sm:h-28 sm:w-28"
          onError={(event) => {
            event.currentTarget.src = "/placeholder.png";
          }}
        />
      </Link>

      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
              itemType === "deal"
                ? "bg-yellow-100 text-[#0D1B3E]"
                : "bg-blue-50 text-blue-600"
            }`}
          >
            {itemType === "deal" ? "DEAL" : product.brand?.name || "PRODUCT"}
          </span>

          {itemType === "deal" && product.products?.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              {product.products.length} products included
            </span>
          )}
        </div>

        <Link to={getItemPath(product)}>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-gray-800 transition-colors hover:text-blue-600 sm:text-base">
            {product.title}
          </h3>
        </Link>

        {selectedOptions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedOptions.map(([key, value]) => (
              <span
                key={key}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold capitalize text-slate-600"
              >
                {key}: {value}
              </span>
            ))}
          </div>
        )}

        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
          <p className="text-sm font-black text-[#015DF0] sm:text-base">
            {formatQAR(pricing.finalPrice)}
          </p>
          {pricing.originalPrice > pricing.finalPrice && (
            <p className="text-xs text-gray-400 line-through">
              {formatQAR(pricing.originalPrice)}
            </p>
          )}
        </div>

        <span
          className={`mt-1 flex items-center gap-1.5 text-xs font-semibold ${stockStatus.color}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${stockStatus.dot} animate-pulse`}
          />
          {stockStatus.label}
        </span>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => onDecrease(lineId)}
              className="flex h-9 w-9 items-center justify-center text-gray-500 transition-colors hover:bg-blue-50"
              aria-label="Decrease quantity"
            >
              <Minus size={13} />
            </button>
            <span className="w-9 text-center text-sm font-bold tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onIncrease(lineId)}
              className="flex h-9 w-9 items-center justify-center text-gray-500 transition-colors hover:bg-blue-50"
              aria-label="Increase quantity"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
        <span className="text-base font-black tabular-nums text-gray-900 sm:text-lg">
          {formatQAR(pricing.finalPrice * quantity)}
        </span>
        <button
          type="button"
          onClick={() => onRemove(lineId)}
          className="rounded-xl p-2.5 text-gray-300 transition-all hover:bg-red-50 hover:text-red-500"
          aria-label="Remove item"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
}

function Cart() {
  const items = useCartStore((state) => state.items || state.cart || []);
  const removeFromCart = useCartStore(
    (state) => state.removeFromCart || state.removeItem || state.removeCart,
  );
  const clearCart = useCartStore((state) => state.clearCart || state.clear);
  const increaseQuantity = useCartStore(
    (state) => state.increaseQuantity || state.incrementQuantity,
  );
  const decreaseQuantity = useCartStore(
    (state) => state.decreaseQuantity || state.decrementQuantity,
  );

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const { data } = await api.get("/products", {
          params: { limit: LIMIT, page },
        });
        const incoming = data?.products || data?.data || [];
        const normalized = Array.isArray(incoming)
          ? incoming.map(normalizeProduct)
          : [];

        if (!mounted) return;

        setProducts((prev) => {
          const next = page === 1 ? normalized : [...prev, ...normalized];
          const map = new Map();

          next.forEach((product) => {
            const id = getProductId(product);
            if (id && !map.has(id)) map.set(id, product);
          });

          return Array.from(map.values());
        });

        setHasMore(normalized.length === LIMIT);
      } catch (err) {
        console.error("Suggested products fetch error:", err);
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    };

    fetchProducts();

    return () => {
      mounted = false;
    };
  }, [page]);

  const cartItems = useMemo(() => items.map(normalizeProduct), [items]);

  const totals = useMemo(() => {
    const subtotal = roundMoney(
      cartItems.reduce((sum, item) => {
        const pricing = getProductPricing(item);
        return sum + pricing.originalPrice * Number(item.quantity || 1);
      }, 0),
    );

    const itemsTotal = roundMoney(
      cartItems.reduce((sum, item) => {
        const pricing = getProductPricing(item);
        return sum + pricing.finalPrice * Number(item.quantity || 1);
      }, 0),
    );

    const discount = roundMoney(subtotal - itemsTotal);
    const tax = 0;
    const total = roundMoney(itemsTotal + tax);
    const totalItems = cartItems.reduce(
      (sum, item) => sum + Number(item.quantity || 1),
      0,
    );

    return { subtotal, itemsTotal, discount, tax, total, totalItems };
  }, [cartItems]);

  return (
    <MainLayout>
      <div className="mx-auto max-w-[1400px] px-3 py-6 sm:px-6 lg:px-10 lg:py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 sm:mb-8"
        >
          <Link
            to="/products"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-[#015DF0]"
          >
            <ArrowLeft size={14} /> Continue shopping
          </Link>

          <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Shopping Cart
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {totals.totalItems} item{totals.totalItems !== 1 ? "s" : ""} in your
            cart
          </p>
        </motion.div>

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-10 flex flex-col items-center rounded-3xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm sm:py-16"
          >
            <EmptyCartSVG />
            <h2 className="mt-6 text-2xl font-black text-gray-900">
              Your cart is empty
            </h2>
            <p className="mt-2 max-w-xs text-sm text-gray-400">
              Looks like you have not added anything yet. Browse our products
              below.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#015DF0] px-5 text-sm font-black text-white hover:bg-[#0A4CD6]"
            >
              Browse Products
            </Link>
          </motion.div>
        ) : (
          <div className="mb-12 grid items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
            <div className="space-y-4">
              <AnimatePresence>
                {cartItems.map((item, index) => (
                  <CartItem
                    key={item.cartLineId || getItemId(item) || index}
                    item={item}
                    index={index}
                    onIncrease={increaseQuantity}
                    onDecrease={decreaseQuantity}
                    onRemove={removeFromCart}
                  />
                ))}
              </AnimatePresence>
            </div>

            <aside className="lg:sticky lg:top-24">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
              >
                <h2 className="mb-5 text-xl font-black text-gray-900">
                  Order Summary
                </h2>

                <div className="mb-5 flex gap-2">
                  <div className="relative flex-1">
                    <Ticket
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      placeholder="Coupon code"
                      className="h-11 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-sm outline-none transition-all focus:border-[#015DF0] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <button
                    type="button"
                    className="rounded-xl border border-gray-200 px-4 text-sm font-semibold transition-all hover:bg-gray-50"
                  >
                    Apply
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Items</span>
                    <span className="font-semibold text-gray-800">
                      {totals.totalItems}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-800">
                      {formatQAR(totals.subtotal)}
                    </span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Discount</span>
                      <span className="font-semibold text-emerald-600">
                        -{formatQAR(totals.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500">
                    <span>Delivery</span>
                    <span className="font-semibold text-emerald-600">Free</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Tax</span>
                    <span className="font-semibold text-gray-800">
                      {formatQAR(totals.tax)}
                    </span>
                  </div>
                </div>

                <hr className="my-5 border-gray-100" />

                <div className="flex justify-between text-lg font-black text-gray-900">
                  <span>Total</span>
                  <span>{formatQAR(totals.total)}</span>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2.5">
                  <Zap size={13} className="shrink-0 text-blue-600" />
                  <span className="text-xs text-blue-700">
                    Express delivery available for selected products
                  </span>
                </div>

                <Link to="/checkout">
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    className="mt-4 w-full rounded-2xl bg-[#015DF0] py-3.5 text-sm font-bold tracking-wide text-white shadow-md shadow-blue-200 transition-all hover:bg-[#0A4CD6]"
                  >
                    Proceed to Checkout
                  </motion.button>
                </Link>

                <button
                  type="button"
                  onClick={clearCart}
                  className="mt-2.5 w-full rounded-2xl border border-gray-200 py-3.5 text-sm font-semibold text-gray-500 transition-all hover:bg-gray-50"
                >
                  Clear Cart
                </button>

                <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                  <ShieldCheck size={13} />
                  <span>Secure SSL Checkout</span>
                </div>
              </motion.div>
            </aside>
          </div>
        )}

        <section className="mt-4">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#015DF0]">
                Discover More
              </p>
              <h2 className="text-2xl font-black leading-tight text-gray-900 sm:text-3xl">
                You May Also Like
              </h2>
            </div>
            <Link
              to="/products"
              className="hidden text-sm font-semibold text-[#015DF0] hover:underline sm:block"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product, index) => (
              <motion.div
                key={product._id || product.slug || index}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
              >
                <SuggestedProductCard product={product} />
              </motion.div>
            ))}

            {loadingProducts &&
              Array.from({ length: LIMIT }).map((_, index) => (
                <SkeletonCard key={`sk-${index}`} />
              ))}
          </div>

          {!loadingProducts && hasMore && (
            <div className="mt-8 flex justify-center">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-2xl border-2 border-[#015DF0] px-8 py-3 text-sm font-bold text-[#015DF0] transition-all hover:bg-blue-50"
              >
                Load More Products
              </motion.button>
            </div>
          )}

          {!loadingProducts && !hasMore && products.length > 0 && (
            <p className="mt-8 text-center text-sm text-gray-400">
              You have seen all available products
            </p>
          )}
        </section>
      </div>
    </MainLayout>
  );
}

export default Cart;
