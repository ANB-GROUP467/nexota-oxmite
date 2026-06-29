import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "../ui/ProductCard";
import api from "../../services/api";

const DEFAULT_PAGE_SIZE = 8;

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.25,
      ease: "easeOut",
    },
  }),
};

const getName = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name || value.title || "";
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

const getListFromResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.products)) return response.products;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;

  return [];
};

const normalizeProduct = (product) => ({
  ...product,
  _id: product?._id || product?.id,
  id: product?.id || product?._id,
  brandName: getName(product?.brand),
  brandId: getId(product?.brand),
  categoryName: getName(product?.category),
  categoryId: getId(product?.category),
  subCategoryName: getName(product?.subCategory || product?.subcategory),
  subCategoryId: getId(product?.subCategory || product?.subcategory),
});

function ProductSection({
  title = "Products",
  subtitle = "Explore products picked for you",
  endpoint = "/products",
  pageSize = DEFAULT_PAGE_SIZE,
  limit = 1000,
  category,
  subCategory,
  brand,
  featuredOnly = false,
  bestSellerOnly = false,
  recommendedOnly = false,
  status = "active",
  sortBy = "newest",
  showHeader = true,
  showLoadMore = true,
  emptyText = "No products found.",
  className = "",
}) {
  const [products, setProducts] = useState([]);
  const [visible, setVisible] = useState(pageSize);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();

    if (limit) params.set("limit", String(limit));
    if (category) params.set("category", category);
    if (subCategory) params.set("subCategory", subCategory);
    if (brand) params.set("brand", brand);
    if (status) params.set("status", status);

    return params.toString();
  }, [brand, category, limit, status, subCategory]);

  useEffect(() => {
    let ignore = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
        const { data } = await api.get(url);

        if (ignore) return;

        const productList = getListFromResponse(data).map(normalizeProduct);

        setProducts(productList);
        setVisible(pageSize);
      } catch (err) {
        if (ignore) return;

        setProducts([]);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load products.",
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      ignore = true;
    };
  }, [endpoint, pageSize, queryParams]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (featuredOnly) {
      list = list.filter((product) => Boolean(product.featured));
    }

    if (bestSellerOnly) {
      list = list.filter((product) => Boolean(product.bestSeller));
    }

    if (recommendedOnly) {
      list = list.filter((product) => Boolean(product.recommended));
    }

    if (sortBy === "priceLow") {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    if (sortBy === "priceHigh") {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    if (sortBy === "rating") {
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    if (sortBy === "discount") {
      list.sort((a, b) => {
        const discountA =
          Number(a.oldPrice || 0) > Number(a.price || 0)
            ? Number(a.oldPrice) - Number(a.price)
            : 0;

        const discountB =
          Number(b.oldPrice || 0) > Number(b.price || 0)
            ? Number(b.oldPrice) - Number(b.price)
            : 0;

        return discountB - discountA;
      });
    }

    if (sortBy === "newest") {
      list.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
    }

    return list;
  }, [bestSellerOnly, featuredOnly, products, recommendedOnly, sortBy]);

  const displayedProducts = useMemo(
    () => filteredProducts.slice(0, visible),
    [filteredProducts, visible],
  );

  const hasMore = visible < filteredProducts.length;

  if (loading) {
    return (
      <section className={`py-10 sm:py-14 ${className}`}>
        {showHeader && (
          <div className="mb-6 sm:mb-8">
            <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded bg-slate-100" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: pageSize }).map((_, index) => (
            <div
              key={index}
              className="h-[360px] animate-pulse rounded-2xl bg-white shadow-sm"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={`py-10 sm:py-14 ${className}`}>
      {showHeader && (
        <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black leading-tight text-[#0D1B3E] sm:text-3xl">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">
                {subtitle}
              </p>
            )}
          </div>

          <p className="text-sm font-bold text-slate-500">
            {filteredProducts.length} product
            {filteredProducts.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm font-bold text-red-600">
          {error}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500 shadow-sm sm:p-10">
          {emptyText}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {displayedProducts.map((product, index) => {
              const productKey =
                product._id || product.id || product.slug || `${index}`;

              return index < pageSize ? (
                <motion.div
                  key={productKey}
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <ProductCard product={product} />
                </motion.div>
              ) : (
                <div key={productKey}>
                  <ProductCard product={product} />
                </div>
              );
            })}
          </div>

          {showLoadMore && hasMore && (
            <div className="mt-8 flex justify-center sm:mt-10">
              <button
                type="button"
                onClick={() => setVisible((value) => value + pageSize)}
                className="h-12 rounded-xl bg-[#FEEE00] px-7 text-sm font-black text-[#0D1B3E] shadow-sm transition hover:bg-yellow-300 active:scale-[0.98] sm:px-8"
              >
                Load More Products
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default ProductSection;
