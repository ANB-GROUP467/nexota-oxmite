import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgePercent,
  CalendarClock,
  Clock,
  PackageCheck,
  Search,
  ShoppingCart,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import useCartStore from "../store/useCartStore";

const NAVY = "#0D1B3E";
const BLUE = "#015DF0";
const YELLOW = "#FEEE00";

const fallbackImage =
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900&auto=format&fit=crop&q=80";

const getId = (item) => item?._id || item?.id || "";

const getProductFromDealItem = (item) => item?.product || item;

const getImage = (deal) => {
  if (deal?.image) return deal.image;

  const products = Array.isArray(deal?.products) ? deal.products : [];

  for (const item of products) {
    const product = getProductFromDealItem(item);

    if (Array.isArray(product?.images) && product.images[0]) {
      return product.images[0];
    }

    if (product?.image) return product.image;
  }

  return fallbackImage;
};

const getDealProductsCount = (deal) =>
  Array.isArray(deal?.products) ? deal.products.length : 0;

const formatQAR = (value) =>
  `QAR ${Number(value || 0).toLocaleString("en-QA", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-QA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDiscountPercent = (deal) => {
  const original = Number(deal?.originalPrice || 0);
  const price = Number(deal?.dealPrice || deal?.price || 0);

  if (!original || !price || price >= original) return 0;

  return Math.round(((original - price) / original) * 100);
};

const getDealState = (deal) => {
  if (deal?.status && deal.status !== "active") {
    return {
      key: "inactive",
      label: "Unavailable",
      tone: "slate",
      canBuy: false,
    };
  }

  if (Number(deal?.stock || 0) <= 0) {
    return {
      key: "outOfStock",
      label: "Out of Stock",
      tone: "orange",
      canBuy: false,
    };
  }

  const now = new Date();
  const startsAt = deal?.startsAt ? new Date(deal.startsAt) : null;
  const endsAt = deal?.endsAt ? new Date(deal.endsAt) : null;

  if (startsAt && startsAt > now) {
    return {
      key: "upcoming",
      label: "Upcoming",
      tone: "blue",
      canBuy: false,
    };
  }

  if (endsAt && endsAt < now) {
    return {
      key: "expired",
      label: "Expired",
      tone: "red",
      canBuy: false,
    };
  }

  return {
    key: "active",
    label: "Active",
    tone: "green",
    canBuy: true,
  };
};

const normalizeDealForCart = (deal) => {
  const id = getId(deal);
  const price = Number(deal?.dealPrice || deal?.price || 0);
  const oldPrice = Number(deal?.originalPrice || deal?.oldPrice || price);
  const image = getImage(deal);

  return {
    _id: id,
    id,
    deal: id,
    itemType: "deal",
    title: deal?.title || "Deal",
    slug: deal?.slug,
    image,
    images: [image],
    price,
    dealPrice: price,
    oldPrice,
    originalPrice: oldPrice,
    stock: Number(deal?.stock || 1),
    quantity: 1,
    products: deal?.products || [],
    badge: deal?.badge || "Deal",
  };
};

function getListFromResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.deals)) return response.deals;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;

  return [];
}

function DealSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[4/3] animate-pulse bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.96 }}
      className="fixed bottom-5 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-[#0D1B3E] px-5 py-3 text-center text-sm font-black text-white shadow-2xl sm:bottom-7"
    >
      {message}
    </motion.div>
  );
}

function StateBadge({ state }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    upcoming: "bg-blue-50 text-blue-700 ring-blue-200",
    expired: "bg-red-50 text-red-700 ring-red-200",
    outOfStock: "bg-orange-50 text-orange-700 ring-orange-200",
    inactive: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${
        styles[state.key] || styles.inactive
      }`}
    >
      {state.label}
    </span>
  );
}

function DealCard({ deal, onAddToCart }) {
  const discount = getDiscountPercent(deal);
  const state = getDealState(deal);
  const productsCount = getDealProductsCount(deal);
  const image = getImage(deal);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <Link to={`/deal/${deal.slug || getId(deal)}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            src={image}
            alt={deal.title || "Deal"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

          <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
            {discount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-black text-white shadow-sm">
                <BadgePercent size={12} />
                {discount}% OFF
              </span>
            )}

            <span
              className="ml-auto rounded-full px-2.5 py-1 text-[11px] font-black shadow-sm"
              style={{ backgroundColor: YELLOW, color: NAVY }}
            >
              {deal.badge || "Deal"}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-black text-white">
              <PackageCheck size={14} />
              {productsCount} item{productsCount !== 1 ? "s" : ""}
            </span>

            <StateBadge state={state} />
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/deal/${deal.slug || getId(deal)}`}>
          <h3 className="line-clamp-2 min-h-[44px] text-base font-black leading-snug text-slate-900 transition group-hover:text-[#015DF0]">
            {deal.title || "Untitled Deal"}
          </h3>
        </Link>

        {deal.description && (
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-slate-500">
            {deal.description}
          </p>
        )}

        <div className="mt-3 grid gap-1 text-xs font-bold text-slate-500">
          {deal.startsAt && (
            <p className="flex items-center gap-1.5">
              <CalendarClock size={14} />
              Starts: {formatDate(deal.startsAt)}
            </p>
          )}

          {deal.endsAt && (
            <p className="flex items-center gap-1.5">
              <Clock size={14} />
              Ends: {formatDate(deal.endsAt)}
            </p>
          )}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-black text-[#015DF0]">
                {formatQAR(deal.dealPrice || deal.price)}
              </p>

              {Number(deal.originalPrice) >
                Number(deal.dealPrice || deal.price) && (
                <p className="text-sm font-bold text-slate-400 line-through">
                  {formatQAR(deal.originalPrice)}
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                Stock
              </p>
              <p className="text-sm font-black text-slate-800">
                {deal.stock ?? 0}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => state.canBuy && onAddToCart(deal)}
            disabled={!state.canBuy}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#015DF0] text-sm font-black text-white shadow-md shadow-blue-600/20 transition hover:bg-[#0A4CD6] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
          >
            <ShoppingCart size={16} />
            {state.canBuy ? "Add Deal" : state.label}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function FilterBar({ query, setQuery, status, setStatus, sort, setSort }) {
  return (
    <div className="sticky top-20 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-md">
      <div className="grid gap-3 md:grid-cols-[1fr_170px_190px]">
        <label className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-[#015DF0] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
          <Search size={17} className="shrink-0 text-slate-400" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search deals..."
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-400 transition hover:text-slate-700"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </label>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-[#015DF0]"
        >
          <option value="all">All deals</option>
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="expired">Expired</option>
          <option value="outOfStock">Out of stock</option>
        </select>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-[#015DF0]"
        >
          <option value="featured">Featured first</option>
          <option value="discount">Biggest discount</option>
          <option value="priceLow">Price low to high</option>
          <option value="priceHigh">Price high to low</option>
          <option value="newest">Newest</option>
        </select>
      </div>
    </div>
  );
}

function Deals() {
  const [deals, setDeals] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    let ignore = false;

    const fetchDeals = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get("/deals");
        const list = getListFromResponse(data);

        if (!ignore) setDeals(list);
      } catch (err) {
        if (!ignore) {
          setDeals([]);
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Unable to load deals.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchDeals();

    return () => {
      ignore = true;
    };
  }, []);

  const handleAddToCart = useCallback(
    (deal) => {
      addToCart(normalizeDealForCart(deal));
      setToast(`${deal.title || "Deal"} added to cart`);
    },
    [addToCart],
  );

  const filteredDeals = useMemo(() => {
    const search = query.trim().toLowerCase();

    let list = deals.filter((deal) => {
      const state = getDealState(deal);

      const matchesQuery =
        !search ||
        `${deal.title || ""} ${deal.description || ""} ${deal.badge || ""}`
          .toLowerCase()
          .includes(search);

      const matchesStatus = status === "all" || state.key === status;

      return matchesQuery && matchesStatus;
    });

    const sorters = {
      priceLow: (a, b) =>
        Number(a.dealPrice || a.price || 0) -
        Number(b.dealPrice || b.price || 0),
      priceHigh: (a, b) =>
        Number(b.dealPrice || b.price || 0) -
        Number(a.dealPrice || a.price || 0),
      discount: (a, b) => getDiscountPercent(b) - getDiscountPercent(a),
      newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      featured: (a, b) =>
        Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
    };

    if (sorters[sort]) list = [...list].sort(sorters[sort]);

    return list;
  }, [deals, query, sort, status]);

  const activeCount = useMemo(
    () => deals.filter((deal) => getDealState(deal).key === "active").length,
    [deals],
  );

  const topDiscount = useMemo(
    () => Math.max(0, ...deals.map(getDiscountPercent)),
    [deals],
  );

  return (
    <MainLayout>
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast("")} />}
      </AnimatePresence>

      <main className="min-h-screen bg-[#f6f7fa] px-4 py-6 sm:px-6 lg:px-8">
        <section
          className="relative mx-auto max-w-[1600px] overflow-hidden rounded-3xl px-5 py-8 text-white shadow-xl sm:px-8 sm:py-10 lg:px-12"
          style={{ backgroundColor: NAVY }}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#015DF0]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 left-8 h-40 w-40 rounded-full bg-[#FEEE00]/20 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em]"
                style={{ color: YELLOW }}
              >
                <Sparkles size={13} />
                Nexota Deals
              </p>

              <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                Bundle deals made for better value
              </h1>

              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/70 sm:text-base">
                Curated bundles and limited-time offers from Nexota products.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white/80">
                <Zap size={16} className="text-[#FEEE00]" />
                {activeCount} active
              </div>

              {topDiscount > 0 && (
                <div className="flex items-center gap-2 rounded-2xl bg-red-500/20 px-4 py-2.5 text-sm font-bold text-white/90">
                  <BadgePercent size={16} className="text-red-300" />
                  Up to {topDiscount}% off
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-[1600px]">
          <FilterBar
            query={query}
            setQuery={setQuery}
            status={status}
            setStatus={setStatus}
            sort={sort}
            setSort={setSort}
          />

          <div className="mt-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-[#0D1B3E] sm:text-2xl">
              Deals
            </h2>

            <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm">
              {filteredDeals.length} deal{filteredDeals.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <DealSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-10 text-center">
              <p className="font-black text-red-600">{error}</p>
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-[#015DF0]">
                <BadgePercent size={30} />
              </div>

              <h3 className="mt-5 text-2xl font-black text-slate-900">
                No deals found
              </h3>

              <p className="mt-2 text-sm font-medium text-slate-500">
                Try changing filters or add deals from admin panel.
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredDeals.map((deal) => (
                  <DealCard
                    key={getId(deal)}
                    deal={deal}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </main>
    </MainLayout>
  );
}

export default Deals;
