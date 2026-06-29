import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2, PackageSearch } from "lucide-react";
import api from "../../services/api";

const BRAND_BLUE = "#015DF0";
const BRAND_NAVY = "#0D1B3E";

const TRENDING = [
  "iPhone 15",
  "MacBook Air",
  "Sony WH-1000XM5",
  "Samsung Galaxy",
  "PS5",
];

function SearchDropdown({ query, onClose }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query?.trim()) {
      setProducts([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      api
        .get(`/products?search=${encodeURIComponent(query)}`)
        .then(({ data }) => setProducts(data.products || []))
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Show trending when no query
  if (!query?.trim()) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">
            Trending Searches
          </p>
          <div className="flex flex-wrap gap-2 pb-2">
            {TRENDING.map((term) => (
              <button
                key={term}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200
                  text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50
                  transition-all duration-150"
                onClick={() => {}}
              >
                <Search size={10} />
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm font-medium">Searching...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <PackageSearch size={32} className="mb-2 opacity-40" />
          <p className="text-sm font-semibold">No results for "{query}"</p>
          <p className="text-xs mt-1 text-slate-400">
            Try a different search term
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && products.length > 0 && (
        <>
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Results ({products.length})
            </p>
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50">
            {products.map((product) => (
              <Link
                key={product._id}
                to={`/product/${product.slug}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors duration-150 group"
              >
                {/* Image */}
                <div className="w-14 h-14 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden shrink-0">
                  <img
                    src={product.images?.[0] || "/placeholder.png"}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-slate-900">
                    {product.title}
                  </h4>
                  {product.category && (
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {product.category}
                    </p>
                  )}
                  <p
                    className="text-sm font-extrabold mt-1"
                    style={{ color: BRAND_BLUE }}
                  >
                    QAR {product.price?.toLocaleString()}
                  </p>
                </div>

                {/* Arrow */}
                <svg
                  className="shrink-0 text-slate-300 group-hover:text-slate-500 transition-colors"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-3">
            <Link
              to={`/products?search=${encodeURIComponent(query)}`}
              onClick={onClose}
              className="flex items-center justify-center gap-2 text-sm font-bold transition hover:underline"
              style={{ color: BRAND_BLUE }}
            >
              <Search size={14} />
              See all results for "{query}"
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default SearchDropdown;
