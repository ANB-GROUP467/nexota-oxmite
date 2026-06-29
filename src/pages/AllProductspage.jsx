import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";

import ProductCard from "../components/ui/ProductCard";
import api from "../services/api";

const PAGE_SIZE = 8;

const BRAND_BLUE = "#015DF0";
const BRAND_NAVY = "#0D1B3E";
const BRAND_YELLOW = "#FEEE00";

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.min(i, 8) * 0.04,
      duration: 0.25,
      ease: "easeOut",
    },
  }),
};

const readList = (payload, keys) => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    const value = payload?.[key];
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
  }

  return [];
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || value.$oid || "";
};

const getName = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name || value.title || value.slug || "";
};

const getSlug = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.slug || value.name || value.title || getId(value);
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeCategory = (category) => ({
  ...category,
  id: getId(category),
  name: getName(category) || "Category",
  slug: getSlug(category),
});

function LoadingState() {
  return (
    <div className="mx-auto max-w-[1600px] px-3 py-6 sm:px-5 lg:px-8">
      <div className="mb-5 h-5 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-9 w-56 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-32 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200 sm:w-80" />
      </div>
      <div className="mb-6 flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="h-10 w-24 shrink-0 animate-pulse rounded-xl bg-slate-200"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-2xl bg-slate-200 sm:h-80"
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-14 text-center shadow-sm sm:px-8 sm:py-20">
      <div
        className="mx-auto grid h-16 w-16 place-items-center rounded-2xl sm:h-20 sm:w-20"
        style={{ backgroundColor: BRAND_YELLOW, color: BRAND_NAVY }}
      >
        <SlidersHorizontal size={28} />
      </div>
      <h2 className="mt-5 text-xl font-black text-slate-950 sm:text-2xl">
        No products found
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
        Try another category or clear your search filters.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-black text-white shadow-sm transition hover:brightness-95"
        style={{ backgroundColor: BRAND_BLUE }}
      >
        Reset Filters
      </button>
    </div>
  );
}

function AllProductsPage() {
  const reduceMotion = useReducedMotion();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get("category") || "";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [productsRes, categoriesRes] = await Promise.all([
          api.get("/products?limit=1000"),
          api.get("/categories"),
        ]);

        setProducts(
          readList(productsRes.data, ["products", "data", "items"]).filter(
            Boolean,
          ),
        );
        setCategories(
          readList(categoriesRes.data, ["categories", "data", "items"])
            .filter(Boolean)
            .map(normalizeCategory),
        );
      } catch (err) {
        console.error("Products Page Error:", err);
        setError(err.response?.data?.message || "Products failed to load.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [activeCategory, search]);

  const categoryTabs = useMemo(
    () => [
      { label: "All", value: "" },
      ...categories
        .filter((category) => category.slug)
        .map((category) => ({
          label: category.name,
          value: category.slug,
        })),
    ],
    [categories],
  );

  const activeCategoryLabel =
    categoryTabs.find((tab) => tab.value === activeCategory)?.label ||
    activeCategory;

  const handleCategoryChange = (value) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value) {
      nextParams.set("category", value);
    } else {
      nextParams.delete("category");
    }

    setSearchParams(nextParams, { replace: true });
  };

  const handleReset = () => {
    setSearch("");
    setVisible(PAGE_SIZE);
    setSearchParams({}, { replace: true });
  };

  const filteredProducts = useMemo(() => {
    const query = normalizeText(search);

    return products.filter((product) => {
      const productCategorySlug = normalizeText(getSlug(product.category));
      const productCategoryId = normalizeText(getId(product.category));
      const productCategoryName = normalizeText(getName(product.category));
      const active = normalizeText(activeCategory);

      const categoryMatches =
        !active ||
        productCategorySlug === active ||
        productCategoryId === active ||
        productCategoryName === active;

      if (!categoryMatches) return false;

      if (!query) return true;

      const searchable = [
        product.title,
        product.name,
        product.slug,
        product.description,
        getName(product.brand),
        getSlug(product.brand),
        getName(product.category),
        getSlug(product.category),
        getName(product.subCategory || product.subcategory),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [products, activeCategory, search]);

  const displayedProducts = useMemo(
    () => filteredProducts.slice(0, visible),
    [filteredProducts, visible],
  );

  const hasMore = visible < filteredProducts.length;

  if (loading) return <LoadingState />;

  return (
    <main className="mx-auto w-full max-w-[1600px] px-3 pb-24 pt-5 sm:px-5 sm:pb-10 sm:pt-8 lg:px-8">
      <nav className="mb-5 flex min-w-0 items-center gap-2 overflow-hidden text-xs font-semibold text-slate-400 sm:mb-6">
        <Link to="/" className="shrink-0 hover:text-[#015DF0]">
          Home
        </Link>
        <span className="shrink-0">/</span>
        <span className="min-w-0 truncate text-slate-700">Products</span>
      </nav>

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:mb-6 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-[#015DF0]">
              Explore products
            </p>
            <h1 className="mt-1 truncate text-2xl font-black text-slate-950 sm:text-4xl">
              {activeCategory ? activeCategoryLabel : "All Products"}
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {filteredProducts.length} product
              {filteredProducts.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="w-full lg:max-w-md">
            <label className="sr-only" htmlFor="product-search">
              Search products
            </label>
            <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-[#015DF0] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
              <Search size={18} className="shrink-0 text-slate-400" />
              <input
                id="product-search"
                type="search"
                placeholder="Search products, brands..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {categoryTabs.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoryTabs.map((tab) => {
              const isActive = activeCategory === tab.value;

              return (
                <button
                  type="button"
                  key={tab.value || "all"}
                  onClick={() => handleCategoryChange(tab.value)}
                  className={`h-10 shrink-0 rounded-xl border px-4 text-sm font-black transition ${
                    isActive
                      ? "border-[#015DF0] bg-[#015DF0] text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-[#015DF0]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {displayedProducts.length > 0 ? (
          <motion.div
            key={`${activeCategory}-${search}`}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          >
            {displayedProducts.map((product, index) => (
              <motion.div
                key={product._id || product.id || product.slug || index}
                custom={index}
                variants={reduceMotion ? undefined : cardVariants}
                initial={reduceMotion ? false : "hidden"}
                animate="visible"
                className="min-w-0"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
          >
            <EmptyState onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>

      {hasMore && (
        <div className="mt-8 flex justify-center sm:mt-10">
          <button
            type="button"
            onClick={() => setVisible((value) => value + PAGE_SIZE)}
            className="inline-flex h-12 w-full max-w-sm items-center justify-center rounded-2xl px-6 text-sm font-black shadow-sm transition hover:brightness-95 active:scale-[0.98] sm:w-auto"
            style={{ backgroundColor: BRAND_YELLOW, color: BRAND_NAVY }}
          >
            Load More ({filteredProducts.length - visible})
          </button>
        </div>
      )}
    </main>
  );
}

export default AllProductsPage;
