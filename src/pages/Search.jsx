import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Loader2,
  PackageSearch,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import MainLayout from "../layouts/MainLayout";
import ProductCard from "../components/ui/ProductCard";
import AppSearchBar from "../components/ui/AppSearchBar";
import api from "../services/api";

const BRAND_BLUE = "#015DF0";
const BRAND_NAVY = "#0D1B3E";
const BRAND_YELLOW = "#FEEE00";

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || value.$oid || "";
};

const normalizeList = (data) => {
  const possible =
    data?.products ||
    data?.data?.products ||
    data?.data?.items ||
    data?.items ||
    data?.data ||
    data;

  return Array.isArray(possible) ? possible : [];
};

const getName = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name || value.title || value.slug || getId(value);
};

const getTitle = (product) => product?.title || product?.name || "Product";
const getBrand = (product) => getName(product?.brand);
const getCategory = (product) => getName(product?.category);
const getPrice = (product) => Number(product?.price || product?.salePrice || 0);
const getRating = (product) =>
  Number(product?.rating || product?.averageRating || 0);

const searchMatches = (product, term) => {
  const query = term.trim().toLowerCase();
  if (!query) return true;

  return [
    getTitle(product),
    product?.description,
    product?.slug,
    getBrand(product),
    getCategory(product),
    getName(product?.subCategory),
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
};

const sortProducts = (products, sortBy) => {
  const next = [...products];

  if (sortBy === "price-low")
    return next.sort((a, b) => getPrice(a) - getPrice(b));
  if (sortBy === "price-high")
    return next.sort((a, b) => getPrice(b) - getPrice(a));
  if (sortBy === "rating")
    return next.sort((a, b) => getRating(b) - getRating(a));
  if (sortBy === "newest") {
    return next.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );
  }

  return next;
};

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery =
    searchParams.get("q") ||
    searchParams.get("query") ||
    searchParams.get("search") ||
    "";

  const [query, setQuery] = useState(urlQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setQuery(urlQuery);
    setDebouncedQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const clean = query.trim();
      setDebouncedQuery(clean);

      if (clean) setSearchParams({ q: clean }, { replace: true });
      else setSearchParams({}, { replace: true });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      const cleanQuery = debouncedQuery.trim();
      const encoded = encodeURIComponent(cleanQuery);
      const endpoints = cleanQuery
        ? [
            `/products?search=${encoded}&limit=100`,
            `/products?keyword=${encoded}&limit=100`,
            `/products?query=${encoded}&limit=100`,
            `/products?limit=100`,
          ]
        : ["/products?limit=100"];

      try {
        setLoading(true);
        setError("");

        for (const endpoint of endpoints) {
          try {
            const { data } = await api.get(endpoint);
            const list = normalizeList(data);

            if (!cancelled) {
              setProducts(
                list.filter((product) => product?.status !== "inactive"),
              );
            }

            return;
          } catch {
            // Try the next backend query shape.
          }
        }

        throw new Error("Products API is not responding.");
      } catch (err) {
        if (!cancelled) {
          setProducts([]);
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load products right now.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const brands = useMemo(() => {
    const set = new Set(products.map(getBrand).filter(Boolean));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set(products.map(getCategory).filter(Boolean));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const trendingSearches = useMemo(() => {
    const fromProducts = products
      .flatMap((product) => [
        getBrand(product),
        getCategory(product),
        getTitle(product),
      ])
      .filter(Boolean)
      .map((value) => String(value).trim())
      .filter((value) => value.length > 2);

    const unique = Array.from(new Set(fromProducts));
    return unique.slice(0, 8).length
      ? unique.slice(0, 8)
      : ["iPhone", "Gaming", "Laptop", "Samsung", "Headphones", "PlayStation"];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const brandMatch =
        selectedBrand === "all" || getBrand(product) === selectedBrand;
      const categoryMatch =
        selectedCategory === "all" || getCategory(product) === selectedCategory;

      return (
        brandMatch && categoryMatch && searchMatches(product, debouncedQuery)
      );
    });

    return sortProducts(filtered, sortBy);
  }, [debouncedQuery, products, selectedBrand, selectedCategory, sortBy]);

  const resetFilters = () => {
    setSelectedBrand("all");
    setSelectedCategory("all");
    setSortBy("relevance");
  };

  const hasFilters =
    selectedBrand !== "all" ||
    selectedCategory !== "all" ||
    sortBy !== "relevance";

  return (
    <MainLayout>
      <main className="mx-auto w-full max-w-[1600px] px-3 py-6 sm:px-4 sm:py-8 lg:px-6 lg:py-10">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-6 lg:p-7"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div
                className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide"
                style={{
                  backgroundColor: `${BRAND_YELLOW}55`,
                  color: BRAND_NAVY,
                }}
              >
                <Sparkles size={14} />
                Product Finder
              </div>
              <h1 className="text-2xl font-black leading-tight text-slate-950 sm:text-4xl">
                Search Products
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 sm:text-base">
                Find products, brands, categories, and deals from live
                inventory.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <PackageSearch size={18} style={{ color: BRAND_BLUE }} />
              {loading
                ? "Loading products..."
                : `${filteredProducts.length} result${
                    filteredProducts.length === 1 ? "" : "s"
                  }`}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row">
            <AppSearchBar
              variant="page"
              initialValue={query}
              onQueryChange={setQuery}
              onSearch={(value) => {
                setQuery(value);
                setDebouncedQuery(value);
              }}
              onClear={() => {
                setQuery("");
                setDebouncedQuery("");
              }}
            />

            <button
              type="button"
              onClick={() => setMobileFiltersOpen((value) => !value)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-[#015DF0] lg:hidden"
            >
              <SlidersHorizontal size={17} />
              Filters
            </button>
          </div>

          {!debouncedQuery && (
            <div className="mt-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
                <Sparkles size={16} style={{ color: BRAND_BLUE }} />
                Trending searches
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                {trendingSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuery(item)}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#015DF0]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside
            className={`${
              mobileFiltersOpen ? "block" : "hidden"
            } h-fit rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 lg:block lg:p-5`}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-slate-950">Filters</h2>
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-black text-[#015DF0] hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                  Sort by
                </span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                  Brand
                </span>
                <select
                  value={selectedBrand}
                  onChange={(event) => setSelectedBrand(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                >
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand === "all" ? "All brands" : brand}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                  Category
                </span>
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All categories" : category}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </aside>

          <section className="min-w-0">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {error}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-72 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
                  />
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {filteredProducts.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="rounded-2xl bg-white px-5 py-14 text-center shadow-sm ring-1 ring-slate-100 sm:px-8"
                  >
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50">
                      <PackageSearch size={32} style={{ color: BRAND_BLUE }} />
                    </div>
                    <h2 className="mt-5 text-2xl font-black text-slate-950">
                      No products found
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                      Try a different keyword, reset filters, or browse all
                      products.
                    </p>
                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          resetFilters();
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                      >
                        Clear Search
                      </button>
                      <Link
                        to="/products"
                        className="rounded-xl px-5 py-3 text-center text-sm font-black text-white transition hover:brightness-95"
                        style={{ backgroundColor: BRAND_BLUE }}
                      >
                        Browse Products
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6"
                  >
                    {filteredProducts.map((product, index) => (
                      <motion.div
                        key={
                          getId(product) || product.slug || getTitle(product)
                        }
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "80px" }}
                        transition={{ delay: Math.min(index * 0.03, 0.3) }}
                        className="min-w-0"
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {loading && (
              <div className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Loading live results...
              </div>
            )}
          </section>
        </div>
      </main>
    </MainLayout>
  );
}

export default Search;
