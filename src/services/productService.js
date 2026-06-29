const OPTION_KEYS = ["version", "color", "storage", "ram"];

const clean = (value) => String(value || "").trim();
const comparable = (value) => clean(value).toLowerCase();

export const getEntityId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || value.$oid || "");
};

export const getColorName = (color) => {
  if (!color) return "";
  if (typeof color === "string") return clean(color);
  return clean(color.name || color.label || color.value);
};

export const getColorHex = (color) => {
  if (!color || typeof color === "string") return "";
  return clean(color.hex || color.code);
};

export const getVariantValue = (variant, key) => {
  if (key === "color") return getColorName(variant?.color);
  return clean(variant?.[key]);
};

export const getProductVariants = (product) =>
  (Array.isArray(product?.variants) ? product.variants : [])
    .filter((variant) => variant && variant.isActive !== false)
    .map((variant) => ({
      ...variant,
      id: getEntityId(variant),
      sku: clean(variant.sku).toUpperCase(),
      version: clean(variant.version),
      color:
        typeof variant.color === "string"
          ? { name: clean(variant.color), hex: "" }
          : {
              ...variant.color,
              name: getColorName(variant.color),
              hex: getColorHex(variant.color),
            },
      storage: clean(variant.storage),
      ram: clean(variant.ram),
      price: Number(variant.price || 0),
      oldPrice: Number(variant.oldPrice || 0),
      stock: Number(variant.stock || 0),
      images: Array.isArray(variant.images)
        ? variant.images.filter(Boolean)
        : [],
    }));

export const getVariantSelection = (variant) =>
  OPTION_KEYS.reduce((selection, key) => {
    const value = getVariantValue(variant, key);
    if (value) selection[key] = value;
    return selection;
  }, {});

export const getDefaultVariant = (
  product,
  variants = getProductVariants(product),
) => {
  if (variants.length === 0) return null;

  const defaultSku = clean(product?.defaultVariantSku).toUpperCase();
  const defaultId = getEntityId(product?.defaultVariantId);

  return (
    variants.find(
      (variant) =>
        (defaultSku && variant.sku === defaultSku) ||
        (defaultId && variant.id === defaultId),
    ) ||
    variants.find((variant) => variant.stock > 0) ||
    variants[0]
  );
};

export const getVariantOptions = (variants) =>
  OPTION_KEYS.reduce((groups, key) => {
    const seen = new Set();

    groups[key] = variants.reduce((values, variant) => {
      const value = getVariantValue(variant, key);
      const identity = comparable(value);

      if (!identity || seen.has(identity)) return values;
      seen.add(identity);

      values.push({
        value,
        label: value,
        hex: key === "color" ? getColorHex(variant.color) : "",
      });

      return values;
    }, []);

    return groups;
  }, {});

const matchesSelection = (variant, selection, ignoredKey = "") =>
  OPTION_KEYS.every((key) => {
    if (key === ignoredKey || !selection?.[key]) return true;
    return (
      comparable(getVariantValue(variant, key)) === comparable(selection[key])
    );
  });

export const isVariantOptionAvailable = ({ variants, selection, key, value }) =>
  variants.some(
    (variant) =>
      variant.stock > 0 &&
      comparable(getVariantValue(variant, key)) === comparable(value) &&
      matchesSelection(variant, selection, key),
  );

export const selectVariantForOption = ({
  variants,
  currentVariant,
  key,
  value,
}) => {
  const currentSelection = getVariantSelection(currentVariant);
  const candidates = variants.filter(
    (variant) =>
      comparable(getVariantValue(variant, key)) === comparable(value),
  );

  if (candidates.length === 0) return currentVariant || variants[0] || null;

  const score = (variant) => {
    const matchedOptions = OPTION_KEYS.reduce((total, optionKey) => {
      if (optionKey === key || !currentSelection[optionKey]) return total;
      return (
        total +
        (comparable(getVariantValue(variant, optionKey)) ===
        comparable(currentSelection[optionKey])
          ? 1
          : 0)
      );
    }, 0);

    return matchedOptions * 10 + (variant.stock > 0 ? 5 : 0);
  };

  return [...candidates].sort((a, b) => score(b) - score(a))[0];
};

export const buildVariantCartItem = (product, variant, quantity = 1) => {
  const productId = getEntityId(product);
  const variantId = getEntityId(variant);
  const selectedOptions = variant ? getVariantSelection(variant) : {};
  const images = variant?.images?.length
    ? variant.images
    : product?.images || [];
  const price = Number(variant?.price ?? product?.price ?? 0);
  const oldPrice = Number(variant?.oldPrice ?? product?.oldPrice ?? 0);
  const stock = Number(variant?.stock ?? product?.stock ?? 0);

  return {
    ...product,
    id: productId,
    _id: productId,
    productId,
    variantId,
    variantSku: variant?.sku || "",
    selectedOptions,
    cartLineId: `${productId}:${variantId || variant?.sku || "base"}`,
    title: product?.title || product?.name || "Product",
    image: images[0] || product?.image || "/placeholder.png",
    images,
    price,
    oldPrice,
    stock,
    quantity: Math.max(Number(quantity) || 1, 1),
  };
};

export const VARIANT_OPTION_KEYS = OPTION_KEYS;
