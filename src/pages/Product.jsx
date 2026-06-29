import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Globe2,
  HardDrive,
  Heart,
  Loader2,
  MemoryStick,
  MessageSquare,
  Minus,
  PackageCheck,
  Palette,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  ShoppingCart,
  Star,
  ThumbsUp,
  Truck,
  UserCircle,
  ZoomIn,
} from "lucide-react";
import toast from "react-hot-toast";

import MainLayout from "../layouts/MainLayout";
import useCartStore from "../store/useCartStore";
import useWishlistStore from "../store/useWishlistStore";
import api from "../services/api";
import { formatQAR, getProductPricing } from "../services/price";
import {
  buildVariantCartItem,
  getDefaultVariant,
  getEntityId,
  getProductVariants,
  getVariantOptions,
  getVariantSelection,
  selectVariantForOption,
} from "../services/productService";

const BRAND_BLUE = "#015DF0";
const BRAND_NAVY = "#0D1B3E";
const BRAND_YELLOW = "#FEEE00";

const getName = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name || value.title || value.slug || "";
};

const readProduct = (payload) =>
  payload?.product ||
  payload?.data?.product ||
  payload?.data ||
  payload ||
  null;

const getStoredToken = () => {
  const direct =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");
  if (direct) return direct;
  try {
    const storage = JSON.parse(localStorage.getItem("auth-storage") || "{}");
    return storage?.state?.token || storage?.token || "";
  } catch {
    return "";
  }
};

const openWishlistLogin = () => {
  window.dispatchEvent(
    new CustomEvent("nexota:auth-required", {
      detail: {
        intent: "wishlist",
        redirectTo: window.location.pathname,
        title: "Login to save products",
        mode: "login",
        startStep: "identifier",
      },
    }),
  );
};

const fetchProduct = async (slug) => {
  const encodedSlug = encodeURIComponent(slug);
  const attempts = [
    () => api.get(`/products/slug/${encodedSlug}`),
    () => api.get(`/products/${encodedSlug}`),
  ];
  let lastError;
  for (const attempt of attempts) {
    try {
      const response = await attempt();
      const product = readProduct(response.data);
      if (product && !Array.isArray(product)) return product;
    } catch (error) {
      lastError = error;
    }
  }
  try {
    const { data } = await api.get(`/products?search=${encodedSlug}&limit=100`);
    const list = data?.products || data?.data || [];
    const exact = Array.isArray(list)
      ? list.find((p) => p.slug === slug || getEntityId(p) === slug)
      : null;
    if (exact) return exact;
  } catch (error) {
    lastError = error;
  }
  throw lastError || new Error("Product not found");
};

/* ─── Option chip group ─────────────────────────────────── */
function OptionGroup({
  label,
  icon: Icon,
  optionKey,
  options,
  selected,
  onSelect,
}) {
  if (!options.length) return null;
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        <Icon size={12} style={{ color: BRAND_BLUE }} />
        {label}
        {selected && (
          <span className="normal-case tracking-normal font-semibold text-slate-600">
            · {selected}
          </span>
        )}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(optionKey, option.value)}
              aria-pressed={active}
              className={`inline-flex h-9 min-w-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-1 ${
                active
                  ? "border-[#015DF0] bg-[#015DF0] text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#015DF0] hover:text-[#015DF0]"
              }`}
            >
              {optionKey === "color" && (
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: option.hex || "#E2E8F0" }}
                />
              )}
              <span className="truncate">{option.label}</span>
              {active && <Check size={12} className="shrink-0 opacity-80" />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ─── Star picker ───────────────────────────────────────── */
function StarPicker({ value, onChange, size = 24 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`Rate ${i} out of 5`}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            size={size}
            fill={(hovered || value) >= i ? "#F59E0B" : "none"}
            className={
              (hovered || value) >= i ? "text-amber-400" : "text-slate-300"
            }
          />
        </button>
      ))}
    </div>
  );
}

/* ─── Reviews section ───────────────────────────────────── */
function ReviewsSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [breakdown, setBreakdown] = useState({});
  const [filterStar, setFilterStar] = useState(0);
  const [sortBy, setSortBy] = useState("recent");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [helpfulMap, setHelpfulMap] = useState({});

  const isLoggedIn = !!getStoredToken();
  const LIMIT = 5;

  const fetchReviews = useCallback(
    async (p = 1, star = filterStar, sort = sortBy) => {
      if (!productId) return;

      try {
        setReviewsLoading(true);
        setReviewsError("");

        const params = new URLSearchParams({
          page: p,
          limit: LIMIT,
          ...(star ? { rating: star } : {}),
          sort,
        });

        const { data } = await api.get(
          `/products/${productId}/reviews?${params}`,
        );

        const list = (() => {
          if (Array.isArray(data)) return data;
          if (Array.isArray(data?.reviews)) return data.reviews;
          if (Array.isArray(data?.data?.reviews)) return data.data.reviews;
          if (Array.isArray(data?.data)) return data.data;
          return [];
        })();

        const total =
          data?.total ??
          data?.totalCount ??
          data?.pagination?.total ??
          data?.data?.total ??
          list.length;

        const pages =
          data?.totalPages ??
          data?.pagination?.totalPages ??
          data?.data?.totalPages ??
          Math.ceil(total / LIMIT) ??
          1;
        const avg =
          data?.averageRating ??
          data?.avgRating ??
          data?.data?.averageRating ??
          (list.length
            ? list.reduce((sum, review) => sum + (review.rating || 0), 0) /
              list.length
            : 0);
        const bd =
          data?.ratingBreakdown ??
          data?.breakdown ??
          data?.data?.ratingBreakdown ??
          {};

        setReviews(list);
        setTotalCount(Number(total) || 0);
        setTotalPages(Number(pages) || 1);
        setAvgRating(Number(avg) || 0);
        setBreakdown(bd);
        setPage(p);
      } catch {
        setReviewsError("Could not load reviews. Please try again.");
      } finally {
        setReviewsLoading(false);
      }
    },
    [filterStar, productId, sortBy],
  );

  useEffect(() => {
    fetchReviews(1, filterStar, sortBy);
  }, [fetchReviews, filterStar, sortBy]);

  const applyFilter = (star) => {
    setFilterStar(star);
  };

  const applySort = (sort) => {
    setSortBy(sort);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setSubmitError("Please select a star rating.");
      return;
    }
    if (!comment.trim()) {
      setSubmitError("Please write your review.");
      return;
    }
    try {
      setSubmitting(true);
      setSubmitError("");
      await api.post(`/products/${productId}/reviews`, {
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      setSubmitSuccess(true);
      setRating(0);
      setTitle("");
      setComment("");
      fetchReviews(1, filterStar, sortBy);
      toast.success("Review submitted — thank you!");
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Failed to submit. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!isLoggedIn) {
      openWishlistLogin();
      return;
    }
    if (helpfulMap[reviewId]) return;
    try {
      await api.post(`/reviews/${reviewId}/helpful`);
      setHelpfulMap((m) => ({ ...m, [reviewId]: true }));
      setReviews((rs) =>
        rs.map((r) =>
          (r._id || r.id) === reviewId
            ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 }
            : r,
        ),
      );
    } catch {
      /* silent */
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };
  const getReviewerName = (r) =>
    r?.user?.name ||
    r?.user?.firstName ||
    r?.userName ||
    r?.name ||
    "Anonymous";
  const getInitial = (r) => (getReviewerName(r)?.[0] || "A").toUpperCase();
  const barColor = (star) => {
    if (star >= 4) return BRAND_BLUE;
    if (star === 3) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div id="reviews-tab" className="mt-2">
      {/* Rating summary */}
      <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start lg:gap-10">
          {/* Big rating number */}
          <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-[#0D1B3E] px-8 py-6 text-center text-white">
            <span className="text-5xl font-black leading-none">
              {avgRating > 0 ? avgRating.toFixed(1) : "—"}
            </span>
            <div className="mt-2 flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i <= Math.round(avgRating) ? BRAND_YELLOW : "none"}
                  className={
                    i <= Math.round(avgRating)
                      ? "text-yellow-300"
                      : "text-white/20"
                  }
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs font-medium text-white/50">
              {totalCount > 0
                ? `${totalCount.toLocaleString()} review${totalCount !== 1 ? "s" : ""}`
                : "No reviews yet"}
            </p>
          </div>

          {/* Breakdown bars */}
          <div className="flex-1 space-y-2 self-center">
            {[5, 4, 3, 2, 1].map((star) => {
              const cnt = breakdown[star] || 0;
              const pct = totalCount > 0 ? (cnt / totalCount) * 100 : 0;
              const active = filterStar === star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => applyFilter(active ? 0 : star)}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-1 text-xs transition hover:bg-slate-50 ${active ? "bg-blue-50 ring-1 ring-blue-200" : ""}`}
                >
                  <span className="flex w-12 shrink-0 items-center justify-end gap-1 font-semibold text-slate-600">
                    {star}{" "}
                    <Star size={11} fill="#F59E0B" className="text-amber-400" />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: barColor(star),
                      }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right font-semibold text-slate-400">
                    {Math.round(pct)}%
                  </span>
                  <span className="w-8 shrink-0 text-right font-medium text-slate-300">
                    ({cnt})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter + sort bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Filter:</span>
          {[0, 5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => applyFilter(s)}
              className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-bold transition ${filterStar === s ? "text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
              style={filterStar === s ? { backgroundColor: BRAND_BLUE } : {}}
            >
              {s === 0 ? (
                "All"
              ) : (
                <>
                  {s} <Star size={10} fill="currentColor" />
                </>
              )}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => applySort(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 focus:border-[#015DF0] focus:outline-none"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>

      {/* Review list */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-50">
          {reviewsLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 px-5 py-5 sm:px-6">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))
          ) : reviewsError ? (
            <div className="flex flex-col items-center py-12 text-center">
              <MessageSquare size={36} className="text-slate-200" />
              <p className="mt-3 text-sm font-semibold text-slate-500">
                {reviewsError}
              </p>
              <button
                onClick={() => fetchReviews(1)}
                className="mt-3 rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300"
              >
                Try again
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <MessageSquare size={36} className="text-slate-200" />
              <p className="mt-3 text-sm font-semibold text-slate-500">
                No reviews yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {filterStar
                  ? `No ${filterStar}★ reviews. Try a different filter.`
                  : "Be the first to share your experience."}
              </p>
            </div>
          ) : (
            reviews.map((review, idx) => {
              const rid = review._id || review.id || idx;
              const alreadyHelpful = helpfulMap[rid];
              return (
                <div key={rid} className="px-5 py-5 sm:px-6">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                      style={{ backgroundColor: BRAND_NAVY }}
                    >
                      {getInitial(review)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                        <span className="text-sm font-bold text-slate-800">
                          {getReviewerName(review)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(review.createdAt || review.date)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              size={13}
                              fill={
                                i <= (review.rating || 0) ? "#F59E0B" : "none"
                              }
                              className={
                                i <= (review.rating || 0)
                                  ? "text-amber-400"
                                  : "text-slate-200"
                              }
                            />
                          ))}
                          <span className="ml-1 text-xs font-bold text-slate-600">
                            {review.rating}/5
                          </span>
                        </div>
                        {(review.verified || review.verifiedPurchase) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                            <Check size={9} /> Verified Purchase
                          </span>
                        )}
                      </div>
                      {(review.variant || review.color || review.storage) && (
                        <p className="mt-1.5 text-[11px] text-slate-400">
                          {[review.color, review.storage, review.variant]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      {(review.title || review.heading) && (
                        <p className="mt-2 text-sm font-bold text-slate-800">
                          {review.title || review.heading}
                        </p>
                      )}
                      <p className="mt-1.5 text-sm leading-6 text-slate-600">
                        {review.comment || review.body || review.text || ""}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => handleHelpful(rid)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${alreadyHelpful ? "border-blue-200 bg-blue-50 text-[#015DF0]" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                        >
                          <ThumbsUp size={11} />
                          Helpful
                          {(review.helpfulCount || 0) > 0 && (
                            <span className="font-bold">
                              ({review.helpfulCount})
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !reviewsLoading && (
          <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 px-5 py-4">
            <button
              onClick={() => fetchReviews(page - 1)}
              disabled={page <= 1}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 disabled:opacity-30"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const mid = Math.min(Math.max(page, 4), totalPages - 3);
              const p =
                totalPages <= 7
                  ? i + 1
                  : i < 3
                    ? i + 1
                    : i >= 4
                      ? totalPages - (6 - i)
                      : mid + (i - 3);
              return (
                <button
                  key={p}
                  onClick={() => fetchReviews(p)}
                  className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold transition ${p === page ? "text-white" : "border border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  style={p === page ? { backgroundColor: BRAND_BLUE } : {}}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => fetchReviews(page + 1)}
              disabled={page >= totalPages}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 disabled:opacity-30"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Write a review */}
        <div className="border-t border-slate-100 p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-sm font-black text-slate-950 sm:text-base">
            <Send size={15} style={{ color: BRAND_BLUE }} />
            {isLoggedIn ? "Write a Review" : "Share Your Experience"}
          </h3>
          {!isLoggedIn ? (
            <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <UserCircle size={20} className="shrink-0 text-slate-300" />
                <span className="text-sm text-slate-600">
                  Sign in to leave a review for this product.
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("nexota:auth-required", {
                      detail: {
                        intent: "review",
                        redirectTo: window.location.pathname,
                        mode: "login",
                        startStep: "identifier",
                      },
                    }),
                  )
                }
                className="shrink-0 rounded-xl px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                Sign in
              </button>
            </div>
          ) : submitSuccess ? (
            <div className="mt-4 rounded-xl bg-emerald-50 p-5 text-center">
              <p className="text-sm font-bold text-emerald-700">
                ✓ Review submitted — thank you!
              </p>
              <button
                type="button"
                onClick={() => setSubmitSuccess(false)}
                className="mt-2 text-xs font-semibold text-emerald-600 underline underline-offset-2"
              >
                Write another review
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Your Rating <span className="text-red-400">*</span>
                </label>
                <StarPicker value={rating} onChange={setRating} size={30} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Review Title{" "}
                  <span className="ml-1 normal-case font-medium text-slate-300">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarise your experience in one line"
                  maxLength={100}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 transition focus:border-[#015DF0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Your Review <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike? How was the quality and build?"
                  rows={4}
                  maxLength={1000}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 placeholder-slate-300 transition focus:border-[#015DF0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-right text-[11px] text-slate-300">
                  {comment.length}/1000
                </p>
              </div>
              {submitError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────── */
function ProductSkeleton() {
  return (
    <MainLayout>
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10">
        <div className="mb-6 h-4 w-24 animate-pulse rounded-full bg-slate-200" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)] lg:gap-8">
          <div className="space-y-3">
            <div className="aspect-square w-full animate-pulse rounded-2xl bg-slate-100" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 w-16 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="h-9 w-3/4 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
            <div className="h-12 w-48 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-32 w-full animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-14 w-full animate-pulse rounded-xl bg-slate-200" />
          </div>
        </div>
      </main>
    </MainLayout>
  );
}

/* ─── Tab system ─────────────────────────────────────────── */
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "specs", label: "Specifications" },
  { id: "reviews", label: "Reviews" },
];

/* ─── Main component ─────────────────────────────────────── */
function Product() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const addToCart = useCartStore((s) => s.addToCart || s.addItem || s.addCart);
  const wishlist = useWishlistStore((s) => s.wishlist || s.items || []);
  const addWishlist = useWishlistStore((s) => s.addWishlist || s.addItem);
  const removeWishlist = useWishlistStore(
    (s) => s.removeWishlist || s.removeFromWishlist || s.removeItem,
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const next = await fetchProduct(slug);
        if (!mounted) return;
        const vs = getProductVariants(next);
        setProduct(next);
        setSelectedVariant(getDefaultVariant(next, vs));
        setActiveImage(0);
        setQuantity(1);
      } catch (err) {
        if (!mounted) return;
        setProduct(null);
        setError(err.response?.data?.message || "Product not found.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const variants = useMemo(() => getProductVariants(product), [product]);
  const optionGroups = useMemo(() => getVariantOptions(variants), [variants]);
  const selection = useMemo(
    () => getVariantSelection(selectedVariant),
    [selectedVariant],
  );

  const images = useMemo(() => {
    const src = selectedVariant?.images?.length
      ? selectedVariant.images
      : product?.images || [];
    return src.length ? src : ["/placeholder.png"];
  }, [product, selectedVariant]);

  const pricing = useMemo(
    () => getProductPricing(selectedVariant || product || {}),
    [product, selectedVariant],
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen]);
  const selectedVariantId = selectedVariant
    ? getEntityId(selectedVariant)
    : null;

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
  }, [selectedVariantId]);

  const specGroups = useMemo(() => {
    const grouped = {};

    (product?.specifications || []).forEach((s) => {
      const group = s.group || "General";
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(s);
    });

    return grouped;
  }, [product]);
  if (loading) return <ProductSkeleton />;

  if (!product) {
    return (
      <MainLayout>
        <main className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
            <PackageCheck size={34} className="text-slate-300" />
          </div>
          <h1 className="mt-5 text-xl font-black text-slate-950 sm:text-2xl">
            Product not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <Link
            to="/products"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-md"
            style={{ backgroundColor: BRAND_BLUE }}
          >
            <ChevronLeft size={15} /> Browse products
          </Link>
        </main>
      </MainLayout>
    );
  }

  const productId = getEntityId(product);
  const selectedStock = Number(selectedVariant?.stock ?? product.stock ?? 0);
  const hasStockField =
    selectedVariant?.stock !== undefined || product.stock !== undefined;
  const inStock = hasStockField ? selectedStock > 0 : true;
  const isWishlisted = wishlist.some((item) => {
    const ip =
      item?.product && typeof item.product === "object" ? item.product : item;
    return getEntityId(ip) === productId || String(item?.product) === productId;
  });

  const handleOptionSelect = (key, value) => {
    setSelectedVariant(
      selectVariantForOption({
        variants,
        currentVariant: selectedVariant,
        key,
        value,
      }),
    );
  };

  const handleAddToCart = () => {
    if (!inStock) return;
    const item = buildVariantCartItem(product, selectedVariant, quantity);
    addToCart?.(item, quantity);
    toast.success(
      selectedVariant
        ? `${selectedVariant.storage || selectedVariant.sku} added to cart`
        : "Added to cart",
    );
  };

  const handleWishlist = async () => {
    if (!getStoredToken()) {
      openWishlistLogin();
      return;
    }
    try {
      if (isWishlisted) {
        await removeWishlist?.(productId);
        toast.success("Removed from wishlist");
      } else {
        await addWishlist?.(product);
        window.dispatchEvent(
          new CustomEvent("nexota:wishlist-added", {
            detail: { product, listName: "default list" },
          }),
        );
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Wishlist error");
    }
  };

  const specifications = [
    selectedVariant?.version && ["Version", selectedVariant.version],
    selectedVariant?.color?.name && ["Color", selectedVariant.color.name],
    selectedVariant?.storage && ["Storage", selectedVariant.storage],
    selectedVariant?.ram && ["RAM", selectedVariant.ram],
    selectedVariant?.sku && ["SKU", selectedVariant.sku],
    ...(Array.isArray(product.specifications)
      ? product.specifications.map((s) => [s.name, s.value])
      : []),
  ].filter(Boolean);

  const variantSpecs = [
    selectedVariant?.version && ["Version", selectedVariant.version],
    selectedVariant?.color?.name && ["Color", selectedVariant.color.name],
    selectedVariant?.storage && ["Storage", selectedVariant.storage],
    selectedVariant?.ram && ["RAM", selectedVariant.ram],
    selectedVariant?.sku && ["SKU", selectedVariant.sku],
  ].filter(Boolean);

  const prevImage = () =>
    setActiveImage((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setActiveImage((i) => (i + 1) % images.length);

  const scrollToTab = (tab) => {
    setActiveTab(tab);
    document
      .getElementById("product-tabs")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <MainLayout>
      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={images[activeImage]}
            alt={product.title}
            className="max-h-[90vh] max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 text-lg font-bold"
          >
            ✕
          </button>
          {/* Lightbox thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage(i);
                  }}
                  className={`h-12 w-12 overflow-hidden rounded-lg border-2 transition-all ${activeImage === i ? "border-white" : "border-white/30 opacity-60"}`}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <main className="mx-auto w-full max-w-[1400px] px-4 pb-32 pt-4 sm:px-6 sm:pb-10 sm:pt-5 lg:px-10">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 overflow-hidden text-xs font-medium text-slate-400">
          <Link
            to="/products"
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 transition hover:bg-slate-100 hover:text-[#015DF0]"
          >
            <ChevronLeft size={13} /> Products
          </Link>
          <span className="text-slate-300">/</span>
          {product.category && (
            <>
              <span className="text-slate-500">
                {getName(product.category)}
              </span>
              <span className="text-slate-300">/</span>
            </>
          )}
          <span className="truncate text-slate-700 font-semibold">
            {product.title}
          </span>
        </nav>

        {/* ══ Two-column layout ══ */}
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:gap-8">
          {/* ════ LEFT — sticky image gallery ════ */}
          <div className="lg:sticky lg:top-20 min-w-0">
            {/* Main image container */}
            <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm">
              {/* Discount badge */}
              {pricing.hasDiscount && (
                <div
                  className="absolute left-3 top-3 z-10 rounded-md px-2.5 py-1 text-xs font-black text-white"
                  style={{ backgroundColor: "#EF4444" }}
                >
                  -{pricing.discountPercent}%
                </div>
              )}

              {/* Image */}
              <div
                className="cursor-zoom-in bg-white"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={images[activeImage] || images[0]}
                  alt={product.title}
                  className="w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  style={{ aspectRatio: "1 / 1", maxHeight: "520px" }}
                />
              </div>

              {/* Zoom hint */}
              <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                <ZoomIn size={11} /> Zoom
              </div>

              {/* Mobile swipe arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40 sm:hidden"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40 sm:hidden"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            {/* Dot indicators — mobile */}
            {images.length > 1 && (
              <div className="mt-3 flex justify-center gap-1.5 sm:hidden">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`h-1.5 rounded-full transition-all ${activeImage === i ? "w-5 bg-[#015DF0]" : "w-1.5 bg-slate-300"}`}
                  />
                ))}
              </div>
            )}

            {/* Thumbnail strip — desktop */}
            {images.length > 1 && (
              <div className="mt-3 hidden gap-2 sm:flex flex-wrap">
                {images.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all duration-150 md:h-[72px] md:w-[72px] ${activeImage === i ? "border-[#015DF0] shadow-md shadow-blue-100" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <img
                      src={img}
                      alt={`View ${i + 1}`}
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Trust strip — desktop only under gallery */}
            <div className="mt-4 hidden lg:grid grid-cols-3 gap-2">
              {[
                [Truck, "Free delivery", "Orders over QAR 100"],
                [ShieldCheck, "Secure checkout", "SSL protected"],
                [RotateCcw, "Easy returns", "30-day policy"],
              ].map(([Icon, title, sub]) => (
                <div
                  key={title}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-2 py-3 text-center shadow-sm"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: "#EFF4FF" }}
                  >
                    <Icon size={14} style={{ color: BRAND_BLUE }} />
                  </div>
                  <span className="text-[10px] font-bold leading-tight text-slate-800">
                    {title}
                  </span>
                  <span className="text-[9px] font-medium text-slate-400">
                    {sub}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ════ RIGHT — product info ════ */}
          <div className="min-w-0 space-y-3">
            {/* ── Brand + wishlist ── */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-black uppercase tracking-widest"
                  style={{ color: BRAND_BLUE }}
                >
                  {getName(product.brand) || getName(product.category)}
                </span>
                {product.bestSeller && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                    style={{ backgroundColor: BRAND_NAVY }}
                  >
                    Best Seller
                  </span>
                )}
              </div>
            </div>

            {/* ── Title ── */}
            <h1 className="text-xl font-black leading-tight text-slate-950 sm:text-2xl lg:text-[1.65rem]">
              {product.title}
            </h1>

            {/* ── Rating row ── */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={
                      i <= Math.round(product.rating || 0) ? "#F59E0B" : "none"
                    }
                    className={
                      i <= Math.round(product.rating || 0)
                        ? "text-amber-400"
                        : "text-slate-200"
                    }
                  />
                ))}
                <span className="ml-1 text-sm font-bold text-slate-700">
                  {Number(product.rating || 0).toFixed(1)}
                </span>
              </div>
              <button
                onClick={() => scrollToTab("reviews")}
                className="text-xs font-semibold text-[#015DF0] hover:underline underline-offset-2"
              >
                {Number(product.reviewsCount || 0).toLocaleString()} reviews
              </button>
              {selectedVariant?.sku && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
                  SKU: {selectedVariant.sku}
                </span>
              )}
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-slate-100" />

            {/* ── Price block ── */}
            <div>
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <span
                  className="text-3xl font-black tracking-tight sm:text-4xl"
                  style={{ color: BRAND_BLUE }}
                >
                  {formatQAR(pricing.finalPrice)}
                </span>
                {pricing.hasDiscount && (
                  <>
                    <span className="mb-1 text-base font-medium text-slate-400 line-through">
                      {formatQAR(pricing.originalPrice)}
                    </span>
                    <span className="mb-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-black text-red-600">
                      Save{" "}
                      {formatQAR(pricing.originalPrice - pricing.finalPrice)}
                    </span>
                  </>
                )}
              </div>
              {pricing.hasDiscount && (
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Inclusive of VAT
                </p>
              )}
            </div>

            {/* ── Stock ── */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${inStock ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-emerald-500" : "bg-red-500"}`}
                />
                {inStock ? `${selectedStock} in stock` : "Out of stock"}
              </span>
              {inStock && selectedStock <= 10 && selectedStock > 0 && (
                <span className="text-xs font-bold text-amber-600 animate-pulse">
                  Only {selectedStock} left!
                </span>
              )}
            </div>

            {/* ── Variants ── */}
            {variants.length > 0 && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-4">
                <OptionGroup
                  label="Version"
                  icon={Globe2}
                  optionKey="version"
                  options={optionGroups.version}
                  selected={selection.version}
                  onSelect={handleOptionSelect}
                />
                <OptionGroup
                  label="Color"
                  icon={Palette}
                  optionKey="color"
                  options={optionGroups.color}
                  selected={selection.color}
                  onSelect={handleOptionSelect}
                />
                <OptionGroup
                  label="Storage"
                  icon={HardDrive}
                  optionKey="storage"
                  options={optionGroups.storage}
                  selected={selection.storage}
                  onSelect={handleOptionSelect}
                />
                <OptionGroup
                  label="RAM"
                  icon={MemoryStick}
                  optionKey="ram"
                  options={optionGroups.ram}
                  selected={selection.ram}
                  onSelect={handleOptionSelect}
                />
              </div>
            )}

            {/* ── Qty + Add to cart (desktop) ── */}
            <div className="hidden flex-col gap-3 sm:flex">
              {/* Qty stepper */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Qty
                </span>
                <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((v) => Math.max(v - 1, 1))}
                    aria-label="Decrease quantity"
                    className="grid h-full w-11 place-items-center text-slate-500 transition hover:text-slate-800 hover:bg-slate-50 rounded-l-xl"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-10 text-center text-sm font-black text-slate-950">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((v) =>
                        Math.min(v + 1, hasStockField ? selectedStock : v + 1),
                      )
                    }
                    disabled={hasStockField && quantity >= selectedStock}
                    aria-label="Increase quantity"
                    className="grid h-full w-11 place-items-center text-slate-500 transition hover:text-slate-800 hover:bg-slate-50 rounded-r-xl disabled:opacity-30"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                {quantity > 1 && (
                  <span className="text-xs font-semibold text-slate-400">
                    Total:{" "}
                    <span className="font-black text-slate-700">
                      {formatQAR(pricing.finalPrice * quantity)}
                    </span>
                  </span>
                )}
              </div>

              {/* Add to cart — Noon-style yellow CTA */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock}
                className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-black shadow-sm transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: inStock ? BRAND_YELLOW : "#E2E8F0",
                  color: inStock ? BRAND_NAVY : "#94A3B8",
                }}
              >
                <ShoppingCart size={18} />
                {inStock ? "Add to Cart" : "Out of Stock"}
              </button>
            </div>

            {/* ── Trust badges — mobile (3 col) ── */}
            <div className="grid grid-cols-3 gap-2 lg:hidden">
              {[
                [Truck, "Fast delivery"],
                [ShieldCheck, "Secure checkout"],
                [RotateCcw, "Easy returns"],
              ].map(([Icon, title]) => (
                <div
                  key={title}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-2 py-3 text-center shadow-sm"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: "#EFF4FF" }}
                  >
                    <Icon size={14} style={{ color: BRAND_BLUE }} />
                  </div>
                  <span className="text-[10px] font-bold leading-tight text-slate-700">
                    {title}
                  </span>
                </div>
              ))}
            </div>

            {/* ── Delivery info strip ── */}
            <div className="rounded-xl border border-slate-100 bg-white divide-y divide-slate-50 shadow-sm">
              <div className="flex items-start gap-3 px-4 py-3">
                <Truck size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800">
                    Free Delivery
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    Get it by Tomorrow if ordered within 2 hours
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <RotateCcw
                  size={16}
                  className="mt-0.5 shrink-0 text-[#015DF0]"
                />
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800">
                    30-Day Returns
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    Change of mind accepted
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <ShieldCheck
                  size={16}
                  className="mt-0.5 shrink-0 text-amber-500"
                />
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800">
                    Genuine Product
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    100% authentic, verified seller
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ Tabs section (Noon-style) ══ */}
        <div id="product-tabs" className="mt-8 scroll-mt-24">
          {/* Tab bar */}
          <div className="sticky top-16 z-30 -mx-4 bg-white border-b border-slate-200 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
            <div className="flex gap-0 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative shrink-0 px-5 py-4 text-sm font-bold transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-[#0D1B3E]"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ backgroundColor: BRAND_BLUE }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="mt-6">
            {/* ── Overview tab ── */}
            {activeTab === "overview" && (
              <div className="grid gap-5 lg:grid-cols-2">
                {/* Description */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-base font-black text-slate-950 sm:text-lg">
                    About this product
                  </h2>
                  <p className="mt-3 whitespace-pre-line text-sm font-medium leading-7 text-slate-600">
                    {product.description || "No description available."}
                  </p>
                </div>

                {/* Quick specs */}
                {variantSpecs.length > 0 && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-base font-black text-slate-950 sm:text-lg">
                      Selected Variant
                    </h2>
                    <dl className="mt-4 divide-y divide-slate-50">
                      {variantSpecs.map(([name, value], idx) => (
                        <div
                          key={idx}
                          className="flex items-baseline justify-between gap-4 py-2.5 text-sm"
                        >
                          <dt className="shrink-0 font-medium text-slate-400">
                            {name}
                          </dt>
                          <dd className="min-w-0 break-words text-right font-bold text-slate-800">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            )}

            {/* ── Specs tab ── */}
            {activeTab === "specs" && (
              <div className="max-w-3xl">
                {specifications.length > 0 ? (
                  <div className="space-y-4">
                    {/* Variant specs first */}
                    {variantSpecs.length > 0 && (
                      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                        <div
                          className="border-b border-slate-50 px-5 py-3"
                          style={{ backgroundColor: "#F8FAFF" }}
                        >
                          <h3
                            className="text-xs font-black uppercase tracking-widest"
                            style={{ color: BRAND_BLUE }}
                          >
                            Selected Variant
                          </h3>
                        </div>
                        <dl className="divide-y divide-slate-50 px-5">
                          {variantSpecs.map(([name, value], idx) => (
                            <div
                              key={idx}
                              className="flex items-baseline justify-between gap-4 py-3 text-sm"
                            >
                              <dt className="shrink-0 font-medium text-slate-400">
                                {name}
                              </dt>
                              <dd className="min-w-0 break-words text-right font-bold text-slate-800">
                                {value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}

                    {/* Grouped product specs */}
                    {Object.entries(specGroups).map(([group, specs]) => (
                      <div
                        key={group}
                        className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden"
                      >
                        <div
                          className="border-b border-slate-50 px-5 py-3"
                          style={{ backgroundColor: "#F8FAFF" }}
                        >
                          <h3
                            className="text-xs font-black uppercase tracking-widest"
                            style={{ color: BRAND_NAVY }}
                          >
                            {group}
                          </h3>
                        </div>
                        <dl className="divide-y divide-slate-50 px-5">
                          {specs.map((spec, idx) => (
                            <div
                              key={idx}
                              className="flex items-baseline justify-between gap-4 py-3 text-sm"
                            >
                              <dt className="shrink-0 font-medium text-slate-400">
                                {spec.name}
                              </dt>
                              <dd className="min-w-0 break-words text-right font-bold text-slate-800">
                                {spec.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
                    <p className="text-sm font-semibold text-slate-400">
                      No specifications available yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Reviews tab ── */}
            {activeTab === "reviews" && (
              <ReviewsSection productId={productId} />
            )}
          </div>
        </div>
      </main>

      {/* ══ Sticky mobile CTA bar ══ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/98 px-4 py-3 backdrop-blur-md sm:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2.5">
          {/* Qty stepper */}
          <div className="flex h-12 shrink-0 items-center rounded-xl border border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => setQuantity((v) => Math.max(v - 1, 1))}
              aria-label="Decrease quantity"
              className="grid h-full w-11 place-items-center text-slate-500 transition active:bg-slate-100 rounded-l-xl"
            >
              <Minus size={15} />
            </button>
            <span className="w-9 text-center text-sm font-black text-slate-950">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                setQuantity((v) =>
                  Math.min(v + 1, hasStockField ? selectedStock : v + 1),
                )
              }
              disabled={hasStockField && quantity >= selectedStock}
              aria-label="Increase quantity"
              className="grid h-full w-11 place-items-center text-slate-500 transition active:bg-slate-100 disabled:opacity-30 rounded-r-xl"
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Wishlist icon button */}
          <button
            type="button"
            onClick={handleWishlist}
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition ${isWishlisted ? "border-yellow-300 bg-yellow-50" : "border-slate-200 bg-white"}`}
          >
            <Heart
              size={17}
              fill={isWishlisted ? BRAND_YELLOW : "none"}
              style={{ color: isWishlisted ? BRAND_NAVY : "#94A3B8" }}
            />
          </button>

          {/* Add to cart CTA */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-black shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: inStock ? BRAND_YELLOW : "#E2E8F0",
              color: inStock ? BRAND_NAVY : "#94A3B8",
            }}
          >
            <ShoppingCart size={16} />
            {inStock
              ? `Add to Cart · ${formatQAR(pricing.finalPrice * quantity)}`
              : "Out of stock"}
          </button>
        </div>
      </div>
    </MainLayout>
  );
}

export default Product;
