import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import ProductCard from "../components/ui/ProductCard";
import api from "../services/api";

const BRAND_BLUE = "#015DF0";
const BRAND_NAVY = "#0D1B3E";

// ─── Helpers ────────────────────────────────────────────────────────────────

const getList = (response, keys = []) => {
  if (Array.isArray(response)) return response;

  for (const key of keys) {
    const value = response?.[key];
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
  }

  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  if (value.$oid) return String(value.$oid);
  return "";
};

const getName = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name || value.title || "";
};

const getSlug = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.slug || value.name || value._id || value.id || "";
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

const getCategoryPath = (categoryOrSlug) => {
  if (typeof categoryOrSlug === "string") {
    return `/category/${encodeURIComponent(categoryOrSlug)}`;
  }
  return `/category/${encodeURIComponent(
    categoryOrSlug?.slug || getId(categoryOrSlug),
  )}`;
};

const getSubCategoryPath = (category, subCategory) =>
  `${getCategoryPath(category)}?subcategory=${encodeURIComponent(
    subCategory.slug || getId(subCategory),
  )}`;

// ─── Normalizers ────────────────────────────────────────────────────────────

const normalizeCategory = (category) => ({
  ...category,
  _id: getId(category),
  name: getName(category),
  slug: getSlug(category),
});

// FIX: added categoryName so subcategory filtering has a third fallback
const normalizeSubCategory = (subCategory) => ({
  ...subCategory,
  _id: getId(subCategory),
  name: getName(subCategory),
  slug: getSlug(subCategory),
  categoryId: getId(subCategory.category),
  categorySlug: subCategory.category?.slug || "",
  categoryName: getName(subCategory.category), // ← NEW
});

const normalizeProduct = (product) => ({
  ...product,
  brand: getName(product.brand),
  category: getName(product.category),
  categoryId: getId(product.category),
  categorySlug: getSlug(product.category),
  subCategory: getName(product.subCategory || product.subcategory),
  subCategoryId: getId(product.subCategory || product.subcategory),
  subCategorySlug: getSlug(product.subCategory || product.subcategory),
});

// ─── Finders / matchers ─────────────────────────────────────────────────────

const findCurrentCategory = (categories, slug) => {
  const expected = normalizeText(slug);

  return categories.find((category) => {
    return [category._id, category.slug, category.name]
      .filter(Boolean)
      .map(normalizeText)
      .includes(expected);
  });
};

const productMatchesCategory = (product, category, slug) => {
  const matchers = new Set(
    [slug, category?._id, category?.slug, category?.name]
      .filter(Boolean)
      .map(normalizeText),
  );

  return [
    product.category,
    product.categoryId,
    product.categorySlug,
    product.categoryName,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .some((value) => matchers.has(value));
};

const productMatchesSubCategory = (product, subcategorySlug) => {
  if (!subcategorySlug) return true;

  const expected = normalizeText(subcategorySlug);

  return [
    product.subCategory,
    product.subCategoryId,
    product.subCategorySlug,
    product.subcategory,
    product.subCategoryName,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .includes(expected);
};

// FIX: use normalizeText comparison so ObjectId / slug / name all work reliably
const subCategoryBelongsToCategory = (subCategory, selectedCategory) => {
  if (!selectedCategory) return false;

  const catId = normalizeText(getId(selectedCategory));
  const catSlug = normalizeText(selectedCategory.slug);
  const catName = normalizeText(selectedCategory.name);

  return (
    (catId && normalizeText(subCategory.categoryId) === catId) ||
    (catSlug && normalizeText(subCategory.categorySlug) === catSlug) ||
    (catName && normalizeText(subCategory.categoryName) === catName)
  );
};

const uniqueProducts = (products) => {
  const seen = new Set();

  return products.filter((product) => {
    const key = getId(product) || product.slug || product.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getHighestPrice = (products) => {
  const highest = products.reduce(
    (max, product) => Math.max(max, Number(product.price) || 0),
    0,
  );

  return Math.max(Math.ceil(highest / 100) * 100, 100);
};

// ─── Filter Panel ────────────────────────────────────────────────────────────

function FilterPanel({
  brands,
  selectedBrand,
  setSelectedBrand,
  selectedRating,
  setSelectedRating,
  maxPrice,
  setMaxPrice,
  priceLimit,
  onReset,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-[#0D1B3E]">Filters</h2>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-2 py-1 text-xs font-black text-[#015DF0] hover:bg-blue-50"
        >
          Reset all
        </button>
      </div>

      {/* Brand — only rendered when the current category actually has brands */}
      {brands.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
            Brand
          </h3>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="radio"
                name="brand"
                checked={selectedBrand === ""}
                onChange={() => setSelectedBrand("")}
                className="accent-[#015DF0]"
              />
              All Brands
            </label>

            {brands.map((brand) => (
              <label
                key={brand.key}
                className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700"
              >
                <input
                  type="radio"
                  name="brand"
                  checked={selectedBrand === brand.name}
                  onChange={() => setSelectedBrand(brand.name)}
                  className="accent-[#015DF0]"
                />
                {brand.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Min Rating */}
      <div>
        <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
          Min. Rating
        </h3>
        <div className="space-y-2">
          {[
            { value: 0, label: "All Ratings" },
            { value: 3, label: "3 star & Above" },
            { value: 4, label: "4 star & Above" },
          ].map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700"
            >
              <input
                type="radio"
                name="rating"
                checked={selectedRating === value}
                onChange={() => setSelectedRating(value)}
                className="accent-[#015DF0]"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Max Price */}
      <div>
        <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
          Max Price:{" "}
          <span className="normal-case text-[#015DF0]">
            QAR {maxPrice.toLocaleString()}
          </span>
        </h3>
        <input
          type="range"
          min="0"
          max={priceLimit}
          step={Math.max(1, Math.floor(priceLimit / 100))}
          value={maxPrice}
          onChange={(event) => setMaxPrice(Number(event.target.value))}
          className="w-full accent-[#015DF0]"
        />
        <div className="mt-1 flex justify-between text-xs font-bold text-slate-400">
          <span>QAR 0</span>
          <span>QAR {priceLimit.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Card ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="aspect-[4/3] animate-pulse bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-100" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-100" />
        <div className="h-5 w-1/4 animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

// ─── Category Page ───────────────────────────────────────────────────────────

function Category() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const subcategorySlug = searchParams.get("subcategory") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [priceLimit, setPriceLimit] = useState(100);

  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);
  const [sortBy, setSortBy] = useState("featured");

  const currentCategory = useMemo(
    () => findCurrentCategory(categories, slug),
    [categories, slug],
  );

  const currentSubCategory = useMemo(() => {
    const expected = normalizeText(subcategorySlug);
    if (!expected) return null;

    return subCategories.find((subCategory) => {
      return [subCategory.slug, subCategory._id, subCategory.name]
        .filter(Boolean)
        .map(normalizeText)
        .includes(expected);
    });
  }, [subCategories, subcategorySlug]);

  const pageTitle = currentSubCategory?.name || currentCategory?.name || slug;

  const resetFilters = useCallback(
    (limit) => {
      setSelectedBrand("");
      setSelectedRating(0);
      setSortBy("featured");
      setMaxPrice(limit ?? priceLimit);
    },
    [priceLimit],
  );

  // Close drawer when viewport widens to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setDrawerOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const loadCategory = async () => {
      setLoading(true);
      resetFilters(100);

      try {
        const [productsRes, categoriesRes, subCategoriesRes] =
          await Promise.all([
            api.get("/products?limit=1000"),
            api.get("/categories"),
            api.get("/subcategories").catch(() => ({ data: [] })),
          ]);

        if (!mounted) return;

        // Normalize categories
        const categoryList = getList(categoriesRes.data, [
          "categories",
          "data",
        ]).map(normalizeCategory);

        // Normalize all subcategories (now includes categoryName)
        const subCategoryList = getList(subCategoriesRes.data, [
          "subCategories",
          "subcategories",
          "data",
        ])
          .map(normalizeSubCategory)
          .filter((sc) => sc.categoryId || sc.categorySlug || sc.categoryName);

        // Find the category object that matches the URL slug
        const selectedCategory = findCurrentCategory(categoryList, slug);

        // FIX: use normalizeText-based comparison instead of strict ===
        // so ObjectId strings, slugs, and names all match reliably
        const categorySubCategories = subCategoryList.filter((sc) =>
          subCategoryBelongsToCategory(sc, selectedCategory),
        );

        // Filter products to this category
        let productList = getList(productsRes.data, ["products", "data"])
          .map(normalizeProduct)
          .filter((product) =>
            productMatchesCategory(product, selectedCategory, slug),
          );

        // Further narrow by subcategory if one is active
        if (subcategorySlug) {
          productList = productList.filter((product) =>
            productMatchesSubCategory(product, subcategorySlug),
          );
        }

        productList = uniqueProducts(productList);

        const nextPriceLimit = getHighestPrice(productList);

        // FIX: deduplicate brands from the *filtered* product list only,
        // and skip any product whose brand is an empty / whitespace string
        const uniqueBrands = productList.reduce((acc, product) => {
          const brandName = product.brand?.trim();
          if (!brandName) return acc;
          const key = normalizeText(brandName);
          if (!acc.some((b) => b.key === key)) {
            acc.push({ key, name: brandName });
          }
          return acc;
        }, []);

        setCategories(categoryList);
        setSubCategories(categorySubCategories); // only this category's subcategories
        setProducts(productList);
        setBrands(uniqueBrands); // only brands present in this category
        setPriceLimit(nextPriceLimit);
        setMaxPrice(nextPriceLimit);
      } catch (error) {
        if (!mounted) return;
        console.error("Category fetch error:", error.message);
        setProducts([]);
        setBrands([]);
        setSubCategories([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCategory();

    return () => {
      mounted = false;
    };
  }, [resetFilters, slug, subcategorySlug]);

  // ── Client-side filtering & sorting ──────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let data = [...products];

    if (selectedBrand) {
      data = data.filter(
        (product) =>
          product.brand?.toLowerCase() === selectedBrand.toLowerCase(),
      );
    }

    if (selectedRating > 0) {
      data = data.filter(
        (product) => Number(product.rating || 0) >= selectedRating,
      );
    }

    data = data.filter((product) => Number(product.price || 0) <= maxPrice);

    switch (sortBy) {
      case "low-high":
        data.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        break;
      case "high-low":
        data.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        break;
      case "rating":
        data.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
        break;
      case "newest":
        data.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
        break;
      default:
        data.sort((a, b) => Number(b.featured) - Number(a.featured));
        break;
    }

    return data;
  }, [maxPrice, products, selectedBrand, selectedRating, sortBy]);

  const activeFilterCount = [
    selectedBrand !== "",
    selectedRating > 0,
    maxPrice < priceLimit,
  ].filter(Boolean).length;

  const filterProps = {
    brands,
    selectedBrand,
    setSelectedBrand,
    selectedRating,
    setSelectedRating,
    maxPrice,
    setMaxPrice,
    priceLimit,
    onReset: () => resetFilters(priceLimit),
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="mx-auto max-w-[1600px] px-3 py-5 sm:px-5 sm:py-7 lg:px-6">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm font-semibold capitalize text-slate-400">
          <Link to="/" className="hover:text-[#015DF0]">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-600">
            {currentCategory?.name || slug}
          </span>
          {currentSubCategory && (
            <>
              <span className="mx-2">/</span>
              <span className="text-slate-600">{currentSubCategory.name}</span>
            </>
          )}
        </div>

        {/* Page header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black capitalize text-[#0D1B3E] sm:text-4xl">
              {pageTitle}
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {loading
                ? "Loading products…"
                : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} available`}
            </p>
          </div>
        </div>

        {/* Subcategory pill strip removed — subcategories are shown in the navbar only */}

        {/* Main layout: sidebar + product grid */}
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <FilterPanel {...filterProps} />
            </div>
          </aside>

          {/* Product section */}
          <section className="min-w-0">
            {/* Sort / filter bar */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black text-[#0D1B3E] lg:hidden"
              >
                <Filter size={17} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#015DF0] px-1 text-xs text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <p className="hidden text-sm font-bold text-slate-500 sm:block">
                {loading
                  ? "Loading…"
                  : `${filteredProducts.length} ${
                      filteredProducts.length === 1 ? "Product" : "Products"
                    }`}
              </p>

              <label className="ml-auto flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                <SlidersHorizontal size={16} className="text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-full bg-transparent text-sm font-bold outline-none"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="low-high">Price: Low – High</option>
                  <option value="high-low">Price: High – Low</option>
                  <option value="rating">Best Rating</option>
                </select>
              </label>
            </div>

            {/* Grid states */}
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
                <Search size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="font-black text-slate-700">
                  No products match your filters.
                </p>
                <button
                  type="button"
                  onClick={() => resetFilters(priceLimit)}
                  className="mt-4 text-sm font-black text-[#015DF0] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id || product.id || product.slug}
                    product={product}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-[1200] bg-black/45 lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-[1201] flex w-80 max-w-[88vw] flex-col bg-white shadow-2xl lg:hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <span className="text-lg font-black text-[#0D1B3E]">Filters</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <FilterPanel {...filterProps} />
            </div>

            <div className="border-t border-slate-100 p-5">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="h-12 w-full rounded-xl bg-[#015DF0] text-sm font-black text-white"
              >
                Show {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "Product" : "Products"}
              </button>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
}

export default Category;
