import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Heart,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
  UserCircle,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import useAuthStore from "../../store/useAuthStore";
import useCartStore from "../../store/useCartStore";
import useWishlistStore from "../../store/useWishlistStore";
import api from "../../services/api";
import Navbar from "./Navbar";

import AppSearchBar from "../ui/AppSearchBar";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || value.$oid || "";
};

const getCartItems = (state) =>
  state.items || state.cart || state.cartItems || [];

const getWishlistItems = (state) =>
  state.wishlist || state.items || state.products || [];

const getStoredToken = () => {
  const direct =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");
  if (direct) return direct;
  try {
    const authStorage = JSON.parse(
      localStorage.getItem("auth-storage") || "{}",
    );
    return authStorage?.state?.token || authStorage?.token || "";
  } catch {
    return "";
  }
};

const getCategoryPath = (category) =>
  `/category/${encodeURIComponent(
    category.slug || category._id || category.id,
  )}`;

const openAuthRequiredModal = ({
  event,
  redirectTo,
  intent = "account",
  title,
}) => {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  window.dispatchEvent(
    new CustomEvent("nexota:auth-required", {
      detail: { intent, redirectTo, title },
    }),
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ count, color = "red" }) {
  if (!count) return null;
  const cls =
    color === "gold" ? "bg-[#FEEE00] text-[#0D1B3E]" : "bg-red-500 text-white";
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`pointer-events-none absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black shadow-sm ${cls}`}
    >
      {count > 99 ? "99+" : count}
    </motion.span>
  );
}

// ─── Desktop header action (text + icon) ─────────────────────────────────────

function HeaderAction({ to, icon: Icon, label, badge, badgeColor, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="relative hidden h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-bold text-white/85 transition hover:bg-white/10 hover:text-white xl:flex"
    >
      <Icon size={17} />
      <span className="whitespace-nowrap">{label}</span>
      {badge !== undefined && <Badge count={badge} color={badgeColor} />}
    </Link>
  );
}

// ─── Icon-only action (mobile / compact) ─────────────────────────────────────

function IconAction({
  to,
  label,
  badge,
  badgeColor,
  onClick,
  children,
  className = "",
}) {
  const inner = (
    <motion.div
      whileTap={{ scale: 0.94 }}
      aria-label={label}
      // Bug fix: onClick should be on the wrapper only when there is no `to`,
      // otherwise Link handles navigation and onClick is on Link below
      className={`relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15 ${className}`}
    >
      {children}
      {badge !== undefined && <Badge count={badge} color={badgeColor} />}
    </motion.div>
  );

  return to ? (
    <Link to={to} onClick={onClick} aria-label={label}>
      {inner}
    </Link>
  ) : (
    // Bug fix: was rendering a non-interactive div; wrap in button for a11y
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="focus:outline-none"
    >
      {inner}
    </button>
  );
}

// ─── Search suggestions ───────────────────────────────────────────────────────

async function fetchSearchSuggestions(query) {
  const encoded = encodeURIComponent(query);
  const endpoints = [
    `/products?search=${encoded}&limit=6`,
    `/products/search/${encoded}`,
    `/products?keyword=${encoded}&limit=6`,
  ];
  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint);
      const list = data?.products || data?.data || data || [];
      if (Array.isArray(list)) return list;
    } catch {
      // try next endpoint
    }
  }
  return [];
}

// ─── Search Bar ───────────────────────────────────────────────────────────────

function SearchBar({ onClose, compact = false }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nexota_search") || "[]");
    } catch {
      return [];
    }
  });

  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        const list = await fetchSearchSuggestions(query);
        setSuggestions(
          list
            .map((product) => ({
              id: getId(product) || product.slug || product.title,
              label: product.title || product.name || "",
              slug: product.slug,
              image: product.image || product.images?.[0],
            }))
            .filter((item) => item.label)
            .slice(0, 6),
        );
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(debounceRef.current);
  }, [query]);

  const commit = useCallback(
    (term, slug) => {
      const cleanTerm = String(term || "").trim();
      if (!cleanTerm) return;
      const next = [
        cleanTerm,
        ...history.filter((item) => item !== cleanTerm),
      ].slice(0, 6);
      setHistory(next);
      localStorage.setItem("nexota_search", JSON.stringify(next));
      setFocused(false);
      onClose?.();
      if (slug) navigate(`/product/${slug}`);
      else navigate(`/search?q=${encodeURIComponent(cleanTerm)}`);
    },
    [history, navigate, onClose],
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setFocused(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const showDropdown =
    focused && (query ? suggestions.length > 0 || loading : history.length > 0);

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <div
        className={`flex items-center overflow-hidden rounded-2xl border bg-white transition ${
          compact ? "h-10" : "h-12"
        } ${
          focused
            ? "border-[#FEEE00] ring-4 ring-yellow-200/30"
            : "border-white/15"
        }`}
      >
        <Search size={16} className="ml-3 shrink-0 text-slate-400 sm:ml-4" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(query);
          }}
          placeholder="Search products, brands..."
          aria-label="Search"
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:px-3"
        />
        {/* Bug fix: clear button was hidden when query was empty but icon still
            took up space; now properly conditionally rendered */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="mr-1 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={() => commit(query)}
          className={`h-full shrink-0 bg-[#FEEE00] font-black text-[#0D1B3E] transition hover:bg-yellow-300 active:bg-yellow-400 ${
            compact ? "px-3 text-xs" : "px-4 text-sm sm:px-5 lg:px-6"
          }`}
        >
          Search
        </button>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            // Bug fix: z-index must exceed header's z-[999]
            className="absolute top-full z-[1100] mt-2 max-h-[70vh] w-full overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-black/15"
          >
            {!query && history.length > 0 && (
              <div>
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
                    className="text-xs font-bold text-[#015DF0] hover:underline"
                  >
                    Clear
                  </button>
                </div>
                {history.map((item) => (
                  <SuggestionRow
                    key={item}
                    label={item}
                    onSelect={() => commit(item)}
                  />
                ))}
              </div>
            )}

            {query && loading && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-[#015DF0]" />
                Searching…
              </div>
            )}

            {query && !loading && suggestions.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-400">
                No results for "{query}"
              </div>
            )}

            {query &&
              suggestions.map((item) => (
                <SuggestionRow
                  key={item.id}
                  label={item.label}
                  image={item.image}
                  query={query}
                  onSelect={() => commit(item.label, item.slug)}
                />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Suggestion Row ───────────────────────────────────────────────────────────

function SuggestionRow({ label, image, query, onSelect }) {
  const idx = query ? label.toLowerCase().indexOf(query.toLowerCase()) : -1;
  const before = idx >= 0 ? label.slice(0, idx) : label;
  const match = idx >= 0 ? label.slice(idx, idx + query.length) : "";
  const after = idx >= 0 ? label.slice(idx + query.length) : "";

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
    >
      {image ? (
        <img
          src={image}
          alt=""
          className="h-8 w-8 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <Search size={14} className="shrink-0 text-slate-300" />
      )}
      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
        {before}
        <strong className="text-[#015DF0]">{match}</strong>
        {after}
      </span>
    </button>
  );
}

// ─── User Menu ────────────────────────────────────────────────────────────────

function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!user) {
    return (
      <div className="hidden items-center gap-2 lg:flex">
        <Link
          to="/login"
          className="flex h-10 items-center rounded-xl bg-[#FEEE00] px-4 text-sm font-black text-[#0D1B3E] transition hover:bg-yellow-300 active:bg-yellow-400"
        >
          Log in
        </Link>
        <Link
          to="/register"
          className="flex h-10 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
        >
          Register
        </Link>
      </div>
    );
  }

  const initials = (user.name || user.email || "U").slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/10 pl-2 pr-3 text-white transition hover:bg-white/15"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FEEE00] text-xs font-black text-[#0D1B3E]">
          {initials}
        </span>
        {/* Bug fix: max-w caused truncation on 2xl even with short names */}
        <span className="hidden max-w-32 truncate text-sm font-semibold 2xl:block">
          {user.name || "Account"}
        </span>
        <ChevronDown
          size={13}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            role="menu"
            className="absolute right-0 top-full z-[1100] mt-2 w-60 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl"
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-black text-slate-800">
                {user.name || "My Account"}
              </p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
            {[
              { icon: User, label: "My Account", href: "/account" },
              { icon: Package, label: "My Orders", href: "/orders" },
              { icon: Heart, label: "Wishlist", href: "/wishlist" },
            ].map(({ icon: Icon, label, href }) => (
              <Link
                key={href}
                to={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              >
                <Icon size={15} className="text-[#015DF0]" />
                {label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                logout?.();
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-2.5 text-sm text-red-500 transition hover:bg-red-50"
            >
              <LogOut size={15} /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Drawer Link ──────────────────────────────────────────────────────────────

function DrawerLink({ to, icon: Icon, label, onClose, strong, onClick }) {
  return (
    <Link
      to={to}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onClose?.();
      }}
      className={`flex min-h-[44px] items-center gap-3 px-5 py-3 text-sm transition hover:bg-blue-50 hover:text-[#015DF0] ${
        strong ? "font-black text-[#0D1B3E]" : "font-medium text-slate-700"
      }`}
    >
      <Icon
        size={16}
        className={strong ? "text-[#015DF0]" : "text-slate-400"}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────

function MobileDrawer({
  open,
  onClose,
  user,
  logout,
  categories,
  requireAuth,
}) {
  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const accountLinks = user
    ? [
        { to: "/account", label: "My Account", icon: UserCircle },
        { to: "/orders", label: "My Orders", icon: Package },
        { to: "/wishlist", label: "Wishlist", icon: Heart },
      ]
    : [
        { to: "/login", label: "Log in", icon: User },
        { to: "/register", label: "Register", icon: UserCircle },
      ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-[9998] bg-black/45 backdrop-blur-sm"
          />

          {/* Drawer panel */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed left-0 top-0 z-[9999] flex h-[100dvh] w-[88vw] max-w-[360px] flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-[#0D1B3E] px-5 py-4">
              <Link
                to="/"
                onClick={onClose}
                className="flex h-10 w-[68px] shrink-0 items-center justify-center overflow-hidden"
                aria-label="Nexota home"
              >
                <img
                  src="/logo.png"
                  alt="Nexota"
                  className="block h-full w-full object-contain"
                />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* User info (when logged in) */}
            {user && (
              <div className="border-t border-white/10 bg-[#0D1B3E] px-5 py-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEEE00] text-sm font-black text-[#0D1B3E]">
                    {(user.name || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">
                      {user.name || "User"}
                    </p>
                    <p className="truncate text-xs text-white/55">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Nav links */}
            <nav
              className="flex-1 overflow-y-auto py-2"
              aria-label="Main navigation"
            >
              <DrawerLink to="/" onClose={onClose} icon={Home} label="Home" />
              <DrawerLink
                to="/products"
                onClose={onClose}
                icon={LayoutGrid}
                label="All Products"
              />

              {/* Divider */}
              <div className="mx-5 my-2 border-t border-slate-100" />

              {accountLinks.map(({ to, label, icon }) => (
                <DrawerLink
                  key={to}
                  to={to}
                  onClose={onClose}
                  icon={icon}
                  label={label}
                  strong
                />
              ))}

              {/* Bug fix: when logged out, Orders and Wishlist were shown twice
                  (once in accountLinks, once in the !user block below).
                  The !user block only adds guarded links not in accountLinks. */}
              {!user && (
                <DrawerLink
                  to="/orders"
                  onClose={onClose}
                  icon={Package}
                  label="My Orders"
                  strong
                />
              )}

              {!user && (
                <DrawerLink
                  to="/wishlist"
                  onClose={onClose}
                  icon={Heart}
                  label="Wishlist"
                  strong
                  onClick={requireAuth({
                    redirectTo: "/wishlist",
                    intent: "wishlist",
                    title: "Login to view your wishlist",
                  })}
                />
              )}

              {categories.length > 0 && (
                <>
                  <div className="mx-5 my-2 border-t border-slate-100" />
                  <div className="px-5 pb-1 pt-3 text-xs font-black uppercase tracking-widest text-slate-400">
                    Categories
                  </div>
                </>
              )}

              {categories.map((cat) => (
                <DrawerLink
                  key={cat._id || cat.slug}
                  to={getCategoryPath(cat)}
                  onClose={onClose}
                  icon={ShoppingBag}
                  label={cat.name || "Category"}
                />
              ))}
            </nav>

            {/* Logout footer */}
            {user && (
              <div className="border-t border-slate-100 px-5 py-4 safe-bottom">
                <button
                  type="button"
                  onClick={() => {
                    logout?.();
                    onClose();
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-bold text-red-500 transition hover:bg-red-100 active:bg-red-200"
                >
                  <LogOut size={15} /> Log out
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const cartCount = useCartStore((state) =>
    getCartItems(state).reduce(
      (sum, item) => sum + Number(item.quantity || item.qty || 1),
      0,
    ),
  );
  const wishlistCount = useWishlistStore(
    (state) => getWishlistItems(state).length,
  );
  const fetchWishlist = useWishlistStore(
    (state) => state.fetchWishlist || state.getWishlist || state.fetchItems,
  );
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = Boolean(user || getStoredToken());

  const requireAuth = useCallback(
    ({ redirectTo, intent, title }) =>
      (event) => {
        if (isAuthenticated) return;
        openAuthRequiredModal({ event, redirectTo, intent, title });
        setMobileMenu(false);
      },
    [isAuthenticated],
  );

  useEffect(() => {
    let mounted = true;
    api
      .get("/categories")
      .then((res) => {
        if (!mounted) return;
        const list = res.data?.categories ?? res.data?.data ?? res.data ?? [];
        setCategories(
          Array.isArray(list)
            ? list.filter((cat) => cat?.isActive !== false)
            : [],
        );
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Header categories:", err.message);
        setCategories([]);
      })
      .finally(() => {
        if (mounted) setCategoriesLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    fetchWishlist?.();
    fetchProfile?.().catch?.(() => {});
  }, [fetchProfile, fetchWishlist]);

  return (
    <>
      <header className="sticky top-0 z-[999] border-b border-white/10 bg-[#0D1B3E] shadow-[0_6px_30px_rgba(13,27,62,0.22)]">
        <div className="mx-auto max-w-[1600px] px-3 sm:px-4 lg:px-6">
          {/* Main row */}
          <div className="flex h-14 items-center gap-2 sm:h-16 sm:gap-3 lg:gap-4">
            {/* Hamburger — mobile/tablet only */}
            <button
              type="button"
              aria-label={mobileMenu ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenu}
              aria-controls="mobile-drawer"
              onClick={() => setMobileMenu((v) => !v)}
              className="min-h-[44px] min-w-[44px] rounded-xl p-2 text-white transition hover:bg-white/10 lg:hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileMenu ? "x" : "menu"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center"
                >
                  {mobileMenu ? <X size={22} /> : <Menu size={22} />}
                </motion.span>
              </AnimatePresence>
            </button>

            {/* Logo */}
            <Link
              to="/"
              className="flex h-10 w-[58px] shrink-0 items-center justify-center overflow-hidden sm:h-12 sm:w-[76px]"
              aria-label="Nexota home"
            >
              <img
                src="/logo.png"
                alt="Nexota"
                className="block h-full w-full object-contain"
              />
            </Link>

            {/* Desktop search bar — hidden on mobile (shown below on second row) */}
            <div className="hidden min-w-0 flex-1 md:flex">
              <AppSearchBar variant="header" />
            </div>

            {/* Right actions */}
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              {/* Text actions — desktop xl+ */}
              <HeaderAction
                to="/account"
                icon={UserCircle}
                label="My Account"
                onClick={requireAuth({
                  redirectTo: "/account",
                  intent: "account",
                  title: "Login to view your account",
                })}
              />
              <HeaderAction to="/orders" icon={Package} label="My Orders" />
              <HeaderAction
                to="/wishlist"
                icon={Heart}
                label="Wishlist"
                badge={wishlistCount}
                onClick={requireAuth({
                  redirectTo: "/wishlist",
                  intent: "wishlist",
                  title: "Login to view your wishlist",
                })}
              />
              <HeaderAction
                to="/cart"
                icon={ShoppingCart}
                label="Cart"
                badge={cartCount}
                badgeColor="gold"
              />

              {/* User menu — desktop */}
              <UserMenu user={user} logout={logout} />

              {/* Icon-only actions — below xl */}
              <div className="flex items-center gap-1.5 xl:hidden">
                <IconAction
                  to="/account"
                  label="My Account"
                  onClick={requireAuth({
                    redirectTo: "/account",
                    intent: "account",
                    title: "Login to view your account",
                  })}
                >
                  <UserCircle size={18} />
                </IconAction>

                {/* Orders icon hidden on very small screens to save space */}
                <IconAction
                  to="/orders"
                  label="My Orders"
                  className="hidden sm:grid"
                >
                  <Package size={18} />
                </IconAction>

                <IconAction
                  to="/wishlist"
                  label="Wishlist"
                  badge={wishlistCount}
                  onClick={requireAuth({
                    redirectTo: "/wishlist",
                    intent: "wishlist",
                    title: "Login to view your wishlist",
                  })}
                >
                  <Heart size={18} />
                </IconAction>

                <IconAction
                  to="/cart"
                  label="Cart"
                  badge={cartCount}
                  badgeColor="gold"
                >
                  <ShoppingCart size={18} />
                </IconAction>
              </div>
            </div>
          </div>

          {/* Mobile search row */}
          <div className="pb-3 md:hidden">
            <AppSearchBar variant="compact" />
          </div>
        </div>

        {/* Category navbar */}
        <Navbar categories={categories} loading={categoriesLoading} />
      </header>

      {/* Mobile drawer */}
      <MobileDrawer
        id="mobile-drawer"
        open={mobileMenu}
        onClose={() => setMobileMenu(false)}
        user={user}
        logout={logout}
        categories={categories}
        requireAuth={requireAuth}
      />
    </>
  );
}

export default Header;
