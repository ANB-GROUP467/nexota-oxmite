export const roundMoney = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const formatQAR = (amount) =>
  `QAR ${Number(amount || 0).toLocaleString("en-QA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const parseDiscountPercent = (source = {}) => {
  const values = [
    source.discountPercent,
    source.discountPercentage,
    source.discount,
    source.discountRate,
    source.discountTag,
    source.badge,
  ];

  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;

    const match = String(value).match(/-?\s*(\d+(?:\.\d+)?)\s*%?/);
    const number = match ? Number(match[1]) : Number(value);

    if (Number.isFinite(number) && number > 0) {
      return Math.min(number, 100);
    }
  }

  const oldPrice = Number(
    source.oldPrice || source.originalPrice || source.mrp || 0,
  );
  const price = Number(source.price || source.salePrice || 0);

  if (oldPrice > price && price > 0) {
    return roundMoney(((oldPrice - price) / oldPrice) * 100);
  }

  return 0;
};

const getDefaultVariant = (product = {}) => {
  const variants = Array.isArray(product.variants)
    ? product.variants.filter((variant) => variant?.isActive !== false)
    : [];

  if (variants.length === 0) return null;

  const defaultSku = String(product.defaultVariantSku || "").toUpperCase();
  return (
    variants.find(
      (variant) => String(variant.sku || "").toUpperCase() === defaultSku,
    ) ||
    variants.find((variant) => Number(variant.stock || 0) > 0) ||
    variants[0]
  );
};

export const getProductPricing = (product = {}, selectedVariant = null) => {
  const source = selectedVariant || getDefaultVariant(product) || product;
  const discountPercent = parseDiscountPercent(source);
  const originalPrice = Number(
    source.oldPrice ||
      source.originalPrice ||
      source.mrp ||
      source.basePrice ||
      source.regularPrice ||
      source.price ||
      0,
  );
  const currentPrice = Number(
    source.price || source.salePrice || originalPrice || 0,
  );

  if (discountPercent > 0 && originalPrice > 0) {
    const discountAmount = roundMoney((originalPrice * discountPercent) / 100);
    const finalPrice = roundMoney(originalPrice - discountAmount);

    return {
      originalPrice,
      finalPrice,
      discountPercent,
      discountAmount,
      hasDiscount: discountAmount > 0,
      variant: selectedVariant || (source !== product ? source : null),
    };
  }

  return {
    originalPrice: originalPrice || currentPrice,
    finalPrice: currentPrice,
    discountPercent: 0,
    discountAmount: 0,
    hasDiscount: false,
    variant: selectedVariant || (source !== product ? source : null),
  };
};

export const getCartItemPricing = (item = {}) => {
  const source =
    item.product && typeof item.product === "object" ? item.product : item;
  const pricing = getProductPricing(source, item.variant || null);
  const quantity = Number(item.quantity || item.qty || 1);

  return {
    ...pricing,
    quantity,
    lineTotal: roundMoney(pricing.finalPrice * quantity),
  };
};
