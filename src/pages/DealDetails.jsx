import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgePercent,
  CalendarClock,
  CheckCircle2,
  Clock,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import useCartStore from "../store/useCartStore";

const NAVY = "#0D1B3E";
const BLUE = "#015DF0";
const YELLOW = "#FEEE00";

const fallbackImage =
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80";

const getId = (item) => item?._id || item?.id || "";
const getProduct = (item) => item?.product || item || {};

const getProductImage = (product) => {
  if (product?.image) return product.image;

  if (Array.isArray(product?.images) && product.images[0]) {
    return product.images[0];
  }

  return fallbackImage;
};

const getDealImage = (deal) => {
  if (deal?.image) return deal.image;

  const firstProduct = getProduct(deal?.products?.[0]);

  return getProductImage(firstProduct);
};

const formatQAR = (value) =>
  `QAR ${Number(value || 0).toLocaleString("en-QA", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "Not set";

  return new Date(value).toLocaleDateString("en-QA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDiscountPercent = (originalPrice, dealPrice) => {
  const original = Number(originalPrice || 0);
  const price = Number(dealPrice || 0);

  if (!original || !price || price >= original) return 0;

  return Math.round(((original - price) / original) * 100);
};

const getDealState = (deal) => {
  if (deal?.status && deal.status !== "active") {
    return {
      key: "inactive",
      label: "Unavailable",
      canBuy: false,
    };
  }

  if (Number(deal?.stock || 0) <= 0) {
    return {
      key: "outOfStock",
      label: "Out of Stock",
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
      canBuy: false,
    };
  }

  if (endsAt && endsAt < now) {
    return {
      key: "expired",
      label: "Expired",
      canBuy: false,
    };
  }

  return {
    key: "active",
    label: "Active",
    canBuy: true,
  };
};

const normalizeDealForCart = (deal) => {
  const id = getId(deal);
  const price = Number(deal?.dealPrice || deal?.price || 0);
  const oldPrice = Number(deal?.originalPrice || deal?.oldPrice || price);
  const image = getDealImage(deal);

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

function DealDetailsSkeleton() {
  return (
    <MainLayout>
      <main className="min-h-screen bg-[#f6f7fa] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-200" />

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="aspect-[4/3] animate-pulse rounded-3xl bg-slate-200" />
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="mt-8 h-14 w-full animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      </main>
    </MainLayout>
  );
}

function StatusBadge({ state }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    upcoming: "bg-blue-50 text-blue-700 ring-blue-200",
    expired: "bg-red-50 text-red-700 ring-red-200",
    outOfStock: "bg-orange-50 text-orange-700 ring-orange-200",
    inactive: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1 ${
        styles[state.key] || styles.inactive
      }`}
    >
      {state.label}
    </span>
  );
}

function IncludedProductCard({ item, dealPriceShare }) {
  const product = getProduct(item);
  const quantity = Number(item?.quantity || 1);
  const productPrice = Number(product?.price || 0) * quantity;
  const productOldPrice =
    Number(product?.oldPrice || product?.price || 0) * quantity;
  const image = getProductImage(product);
  const discount = getDiscountPercent(productPrice, dealPriceShare);

  return (
    <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[96px_1fr_auto] sm:items-center">
      <Link
        to={`/product/${product?.slug || getId(product)}`}
        className="aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 sm:w-24"
      >
        <img
          src={image}
          alt={product?.title || "Product"}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </Link>

      <div className="min-w-0">
        <Link to={`/product/${product?.slug || getId(product)}`}>
          <h3 className="line-clamp-2 text-base font-black text-slate-900 transition hover:text-[#015DF0]">
            {product?.title || "Product"}
          </h3>
        </Link>

        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">
            Qty: {quantity}
          </span>

          {product?.status && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
              {product.status}
            </span>
          )}

          {discount > 0 && (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-600">
              {discount}% deal saving
            </span>
          )}
        </div>
      </div>

      <div className="text-left sm:text-right">
        <p className="text-sm font-bold text-slate-400">Product price</p>
        <p className="text-base font-black text-slate-900">
          {formatQAR(productPrice)}
        </p>

        {productOldPrice > productPrice && (
          <p className="text-sm font-bold text-slate-400 line-through">
            {formatQAR(productOldPrice)}
          </p>
        )}

        <div className="mt-2 rounded-xl bg-blue-50 px-3 py-2">
          <p className="text-xs font-black text-[#015DF0]">Deal price share</p>
          <p className="text-sm font-black text-[#0D1B3E]">
            {formatQAR(dealPriceShare)}
          </p>
        </div>
      </div>
    </article>
  );
}

function DealDetails() {
  const { slug } = useParams();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    let ignore = false;

    const fetchDeal = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get(`/deals/slug/${slug}`);

        const selectedDeal = data?.deal || data?.data || data;

        if (!ignore) setDeal(selectedDeal);
      } catch (err) {
        if (!ignore) {
          setDeal(null);
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Unable to load deal.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchDeal();

    return () => {
      ignore = true;
    };
  }, [slug]);

  const state = useMemo(() => getDealState(deal || {}), [deal]);

  const products = useMemo(() => {
    return Array.isArray(deal?.products) ? deal.products : [];
  }, [deal]);

  const originalPrice = Number(deal?.originalPrice || 0);
  const dealPrice = Number(deal?.dealPrice || deal?.price || 0);
  const discount = getDiscountPercent(originalPrice, dealPrice);
  const savings = Math.max(0, originalPrice - dealPrice);

  const dealPriceShares = useMemo(() => {
    const totalProductsPrice = products.reduce((sum, item) => {
      const product = getProduct(item);
      const quantity = Number(item?.quantity || 1);
      return sum + Number(product?.price || 0) * quantity;
    }, 0);

    return products.map((item) => {
      const product = getProduct(item);
      const quantity = Number(item?.quantity || 1);
      const productTotal = Number(product?.price || 0) * quantity;

      if (!totalProductsPrice || !dealPrice) return 0;

      return (
        Math.round((productTotal / totalProductsPrice) * dealPrice * 100) / 100
      );
    });
  }, [dealPrice, products]);

  const handleAddToCart = useCallback(() => {
    if (!deal || !state.canBuy) return;

    addToCart(normalizeDealForCart(deal));
  }, [addToCart, deal, state.canBuy]);

  if (loading) return <DealDetailsSkeleton />;

  if (error || !deal) {
    return (
      <MainLayout>
        <main className="min-h-screen bg-[#f6f7fa] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black text-red-600">Deal not found</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {error || "This deal is not available."}
            </p>
            <Link
              to="/deals"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#015DF0] px-5 text-sm font-black text-white"
            >
              Back to deals
            </Link>
          </div>
        </main>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#f6f7fa] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <Link
            to="/deals"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-[#015DF0] hover:text-[#015DF0]"
          >
            <ArrowLeft size={17} />
            Back to Deals
          </Link>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[4/3] bg-slate-100">
                <img
                  src={getDealImage(deal)}
                  alt={deal.title}
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  {discount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1.5 text-xs font-black text-white shadow">
                      <BadgePercent size={14} />
                      {discount}% OFF
                    </span>
                  )}

                  <span
                    className="rounded-full px-3 py-1.5 text-xs font-black shadow"
                    style={{ backgroundColor: YELLOW, color: NAVY }}
                  >
                    {deal.badge || "Deal"}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-black text-white backdrop-blur">
                    <PackageCheck size={16} />
                    {products.length} products included
                  </span>

                  <StatusBadge state={state} />
                </div>
              </div>
            </div>

            <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24 lg:self-start">
              <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#015DF0]">
                <Sparkles size={13} />
                Nexota Bundle
              </p>

              <h1 className="mt-4 text-3xl font-black leading-tight text-[#0D1B3E] sm:text-4xl">
                {deal.title}
              </h1>

              {deal.description && (
                <p className="mt-3 text-sm font-medium leading-6 text-slate-500 sm:text-base">
                  {deal.description}
                </p>
              )}

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-slate-400">
                      Deal Price
                    </p>
                    <p className="mt-1 text-4xl font-black text-[#015DF0]">
                      {formatQAR(dealPrice)}
                    </p>
                  </div>

                  {discount > 0 && (
                    <div className="rounded-2xl bg-red-50 px-4 py-3 text-right">
                      <p className="text-xs font-black text-red-500">Saving</p>
                      <p className="text-lg font-black text-red-600">
                        {formatQAR(savings)}
                      </p>
                    </div>
                  )}
                </div>

                {originalPrice > dealPrice && (
                  <p className="mt-3 text-base font-bold text-slate-400">
                    Original price{" "}
                    <span className="line-through">
                      {formatQAR(originalPrice)}
                    </span>
                  </p>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400">
                    <CalendarClock size={15} />
                    Starts
                  </p>
                  <p className="mt-1 font-black text-slate-800">
                    {formatDate(deal.startsAt)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400">
                    <Clock size={15} />
                    Ends
                  </p>
                  <p className="mt-1 font-black text-slate-800">
                    {formatDate(deal.endsAt)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-600">
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-emerald-500" />
                  Stock available: {deal.stock ?? 0}
                </p>

                <p className="flex items-center gap-2">
                  <ShieldCheck size={17} className="text-[#015DF0]" />
                  Bundle checkout supported
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!state.canBuy}
                className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#015DF0] text-base font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-[#0A4CD6] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
              >
                <ShoppingCart size={20} />
                {state.canBuy ? "Add Deal To Cart" : state.label}
              </button>
            </aside>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#0D1B3E]">
                  Products in this deal
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  See each product original price and its estimated deal value.
                </p>
              </div>

              <p className="text-sm font-black text-slate-500">
                {products.length} item{products.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid gap-4">
              {products.map((item, index) => (
                <IncludedProductCard
                  key={`${getId(getProduct(item))}-${index}`}
                  item={item}
                  dealPriceShare={dealPriceShares[index] || 0}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </MainLayout>
  );
}

export default DealDetails;
