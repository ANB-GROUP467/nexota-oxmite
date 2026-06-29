import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BadgePercent,
  PackageCheck,
  ShoppingCart,
  ArrowRight,
  Zap,
} from "lucide-react";
import api from "../../services/api";
import useCartStore from "../../store/useCartStore";

// ─── Helpers ────────────────────────────────────────────────────────────────

const getId = (item) => item?._id || item?.id || "";

const getImage = (deal) => {
  if (deal?.image) return deal.image;
  const firstProduct = deal?.products?.[0]?.product || deal?.products?.[0];
  if (Array.isArray(firstProduct?.images) && firstProduct.images[0]) {
    return firstProduct.images[0];
  }
  return "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900&auto=format&fit=crop&q=80";
};

const formatQAR = (value) =>
  `QAR ${Number(value || 0).toLocaleString("en-QA", { maximumFractionDigits: 2 })}`;

const getDiscountPercent = (deal) => {
  const orig = Number(deal?.originalPrice || 0);
  const price = Number(deal?.dealPrice || deal?.price || 0);
  if (!orig || !price || price >= orig) return 0;
  return Math.round(((orig - price) / orig) * 100);
};

const normalizeDealForCart = (deal) => {
  const id = getId(deal);
  const price = Number(deal?.dealPrice || deal?.price || 0);
  const oldPrice = Number(deal?.originalPrice || deal?.oldPrice || price);
  return {
    _id: id,
    id,
    deal: id,
    itemType: "deal",
    title: deal?.title || "Deal",
    slug: deal?.slug,
    image: getImage(deal),
    images: [getImage(deal)],
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

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DealCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="aspect-[4/3] animate-pulse bg-slate-100" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-3 w-1/2 animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-4 h-11 w-full animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

// ─── Deal Card ───────────────────────────────────────────────────────────────

function DealCard({ deal, onAddToCart }) {
  const discount = getDiscountPercent(deal);
  const image = getImage(deal);
  const productsCount = Array.isArray(deal.products) ? deal.products.length : 0;
  const outOfStock = Number(deal.stock || 0) <= 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10">
      {/* Image */}
      <Link to={`/deal/${deal.slug || getId(deal)}`} className="block shrink-0">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
          <img
            src={image}
            alt={deal.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
            {discount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-black text-white shadow-lg">
                <BadgePercent size={12} />
                {discount}% OFF
              </span>
            )}
            {deal.badge && (
              <span className="ml-auto rounded-full bg-[#FEEE00] px-2.5 py-1 text-[11px] font-black text-[#0D1B3E]">
                {deal.badge}
              </span>
            )}
          </div>

          {/* Bottom overlay info */}
          <div className="absolute bottom-2.5 left-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/90">
              <PackageCheck size={13} />
              {productsCount} item{productsCount !== 1 ? "s" : ""} included
            </span>
          </div>
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <Link to={`/deal/${deal.slug || getId(deal)}`}>
          <h3 className="line-clamp-2 text-[15px] font-black leading-snug text-slate-900 transition-colors group-hover:text-[#015DF0]">
            {deal.title}
          </h3>
        </Link>

        {/* Pricing */}
        <div className="mt-auto pt-4">
          <div className="flex items-end gap-2">
            <p className="text-xl font-black text-[#015DF0]">
              {formatQAR(deal.dealPrice || deal.price)}
            </p>
            {Number(deal.originalPrice) >
              Number(deal.dealPrice || deal.price) && (
              <p className="mb-0.5 text-sm font-semibold text-slate-400 line-through">
                {formatQAR(deal.originalPrice)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onAddToCart(deal)}
            disabled={outOfStock}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#015DF0] text-sm font-black text-white shadow-md shadow-blue-600/20 transition hover:bg-[#0A4CD6] active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            <ShoppingCart size={16} />
            {outOfStock ? "Out of Stock" : "Add Deal"}
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

function DealsPreview() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const { data } = await api.get("/deals");
        const list = Array.isArray(data)
          ? data
          : data?.deals || data?.data || data?.items || [];
        setDeals(list);
      } catch {
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  const handleAddToCart = useCallback(
    (deal) => addToCart(normalizeDealForCart(deal)),
    [addToCart],
  );

  const visibleDeals = useMemo(
    () =>
      deals
        .filter((d) => d.status !== "inactive" && d.status !== "expired")
        .slice(0, 4),
    [deals],
  );

  if (loading) {
    return (
      <section className="py-10 sm:py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="h-7 w-36 animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-2 h-4 w-56 animate-pulse rounded-lg bg-slate-100" />
          </div>
          <div className="h-9 w-20 animate-pulse rounded-xl bg-slate-100" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <DealCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (visibleDeals.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#015DF0]">
            <Zap size={13} className="fill-[#015DF0]" />
            Limited Offers
          </p>
          <h2 className="text-2xl font-black text-[#0D1B3E] sm:text-3xl">
            Deals
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Bundle offers selected from Nexota products
          </p>
        </div>

        <Link
          to="/deals"
          className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-[#015DF0] transition hover:border-[#015DF0] hover:bg-blue-50 sm:inline-flex"
        >
          View All <ArrowRight size={15} />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visibleDeals.map((deal) => (
          <DealCard
            key={getId(deal)}
            deal={deal}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>

      {/* Mobile CTA */}
      <Link
        to="/deals"
        className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-[#015DF0] sm:hidden"
      >
        View All Deals <ArrowRight size={15} />
      </Link>
    </section>
  );
}

export default DealsPreview;
