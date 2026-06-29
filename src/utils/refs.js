export const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (value._id) return String(value._id);
  if (value.id && typeof value.id !== "object") return String(value.id);
  if (value.$oid) return String(value.$oid);
  if (typeof value.toString === "function") {
    const asString = value.toString();
    if (/^[a-f\d]{24}$/i.test(asString)) return asString;
  }
  return "";
};

export const getName = (value) => value?.name || value?.title || "Untitled";

export const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

export const getList = (response, keys = []) => {
  if (Array.isArray(response)) return response;

  for (const key of keys) {
    const value = response?.[key];
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.docs)) return value.docs;
  }

  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export const resolveCategoryRef = (subCategory) => {
  const category = subCategory?.category;

  // Fix: if category is a populated object (as API returns), extract from it directly
  if (category && typeof category === "object") {
    return {
      categoryId: getId(category),
      categorySlug: category.slug || "",
    };
  }

  // Fallback: category is a plain string ID or other ref fields
  const categoryId = String(
    (typeof category === "string" ? category : "") ||
      subCategory?.categoryId ||
      subCategory?.category_id ||
      "",
  );

  const categorySlug =
    subCategory?.categorySlug || subCategory?.category_slug || "";

  return { categoryId, categorySlug };
};

export const matchesSubToCategory = (subCategory, category) => {
  if (!subCategory || !category) return false;

  const { categoryId: subCategoryId, categorySlug: subCategorySlug } =
    resolveCategoryRef(subCategory);

  const categoryId = getId(category);
  const categorySlug = normalizeText(category.slug || category.name);

  // Slug match (most reliable — API returns populated slug)
  const slugMatch =
    categorySlug &&
    subCategorySlug &&
    normalizeText(subCategorySlug) === categorySlug;

  // ID match
  const idMatch = categoryId && subCategoryId && subCategoryId === categoryId;

  return Boolean(slugMatch || idMatch);
};

export const normalizeCategory = (category) => ({
  ...category,
  _id: getId(category),
  slug: category.slug || getId(category),
  name: getName(category),
});

export const normalizeSubCategory = (subCategory) => {
  const { categoryId, categorySlug } = resolveCategoryRef(subCategory);

  return {
    ...subCategory,
    // Preserve raw category object so Navbar can match by slug/id directly
    _rawCategory: subCategory?.category || null,
    _id: getId(subCategory),
    slug: subCategory.slug || getId(subCategory),
    name: getName(subCategory),
    categoryId,
    categorySlug,
    isActive: subCategory.isActive !== false,
  };
};

export const getCategoryPath = (category) =>
  `/category/${encodeURIComponent(category.slug || getId(category))}`;

export const getSubCategoryPath = (category, subCategory) =>
  `${getCategoryPath(category)}?subcategory=${encodeURIComponent(
    subCategory.slug || getId(subCategory),
  )}`;

export const matchesProductSubCategory = (product, subCategoryRef) => {
  if (!subCategoryRef) return true;

  const expected = normalizeText(subCategoryRef);
  const sub = product?.subCategory || product?.subcategory;

  const candidates = [
    sub,
    getId(sub),
    sub?.slug,
    sub?.name,
    product?.subCategoryId,
    product?.subCategorySlug,
    product?.subcategoryId,
    product?.subcategorySlug,
  ]
    .filter(Boolean)
    .map(normalizeText);

  return candidates.includes(expected);
};
