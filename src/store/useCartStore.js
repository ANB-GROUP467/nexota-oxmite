import { create } from "zustand";

const GUEST_ID = "guest";

const getProductId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;

  const product =
    value.product && typeof value.product === "object" ? value.product : value;

  return String(
    value.productId || product._id || product.id || value._id || value.id || "",
  );
};

const getVariantId = (value) =>
  String(value?.variantId || value?.variant?._id || value?.variant?.id || "");

const makeLineId = (value) => {
  if (value?.cartLineId) return String(value.cartLineId);

  const productId = getProductId(value);
  const variantIdentity = getVariantId(value) || value?.variantSku || "base";
  return `${productId}:${variantIdentity}`;
};

const getUserId = (user) => String(user?._id || user?.id || GUEST_ID);
const getCartKey = (userId = GUEST_ID) => `nexota:cart:${userId}`;

const clampQuantity = (quantity, stock) => {
  const normalized = Math.max(Number(quantity) || 1, 1);
  const available = Number(stock);

  if (Number.isFinite(available) && available > 0) {
    return Math.min(normalized, available);
  }

  return normalized;
};

const normalizeCartItem = (product, quantity = product?.quantity || 1) => {
  const productId = getProductId(product);
  const variantId = getVariantId(product);
  const images = Array.isArray(product?.images)
    ? product.images.filter(Boolean)
    : [product?.image].filter(Boolean);

  return {
    ...product,
    id: productId,
    _id: productId,
    productId,
    variantId,
    variantSku: product?.variantSku || product?.sku || "",
    selectedOptions: product?.selectedOptions || {},
    cartLineId: makeLineId(product),
    title: product?.title || product?.name || "Product",
    name: product?.name || product?.title || "Product",
    image: product?.image || images[0] || "/placeholder.png",
    images,
    price: Number(product?.price || 0),
    oldPrice: Number(product?.oldPrice || 0),
    stock: Number(product?.stock || 0),
    quantity: clampQuantity(quantity, product?.stock),
  };
};

const readCart = (userId) => {
  try {
    const value = JSON.parse(localStorage.getItem(getCartKey(userId)) || "[]");
    return Array.isArray(value)
      ? value.map((item) => normalizeCartItem(item, item.quantity))
      : [];
  } catch {
    return [];
  }
};

const saveCart = (userId, items) => {
  localStorage.setItem(getCartKey(userId), JSON.stringify(items));
};

const syncCart = (set, userId, items) => {
  saveCart(userId, items);
  set({ userId, cart: items, cartItems: items, items });
};

const findLine = (items, identifier) => {
  const value = String(identifier || "");
  return (
    items.find((item) => item.cartLineId === value) ||
    items.find((item) => item.variantId && item.variantId === value) ||
    items.find((item) => item.productId === value)
  );
};

const useCartStore = create((set, get) => ({
  userId: GUEST_ID,
  cart: [],
  cartItems: [],
  items: [],

  setCartUser: (user) => {
    const userId = getUserId(user);
    const items = readCart(userId);
    syncCart(set, userId, items);
  },

  hydrateCart: (user) => {
    const userId = getUserId(user);
    const items = readCart(userId);
    syncCart(set, userId, items);
    return items;
  },

  resetForGuest: () => {
    ["cart", "cartItems", "cart-storage"].forEach((key) =>
      localStorage.removeItem(key),
    );
    localStorage.removeItem(getCartKey(GUEST_ID));
    syncCart(set, GUEST_ID, []);
  },

  addToCart: (product, quantity = 1) => {
    const normalized = normalizeCartItem(product, quantity);
    if (!normalized.productId) return;

    const userId = get().userId || GUEST_ID;
    const current = get().cart;
    const existing = current.find(
      (item) => item.cartLineId === normalized.cartLineId,
    );

    const next = existing
      ? current.map((item) =>
          item.cartLineId === normalized.cartLineId
            ? {
                ...item,
                ...normalized,
                quantity: clampQuantity(
                  Number(item.quantity || 1) +
                    Math.max(Number(quantity) || 1, 1),
                  normalized.stock,
                ),
              }
            : item,
        )
      : [...current, normalized];

    syncCart(set, userId, next);
  },

  removeFromCart: (identifier) => {
    const userId = get().userId || GUEST_ID;
    const current = get().cart;
    const line = findLine(current, identifier);
    if (!line) return;

    const next = current.filter((item) => item.cartLineId !== line.cartLineId);
    syncCart(set, userId, next);
  },

  updateQuantity: (identifier, quantity) => {
    const userId = get().userId || GUEST_ID;
    const current = get().cart;
    const line = findLine(current, identifier);
    if (!line) return;

    if (Number(quantity) <= 0) {
      get().removeFromCart(line.cartLineId);
      return;
    }

    const next = current.map((item) =>
      item.cartLineId === line.cartLineId
        ? {
            ...item,
            quantity: clampQuantity(quantity, item.stock),
          }
        : item,
    );

    syncCart(set, userId, next);
  },

  increaseQuantity: (identifier) => {
    const line = findLine(get().cart, identifier);
    if (line) {
      get().updateQuantity(line.cartLineId, Number(line.quantity || 1) + 1);
    }
  },

  decreaseQuantity: (identifier) => {
    const line = findLine(get().cart, identifier);
    if (!line) return;
    get().updateQuantity(line.cartLineId, Number(line.quantity || 1) - 1);
  },

  clearCart: () => {
    syncCart(set, get().userId || GUEST_ID, []);
  },

  getCartTotal: () =>
    get().cart.reduce(
      (total, item) =>
        total + Number(item.price || 0) * Number(item.quantity || 1),
      0,
    ),

  getCartCount: () =>
    get().cart.reduce((total, item) => total + Number(item.quantity || 1), 0),

  addItem: (product, quantity) => get().addToCart(product, quantity),
  removeItem: (identifier) => get().removeFromCart(identifier),
  removeCart: (identifier) => get().removeFromCart(identifier),
  incrementQuantity: (identifier) => get().increaseQuantity(identifier),
  decrementQuantity: (identifier) => get().decreaseQuantity(identifier),
  totalPrice: () => get().getCartTotal(),
  totalItems: () => get().getCartCount(),
}));

if (typeof window !== "undefined" && !window.__NEXOTA_CART_LOGOUT_LISTENER__) {
  window.__NEXOTA_CART_LOGOUT_LISTENER__ = true;
  window.addEventListener("nexota:logout", () => {
    useCartStore.getState().resetForGuest();
  });
}

export default useCartStore;
