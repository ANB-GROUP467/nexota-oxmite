import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";

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

const getProductTitle = (product) => product?.title || product?.name || "";
const getProductImage = (product) =>
  product?.image || product?.thumbnail || product?.images?.[0] || "";

function highlightText(text, query) {
  const value = String(text || "");
  const cleanQuery = String(query || "").trim();

  if (!cleanQuery) return value;

  const index = value.toLowerCase().indexOf(cleanQuery.toLowerCase());
  if (index < 0) return value;

  return (
    <>
      {value.slice(0, index)}
      <span style={{ color: BRAND_BLUE }}>
        {value.slice(index, index + cleanQuery.length)}
      </span>
      {value.slice(index + cleanQuery.length)}
    </>
  );
}

async function fetchSearchSuggestions(query) {
  const encoded = encodeURIComponent(query);
  const endpoints = [
    `/products?search=${encoded}&limit=8`,
    `/products?keyword=${encoded}&limit=8`,
    `/products?query=${encoded}&limit=8`,
    `/products?limit=8`,
  ];

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint);
      const list = normalizeList(data);
      if (list.length) return list;
    } catch {
      // Try the next backend query shape.
    }
  }

  return [];
}

function AppSearchBar({
  variant = "header",
  placeholder = "Search products, brands and more...",
  initialValue,
  onQueryChange,
  onSearch,
  onClear,
  autoFocus = false,
  className = "",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const urlQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("q") || params.get("query") || params.get("search") || "";
  }, [location.search]);

  const [query, setQuery] = useState(initialValue ?? urlQuery);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nexota_search") || "[]");
    } catch {
      return [];
    }
  });

  const isPage = variant === "page";
  const isCompact = variant === "compact" || variant === "drawer";

  useEffect(() => {
    if (initialValue !== undefined) {
      setQuery(initialValue);
      return;
    }

    if (location.pathname === "/search") setQuery(urlQuery);
  }, [initialValue, location.pathname, urlQuery]);

  useEffect(() => {
    if (!autoFocus) return;
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [autoFocus]);

  useEffect(() => {
    const cleanQuery = query.trim();

    window.clearTimeout(debounceRef.current);

    if (!cleanQuery) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        const list = await fetchSearchSuggestions(cleanQuery);
        setSuggestions(
          list
            .map((product) => ({
              id: getId(product) || product.slug || getProductTitle(product),
              label: getProductTitle(product),
              slug: product.slug,
              image: getProductImage(product),
            }))
            .filter((item) => item.label)
            .slice(0, 8),
        );
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const commitSearch = (term = query, slug) => {
    const cleanTerm = String(term || "").trim();
    if (!cleanTerm) return;

    const nextHistory = [
      cleanTerm,
      ...history.filter(
        (item) => item.toLowerCase() !== cleanTerm.toLowerCase(),
      ),
    ].slice(0, 8);

    setHistory(nextHistory);
    localStorage.setItem("nexota_search", JSON.stringify(nextHistory));
    setFocused(false);
    onSearch?.(cleanTerm);

    if (slug) navigate(`/product/${slug}`);
    else navigate(`/search?q=${encodeURIComponent(cleanTerm)}`);
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
    onClear?.();
    inputRef.current?.focus();

    if (location.pathname === "/search") navigate("/search", { replace: true });
  };

  const showDropdown =
    focused &&
    (loading ||
      suggestions.length > 0 ||
      (!query.trim() && history.length > 0));

  return (
    <div ref={wrapperRef} className={`relative min-w-0 flex-1 ${className}`}>
      <div
        className={`flex items-center overflow-hidden border bg-white shadow-sm transition ${
          isPage
            ? "h-14 rounded-2xl"
            : isCompact
              ? "h-11 rounded-xl"
              : "h-12 rounded-2xl"
        } ${
          focused ? "border-[#015DF0] ring-4 ring-blue-100" : "border-slate-200"
        }`}
      >
        <Search
          size={isPage ? 20 : 17}
          className="ml-3 shrink-0 text-slate-400 sm:ml-4"
        />

        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            onQueryChange?.(event.target.value);
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitSearch();
            if (event.key === "Escape") setFocused(false);
          }}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400 sm:px-3"
          autoComplete="off"
          type="search"
        />

        {loading && (
          <Loader2
            size={16}
            className="mr-2 shrink-0 animate-spin text-slate-400"
          />
        )}

        {query && !loading && (
          <button
            type="button"
            onClick={clearSearch}
            className="mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}

        <button
          type="button"
          onClick={() => commitSearch()}
          className={`h-full shrink-0 font-black transition hover:bg-yellow-300 ${
            isCompact ? "px-4 text-xs" : "px-5 text-sm sm:px-6"
          }`}
          style={{ backgroundColor: BRAND_YELLOW, color: BRAND_NAVY }}
        >
          Search
        </button>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 right-0 top-full z-[1000] mt-2 max-h-[70dvh] overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-950/15"
          >
            {!query.trim() && history.length > 0 && (
              <div className="border-b border-slate-100">
                <div className="flex items-center justify-between px-4 pb-1 pt-3">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Recent
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem("nexota_search");
                    }}
                    className="text-xs font-black text-[#015DF0] hover:underline"
                  >
                    Clear
                  </button>
                </div>
                {history.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      commitSearch(item);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-blue-50"
                  >
                    <Search size={15} className="text-slate-300" />
                    <span className="min-w-0 flex-1 truncate">{item}</span>
                  </button>
                ))}
              </div>
            )}

            {query.trim() && suggestions.length > 0 && (
              <div className="py-1">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      commitSearch(item.label, item.slug);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-blue-50"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.label}
                        className="h-10 w-10 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100">
                        <Search size={15} className="text-slate-400" />
                      </div>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">
                      {highlightText(item.label, query)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {query.trim() && !loading && suggestions.length === 0 && (
              <div className="px-4 py-4 text-sm font-semibold text-slate-500">
                No suggestions found. Press Search to view results.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AppSearchBar;
