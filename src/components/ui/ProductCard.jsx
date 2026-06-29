// ProductCard.jsx
import { Link } from "react-router-dom";
import { Heart, Minus, Plus, Star, Trash2, Zap } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import toast from "react-hot-toast";
import useCartStore from "../../store/useCartStore";
import useWishlistStore from "../../store/useWishlistStore";
import { formatQAR, getProductPricing } from "../../services/price";
import SmoothImage from "./SmoothImage";

const BRAND_BLUE = "#015DF0";
const BRAND_NAVY = "#0D1B3E";
const BRAND_YELLOW = "#FEEE00";

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || value.productId || value.$oid || "";
};

const getNestedId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return getId(value) || value.product || value.productId || "";
};

const getCartProductId = (item) => {
  if (!item) return "";
  if (item.product && typeof item.product === "object")
    return getId(item.product);
  return (
    getNestedId(item.product) ||
    item.productId ||
    item.product_id ||
    getId(item)
  );
};

const getWishlistProductId = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (item.product && typeof item.product === "object")
    return getId(item.product);
  return item.product || item.productId || item.product_id || getId(item);
};

const getName = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name || value.title || value.slug || "";
};

const getStoredToken = () => {
  const direct =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");

  if (direct) return direct;

  try {
    const authStorage = JSON.parse(
      localStorage.getItem("auth-storage") || "{}",
    );
    return authStorage?.state?.token || authStorage?.token || "";
  } catch {
    return "";
  }
};

const openAuthRequiredModal = () => {
  window.dispatchEvent(
    new CustomEvent("nexota:auth-required", {
      detail: {
        intent: "wishlist",
        redirectTo: "/wishlist",
        title: "Login to save products",
        mode: "login",
        startStep: "identifier",
      },
    }),
  );
};

const dispatchWishlistAddedToast = (product) => {
  window.dispatchEvent(
    new CustomEvent("nexota:wishlist-added", {
      detail: {
        product,
        listName: "default list",
      },
    }),
  );
};

function Rating({ rating, reviewsCount }) {
  const safeRating = Number(rating || 0);
  const safeReviews = Number(reviewsCount || 0);

  return (
    <div className="flex min-h-5 min-w-0 items-center gap-1 text-[10px] sm:text-xs">
      <span
        className="inline-flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 font-black text-white"
        style={{ backgroundColor: BRAND_NAVY }}
      >
        <Star size={10} fill={BRAND_YELLOW} stroke={BRAND_YELLOW} />
        {safeRating.toFixed(1)}
      </span>

      <span className="min-w-0 truncate font-semibold text-slate-400">
        {safeReviews > 0
          ? `(${safeReviews.toLocaleString()} reviews)`
          : "(No reviews yet)"}
      </span>
    </div>
  );
}

function ProductCard({ product }) {
  const reduceMotion = useReducedMotion();

  const cartItems = useCartStore(
    (state) => state.cart || state.cartItems || state.items || [],
  );
  const addToCart = useCartStore(
    (state) => state.addToCart || state.addItem || state.addCart,
  );
  const removeFromCart = useCartStore(
    (state) => state.removeFromCart || state.removeItem || state.removeCartItem,
  );
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const increaseQuantity = useCartStore(
    (state) => state.increaseQuantity || state.incrementQuantity,
  );
  const decreaseQuantity = useCartStore(
    (state) => state.decreaseQuantity || state.decrementQuantity,
  );

  const wishlist = useWishlistStore(
    (state) => state.wishlist || state.items || [],
  );
  const addWishlist = useWishlistStore(
    (state) => state.addWishlist || state.addItem,
  );
  const removeWishlist = useWishlistStore(
    (state) =>
      state.removeWishlist || state.removeFromWishlist || state.removeItem,
  );

  const productId = getId(product);
  const slug = product?.slug || productId;
  const href = slug ? `/product/${slug}` : "/products";
  const title = product?.title || product?.name || "Product";
  const image =
    product?.image ||
    product?.thumbnail ||
    product?.images?.[0] ||
    "/placeholder.png";
  const brandName = getName(product?.brand);
  const categoryName = getName(product?.category);
  const hasExplicitStock =
    product?.stock !== undefined && product?.stock !== null;
  const stock = Number(product?.stock || 0);
  const inStock = hasExplicitStock ? stock > 0 : true;
  const lowStock = hasExplicitStock && inStock && stock <= 5;

  const pricing = getProductPricing(product);
  const isWishlisted = wishlist.some(
    (item) => getWishlistProductId(item) === productId,
  );
  const cartItem = cartItems.find(
    (item) => getCartProductId(item) === productId,
  );
  const isInCart = Boolean(cartItem);
  const cartQty = Number(cartItem?.quantity || cartItem?.qty || 0);
  const label = brandName || categoryName;
  const badgeText =
    pricing.discountPercent > 0
      ? `-${pricing.discountPercent}%`
      : product?.badge || "";

  const productForActions = {
    ...product,
    id: productId,
    _id: productId,
    title,
    image,
    images: product?.images?.length ? product.images : [image],
    price: pricing.finalPrice,
    oldPrice: pricing.hasDiscount ? pricing.originalPrice : product?.oldPrice,
    discountPercent: pricing.discountPercent,
    discountAmount: pricing.discountAmount,
  };

  const handleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!productId) return;

    try {
      if (!getStoredToken()) {
        openAuthRequiredModal();
        return;
      }

      if (isWishlisted) {
        await removeWishlist?.(productId);
        toast.success("Removed from wishlist");
        return;
      }

      await addWishlist?.(productForActions);
      dispatchWishlistAddedToast(productForActions);
    } catch (error) {
      console.error("Wishlist toggle error:", error);

      if (
        error.response?.status === 401 ||
        /login/i.test(error.message || "")
      ) {
        openAuthRequiredModal();
        return;
      }

      toast.error(
        error.response?.data?.message || error.message || "Wishlist error",
      );
    }
  };

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!productId || !inStock) return;

    if (isInCart) {
      const nextQuantity = cartQty + 1;
      updateQuantity?.(productId, nextQuantity);
      return;
    }

    addToCart?.(productForActions, 1);
    toast.success("Added to cart");
  };

  const handleIncrease = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!productId || !inStock) return;
    if (hasExplicitStock && cartQty >= stock) return;

    const nextQuantity = cartQty + 1;

    if (updateQuantity) {
      updateQuantity(productId, nextQuantity);
    } else if (increaseQuantity) {
      increaseQuantity(productId);
    } else {
      addToCart?.({ ...productForActions, quantity: nextQuantity }, 0);
    }
  };

  const handleDecrease = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!productId) return;

    if (cartQty <= 1) {
      if (removeFromCart) {
        removeFromCart(productId);
      } else {
        updateQuantity?.(productId, 0);
      }

      toast.success("Removed from cart");
      return;
    }

    const nextQuantity = cartQty - 1;

    if (updateQuantity) {
      updateQuantity(productId, nextQuantity);
    } else if (decreaseQuantity) {
      decreaseQuantity(productId);
    }
  };

  return (
    <motion.article
      layout={!reduceMotion}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="group ux-card flex h-full min-w-0 max-w-full flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative bg-slate-50">
        {badgeText && (
          <div
            className="absolute left-2 top-2 z-20 rounded-full px-2 py-0.5 text-[10px] font-black text-white shadow-sm sm:left-3 sm:top-3 sm:text-[11px]"
            style={{
              backgroundColor:
                pricing.discountPercent > 0 ? "#FF2D3D" : BRAND_NAVY,
            }}
          >
            {badgeText}
          </div>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          className="absolute right-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-slate-500 shadow-sm ring-1 ring-slate-100 backdrop-blur transition hover:text-[#015DF0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#015DF0] sm:right-3 sm:top-3 sm:h-9 sm:w-9"
        >
          <Heart
            size={15}
            fill={isWishlisted ? BRAND_YELLOW : "none"}
            strokeWidth={2.25}
            style={{ color: isWishlisted ? BRAND_NAVY : undefined }}
          />
        </button>

        <Link to={href} aria-label={title} className="block">
          <SmoothImage
            src={image}
            alt={title}
            aspect="aspect-[4/3]"
            wrapperClassName="rounded-none"
            className="transition duration-500 group-hover:scale-[1.035]"
          />
        </Link>

        {!inStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/65 backdrop-blur-[1px]">
            <span className="rounded-full bg-slate-950/85 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
              Out of Stock
            </span>
          </div>
        )}

        <div className="absolute bottom-2 right-2 z-20 sm:bottom-3 sm:right-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {!isInCart ? (
              <motion.button
                key="add"
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock}
                layout
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                whileTap={inStock ? { scale: 0.92 } : undefined}
                aria-label="Add to cart"
                className={`grid h-9 w-9 place-items-center rounded-xl text-white shadow-md transition sm:h-10 sm:w-10 ${
                  inStock
                    ? "hover:brightness-110 active:scale-95"
                    : "cursor-not-allowed opacity-50"
                }`}
                style={{ backgroundColor: inStock ? BRAND_BLUE : "#94a3b8" }}
              >
                <Plus size={18} />
              </motion.button>
            ) : (
              <motion.div
                key="stepper"
                layout
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className="flex h-9 items-center gap-0.5 rounded-xl p-0.5 shadow-md sm:h-10"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                <motion.button
                  type="button"
                  onClick={handleDecrease}
                  whileTap={{ scale: 0.9 }}
                  aria-label={
                    cartQty <= 1 ? "Remove from cart" : "Decrease quantity"
                  }
                  className="grid h-full w-7 place-items-center rounded-lg text-white transition hover:bg-white/15 sm:w-8"
                >
                  {cartQty <= 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                </motion.button>

                <span className="grid w-5 place-items-center text-xs font-black text-white sm:w-6 sm:text-sm">
                  {cartQty}
                </span>

                <motion.button
                  type="button"
                  onClick={handleIncrease}
                  disabled={hasExplicitStock && cartQty >= stock}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Increase quantity"
                  className="grid h-full w-7 place-items-center rounded-lg text-white transition hover:bg-white/15 disabled:opacity-40 sm:w-8"
                >
                  <Plus size={14} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-3">
        <div className="min-h-3.5">
          {label && (
            <p
              className="truncate text-[9px] font-black uppercase tracking-wide sm:text-[10px]"
              style={{ color: BRAND_BLUE }}
            >
              {label}
            </p>
          )}
        </div>

        <Link to={href} className="block min-w-0">
          <h3 className="line-clamp-2 min-h-[34px] text-[12px] font-bold leading-[17px] text-slate-900 transition hover:text-[#015DF0] sm:min-h-[40px] sm:text-sm sm:leading-5">
            {title}
          </h3>
        </Link>

        <Rating rating={product?.rating} reviewsCount={product?.reviewsCount} />

        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="min-w-0 text-[13px] font-black leading-tight text-slate-950 sm:text-lg">
            {formatQAR(pricing.finalPrice)}
          </span>

          {pricing.hasDiscount && (
            <>
              <span className="min-w-0 truncate text-[9px] font-bold text-slate-400 line-through sm:text-sm">
                {formatQAR(pricing.originalPrice)}
              </span>
              <span className="text-[10px] font-black text-emerald-600 sm:text-xs">
                Save {pricing.discountPercent}%
              </span>
            </>
          )}
        </div>

        <div className="min-h-4">
          {lowStock ? (
            <p className="text-[10px] font-black text-amber-600 sm:text-[11px]">
              Only {stock} left
            </p>
          ) : pricing.hasDiscount ? (
            <p
              className="flex items-center gap-1 text-[10px] font-bold sm:text-[11px]"
              style={{ color: BRAND_BLUE }}
            >
              <Zap size={10} fill="currentColor" />
              Special price
            </p>
          ) : inStock ? (
            <p className="text-[10px] font-bold text-emerald-600 sm:text-[11px]">
              In stock
            </p>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

export default ProductCard;
