import { useState, useEffect } from "react";
import { Star, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { Link } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

const API = "http://localhost:5000/api";

function StarRow({ rating, size = 14 }) {
  const safeRating = Number(rating) || 0;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          style={{ color: safeRating >= n ? "#f59e0b" : "#d1d5db" }}
          fill={safeRating >= n ? "#f59e0b" : "none"}
        />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >
          <Star
            size={24}
            style={{ color: (hovered || value) >= n ? "#f59e0b" : "#d1d5db" }}
            fill={(hovered || value) >= n ? "#f59e0b" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const name = review?.user?.name || "Anonymous";
  const createdAt = review?.createdAt ? new Date(review.createdAt) : null;
  const dateLabel =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleDateString("en-QA", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "";

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-gray-800 truncate">
                {name}
              </span>
              <BadgeCheck size={13} className="text-blue-500 shrink-0" />
            </div>
            {dateLabel && (
              <span className="text-xs text-gray-400">{dateLabel}</span>
            )}
          </div>
        </div>
        <StarRow rating={review?.rating} size={12} />
      </div>
      <p className="mt-3 text-sm text-gray-500 leading-relaxed">
        {review?.comment}
      </p>
    </div>
  );
}

export default function ProductReviews({
  productId,
  rating = 0,
  onReviewAdded,
}) {
  const { user, token } = useAuthStore();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const averageRating = Number(rating) || 0;

  useEffect(() => {
    if (!productId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/reviews/product/${productId}`);
        const reviewList = data?.reviews || data?.data || [];
        setReviews(Array.isArray(reviewList) ? reviewList : []);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!reviewRating) return setError("Please select a rating.");
    if (!reviewComment.trim()) return setError("Please write a comment.");
    if (!productId) return setError("Product not found.");

    try {
      setSubmitting(true);
      const { data } = await axios.post(
        `${API}/reviews`,
        {
          product: productId,
          user: user?._id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (data?.success) {
        const createdReview = data.review || data.data;

        if (createdReview) {
          setReviews((prev) => [
            {
              ...createdReview,
              user: createdReview.user || user,
            },
            ...prev,
          ]);
        }

        setReviewRating(0);
        setReviewComment("");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onReviewAdded?.();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const breakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Number(r.rating) === star).length;
    const pct =
      reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { star, pct };
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
        <div className="text-center shrink-0">
          <div className="text-4xl sm:text-5xl font-black text-gray-900">
            {averageRating.toFixed(1)}
          </div>
          <StarRow rating={averageRating} size={12} />
          <div className="text-xs text-gray-400 mt-1">
            {reviews.length} reviews
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          {breakdown.map(({ star, pct }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-3">{star}</span>
              <Star size={9} fill="#f59e0b" style={{ color: "#f59e0b" }} />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-7 text-right">
                {pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {user ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm space-y-3"
        >
          <h3 className="font-semibold text-sm text-gray-800">
            Write a Review
          </h3>
          <StarPicker value={reviewRating} onChange={setReviewRating} />
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-blue-400 transition-colors"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          {success && (
            <p className="text-xs text-green-600">
              Review submitted successfully!
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-blue-700">
            <Link to="/login" className="font-semibold underline">
              Login
            </Link>{" "}
            to write a review
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-2xl h-24 animate-pulse"
            />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
          No reviews yet. Be the first to review!
        </div>
      )}
    </div>
  );
}
