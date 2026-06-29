import api from "./api";
import {
  getId,
  getList,
  getName,
  normalizeSubCategory,
  resolveCategoryRef,
} from "../utils/refs";

export const fetchCategories = async () => {
  try {
    const res = await api.get("/categories");
    return getList(res.data, ["categories", "data"]);
  } catch (err) {
    console.error("fetchCategories error:", err.message);
    return [];
  }
};

export const fetchSubCategories = async () => {
  try {
    const res = await api.get("/subcategories");
    const list = getList(res.data, [
      "subCategories",
      "subcategories",
      "sub_categories",
      "subCategory",
      "data",
    ]);

    return list
      .map(normalizeSubCategory)
      .filter((sub) => sub._id && sub.categoryId && sub.isActive !== false);
  } catch (err) {
    console.error(
      "fetchSubCategories error:",
      err.response?.status,
      err.response?.data,
      err.message,
    );
    return [];
  }
};

export const fetchSubCategoriesByCategoryId = async (categoryId) => {
  try {
    const res = await api.get(`/categories/${categoryId}/subcategories`);
    const list = getList(res.data, ["subCategories", "subcategories", "data"]);

    return list
      .map(normalizeSubCategory)
      .filter((sub) => sub._id && sub.categoryId);
  } catch {
    const all = await fetchSubCategories();
    const targetId = String(categoryId);

    return all.filter((sub) => {
      const { categoryId: subCategoryId } = resolveCategoryRef(sub);
      return subCategoryId === targetId;
    });
  }
};

export const fetchBrands = async () => {
  try {
    const res = await api.get("/brands");
    return getList(res.data, ["brands", "data"]);
  } catch (err) {
    console.error("fetchBrands error:", err.message);
    return [];
  }
};

export const fetchNavData = async () => {
  const [categories, subCategories, brands] = await Promise.all([
    fetchCategories(),
    fetchSubCategories(),
    fetchBrands(),
  ]);

  return { categories, subCategories, brands };
};

export const normalizeBrands = (list = []) =>
  list
    .filter((brand) => brand?.isActive !== false)
    .map((brand) => ({
      ...brand,
      _id: getId(brand),
      name: getName(brand),
      slug: brand.slug || getId(brand),
    }));
