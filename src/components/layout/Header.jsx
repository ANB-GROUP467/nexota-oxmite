import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  MapPin,
  Globe,
  ChevronDown,
  Package,
  LogOut,
  ShoppingBag,
  Home,
  Laptop,
  Gamepad2,
  Camera,
  Headphones,
  LayoutGrid,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";

import useCartStore from "../../store/useCartStore";
import useWishlistStore from "../../store/useWishlistStore";
import useAuthStore from "../../store/useAuthStore";

// ─── constants ────────────────────────────────────────────────────────────────
const LOCATIONS = [
  "Doha",
  "Al Rayyan",
  "Al Wakrah",
  "Al Khor",
  "Lusail",
  "Mesaieed",
];

const SEARCH_SUGGESTIONS = [
  "iPhone 16 Pro",
  "Samsung S25 Ultra",
  "MacBook Pro",
  "Gaming Laptop",
  "PlayStation 5",
  "AirPods Pro",
  "Sony WH-1000XM5",
];

const MOBILE_NAV_LINKS = [
  { label: "Home", href: "/", icon: Home },
  { label: "All Products", href: "/products", icon: LayoutGrid },
  { label: "Electronics", href: "/category/electronics", icon: ShoppingBag },
  { label: "Mobiles", href: "/category/mobiles", icon: ShoppingBag },
  { label: "Laptops", href: "/category/laptops", icon: Laptop },
  { label: "Gaming", href: "/category/gaming", icon: Gamepad2 },
  { label: "Audio", href: "/category/audio", icon: Headphones },
  { label: "Cameras", href: "/category/cameras", icon: Camera },
];

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ count, color = "amber" }) {
  if (!count) return null;
  const colors = {
    amber: "bg-[#015df0] text-white",
    red: "bg-red-500 text-white",
  };
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1
        rounded-full text-[10px] font-bold flex items-center justify-center
        shadow-sm pointer-events-none ${colors[color]}`}
    >
      {count > 99 ? "99+" : count}
    </motion.span>
  );
}

// ─── Icon button ──────────────────────────────────────────────────────────────
function IconBtn({ children, to, label, badge, badgeColor, onClick }) {
  const inner = (
    <motion.div
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      aria-label={label}
      onClick={onClick}
      className="relative flex items-center justify-center w-10 h-10
        rounded-xl bg-gray-50 hover:bg-blue-50 border border-transparent
        hover:border-blue-200 cursor-pointer transition-colors duration-150"
    >
      {children}
      {badge !== undefined && <Badge count={badge} color={badgeColor} />}
    </motion.div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

// ─── Search bar ───────────────────────────────────────────────────────────────
function SearchBar({ onClose }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nexota_search") || "[]");
    } catch {
      return [];
    }
  });
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  const filtered = SEARCH_SUGGESTIONS.filter(
    (s) => query && s.toLowerCase().includes(query.toLowerCase()),
  );
  const showDropdown =
    focused && (query ? filtered.length > 0 : history.length > 0);

  const commit = useCallback(
    (term) => {
      if (!term.trim()) return;
      const next = [term, ...history.filter((h) => h !== term)].slice(0, 6);
      setHistory(next);
      localStorage.setItem("nexota_search", JSON.stringify(next));
      setQuery(term);
      setFocused(false);
      onClose?.();
      navigate(`/search?q=${encodeURIComponent(term)}`);
    },
    [history, navigate, onClose],
  );

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setFocused(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className="flex-1 relative">
      <div
        className={`flex items-center h-11 rounded-2xl border bg-gray-50
        transition-all duration-200 overflow-hidden
        ${
          focused
            ? "border-[#015df0] ring-4 ring-blue-100 bg-white"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <Search size={16} className="ml-4 shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(query);
          }}
          placeholder="Search products, brands and more…"
          className="flex-1 h-full bg-transparent px-3 text-sm outline-none placeholder:text-gray-400 text-gray-800"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="mr-2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
        <button
          onClick={() => commit(query)}
          className="h-full px-5 bg-[#015df0] hover:bg-[#0148c0] text-white font-semibold
            text-sm transition-colors border-l border-blue-300 shrink-0"
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
            className="absolute top-full mt-2 w-full bg-white rounded-2xl
              shadow-2xl shadow-black/10 border border-gray-100 overflow-hidden z-50"
          >
            {!query && history.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Recent
                  </span>
                  <button
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem("nexota_search");
                    }}
                    className="text-xs text-[#015df0] hover:underline"
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
            {query &&
              filtered.map((item) => (
                <SuggestionRow
                  key={item}
                  label={item}
                  query={query}
                  onSelect={() => commit(item)}
                />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuggestionRow({ label, query, onSelect }) {
  const idx = query ? label.toLowerCase().indexOf(query.toLowerCase()) : -1;
  const before = idx >= 0 ? label.slice(0, idx) : label;
  const match = idx >= 0 ? label.slice(idx, idx + query.length) : "";
  const after = idx >= 0 ? label.slice(idx + query.length) : "";

  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 cursor-pointer group"
    >
      <Search
        size={13}
        className="shrink-0 text-gray-300 group-hover:text-[#015df0]"
      />
      <span className="text-sm text-gray-700">
        {before}
        <strong className="text-[#015df0]">{match}</strong>
        {after}
      </span>
    </div>
  );
}

// ─── Location picker ──────────────────────────────────────────────────────────
function LocationPicker() {
  const [location, setLocation] = useState("Doha");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-600
          hover:text-[#015df0] transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
      >
        <MapPin size={14} className="text-[#015df0]" />
        {location}
        <ChevronDown
          size={12}
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
            className="absolute top-full mt-2 left-0 bg-white rounded-2xl shadow-xl
              border border-gray-100 overflow-hidden z-50 w-44"
          >
            {LOCATIONS.map((loc) => (
              <button
                key={loc}
                onClick={() => {
                  setLocation(loc);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50
                  transition-colors flex items-center gap-2
                  ${loc === location ? "font-semibold text-[#015df0] bg-blue-50" : "text-gray-700"}`}
              >
                {loc === location && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#015df0] shrink-0" />
                )}
                {loc}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── User menu ────────────────────────────────────────────────────────────────
function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user)
    return (
      <div className="hidden md:flex items-center gap-2">
        <Link to="/login">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="h-9 px-4 rounded-xl bg-[#015df0] hover:bg-[#0148c0]
              text-white font-semibold text-sm transition-colors shadow-sm"
          >
            Log in
          </motion.button>
        </Link>
        <Link to="/register">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="h-9 px-4 rounded-xl border border-gray-200 text-gray-700
              font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Register
          </motion.button>
        </Link>
      </div>
    );

  const initials = (user.name || "U").slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative hidden md:block">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-10 h-10 rounded-xl
          bg-[#015df0] text-white font-bold text-sm shadow-sm cursor-pointer"
      >
        {initials}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            className="absolute top-full right-0 mt-2 w-52 bg-white rounded-2xl
              shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-sm text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            {[
              { icon: User, label: "My Account", href: "/dashboard" },
              { icon: Package, label: "My Orders", href: "/dashboard" },
              { icon: Heart, label: "Wishlist", href: "/wishlist" },
            ].map(({ icon: Icon, label, href }) => (
              <Link
                key={href}
                to={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700
                  hover:bg-blue-50 transition-colors"
              >
                <Icon size={15} className="text-gray-400" />
                {label}
              </Link>
            ))}
            <button
              onClick={() => {
                logout();
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
            >
              <LogOut size={15} /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Mobile drawer ────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose, user, logout }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 left-0 h-screen w-72 bg-white shadow-2xl z-[9999] flex flex-col"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#0D1B3E]">
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center gap-2"
              >
                <img src="/logo.png" alt="Nexota" className="h-8 w-auto" />
              </Link>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile search */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 h-10 rounded-xl bg-gray-50 border border-gray-200 px-3">
                <Search size={15} className="text-gray-400" />
                <input
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                  placeholder="Search products…"
                />
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-2">
              {MOBILE_NAV_LINKS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-5 py-3 text-sm font-medium
                    text-gray-700 hover:bg-blue-50 hover:text-[#015df0] transition-colors"
                >
                  <Icon size={16} className="text-gray-400" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Bottom: auth */}
            <div className="border-t border-gray-100 px-5 py-4 space-y-3">
              {!user ? (
                <div className="flex gap-2">
                  <Link to="/login" onClick={onClose} className="flex-1">
                    <button className="w-full h-9 rounded-xl bg-[#015df0] text-white font-semibold text-sm">
                      Log in
                    </button>
                  </Link>
                  <Link to="/register" onClick={onClose} className="flex-1">
                    <button className="w-full h-9 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm">
                      Register
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <Link
                    to="/dashboard"
                    onClick={onClose}
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#015df0] text-white flex items-center justify-center text-xs font-bold">
                      {(user.name || "U").slice(0, 2).toUpperCase()}
                    </div>
                    {user.name}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="text-sm text-red-500 flex items-center gap-1"
                  >
                    <LogOut size={13} /> Out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Header ──────────────────────────────────────────────────────────────
export default function Header() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  const cartCount = useCartStore(
    (state) =>
      state.cart?.reduce((sum, item) => sum + (item.quantity || 1), 0) ?? 0,
  );
  const wishlistCount = useWishlistStore(
    (state) => state.wishlist?.length ?? 0,
  );
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    if (y > lastY.current && y > 80) setHidden(true);
    else setHidden(false);
    lastY.current = y;
  });

  return (
    <>
      <motion.header
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="sticky top-0 z-[999] bg-white/90 backdrop-blur-xl
          border-b border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.06)]"
      >
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="h-16 flex items-center gap-4">
            {/* Hamburger — mobile only */}
            <button
              aria-label={mobileMenu ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenu}
              onClick={() => setMobileMenu((o) => !o)}
              className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileMenu ? "x" : "menu"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex"
                >
                  {mobileMenu ? <X size={22} /> : <Menu size={22} />}
                </motion.span>
              </AnimatePresence>
            </button>

            {/* Logo */}
            <Link to="/" className="shrink-0">
              <img src="/logo.png" alt="Nexota" className="h-12 w-auto" />
            </Link>

            {/* Search — desktop */}
            <div className="hidden md:flex flex-1 max-w-2xl">
              <SearchBar />
            </div>

            {/* Location */}
            <LocationPicker />

            {/* Right actions */}
            <div className="flex items-center gap-2 ml-auto md:ml-0 shrink-0">
              <UserMenu user={user} logout={logout} />

              <IconBtn
                to="/wishlist"
                label="Wishlist"
                badge={wishlistCount}
                badgeColor="red"
              >
                <Heart size={18} className="text-gray-600" />
              </IconBtn>

              <IconBtn
                to="/cart"
                label="Cart"
                badge={cartCount}
                badgeColor="amber"
              >
                <ShoppingCart size={18} className="text-gray-600" />
              </IconBtn>
            </div>
          </div>

          {/* Mobile search row */}
          <div className="md:hidden pb-3">
            <SearchBar onClose={() => {}} />
          </div>
        </div>
      </motion.header>

      <MobileDrawer
        open={mobileMenu}
        onClose={() => setMobileMenu(false)}
        user={user}
        logout={logout}
      />
    </>
  );
}
