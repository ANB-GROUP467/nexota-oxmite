import { Home, Heart, Package, ShoppingCart, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import useCartStore from "../../store/useCartStore";
import useWishlistStore from "../../store/useWishlistStore";

const BRAND_BLUE = "#015DF0";
const BRAND_NAVY = "#0D1B3E";
const BRAND_YELLOW = "#FEEE00";

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

function CountBadge({ count, tone = "red" }) {
  if (!count) return null;

  return (
    <span
      className={`absolute -right-1 top-0 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-black ${
        tone === "yellow" ? "text-[#0D1B3E]" : "text-white"
      }`}
      style={{ backgroundColor: tone === "yellow" ? BRAND_YELLOW : "#ef4444" }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function MobileBottomNav() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(user || getStoredToken());
  const cartCount = useCartStore((state) =>
    getCartItems(state).reduce(
      (total, item) => total + Number(item.quantity || item.qty || 1),
      0,
    ),
  );
  const wishlistCount = useWishlistStore(
    (state) => getWishlistItems(state).length,
  );

  const requireAuth =
    ({ redirectTo, intent, title }) =>
    (event) => {
      if (isAuthenticated) return;

      event.preventDefault();
      window.dispatchEvent(
        new CustomEvent("nexota:auth-required", {
          detail: {
            redirectTo,
            intent,
            title,
            mode: "login",
            startStep: intent === "orders" ? "prompt" : "identifier",
          },
        }),
      );
    };

  const items = [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/products", label: "Products", icon: Package },
    {
      to: "/wishlist",
      label: "Wishlist",
      icon: Heart,
      count: wishlistCount,
      onClick: requireAuth({
        redirectTo: "/wishlist",
        intent: "wishlist",
        title: "Login to view your wishlist",
      }),
    },
    {
      to: "/cart",
      label: "Cart",
      icon: ShoppingCart,
      count: cartCount,
      tone: "yellow",
    },
    {
      to: "/account",
      label: "Account",
      icon: UserRound,
      onClick: requireAuth({
        redirectTo: "/account",
        intent: "account",
        title: "Login to view your account",
      }),
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[998] border-t border-slate-200 bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.10)] backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile bottom navigation"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 px-1">
        {items.map(({ to, label, icon: Icon, count, tone, end, onClick }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClick}
            className={({ isActive }) =>
              `flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-black transition ${
                isActive
                  ? "text-[#015DF0]"
                  : "text-slate-500 hover:text-[#015DF0]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="relative grid h-8 w-8 place-items-center rounded-xl transition"
                  style={{
                    backgroundColor: isActive
                      ? `${BRAND_BLUE}14`
                      : "transparent",
                    color: isActive ? BRAND_BLUE : undefined,
                  }}
                >
                  <Icon
                    size={19}
                    fill={
                      isActive && label === "Wishlist" ? BRAND_BLUE : "none"
                    }
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <CountBadge count={count} tone={tone} />
                </span>
                <span
                  className="max-w-full truncate leading-none"
                  style={{ color: isActive ? BRAND_BLUE : undefined }}
                >
                  {label}
                </span>
                {isActive && (
                  <span
                    className="mt-0.5 h-1 w-1 rounded-full"
                    style={{ backgroundColor: BRAND_NAVY }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
