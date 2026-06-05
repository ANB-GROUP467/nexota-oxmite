import { NavLink } from "react-router-dom";

import { Home, Search, Heart, ShoppingCart, User } from "lucide-react";

function MobileBottomNav() {
  const navItems = [
    {
      icon: Home,
      path: "/",
      label: "Home",
    },

    {
      icon: Search,
      path: "/search",
      label: "Search",
    },

    {
      icon: Heart,
      path: "/wishlist",
      label: "Wishlist",
    },

    {
      icon: ShoppingCart,
      path: "/cart",
      label: "Cart",
    },

    {
      icon: User,
      path: "/profile",
      label: "Profile",
    },
  ];

  return (
    <div
      className="
      fixed
      bottom-0
      left-0
      right-0
      md:hidden
      bg-white/90
      backdrop-blur-xl
      border-t
      border-gray-200
      z-[999]
      shadow-[0_-8px_30px_rgba(0,0,0,0.08)]
      "
    >
      <div
        className="
        flex
        justify-around
        py-2
        "
      >
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `
                flex
                flex-col
                items-center
                gap-1
                text-xs
                transition-all

                ${isActive ? "text-[#F59E0B]" : "text-gray-500"}
                `
              }
            >
              <Icon size={20} />

              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

export default MobileBottomNav;
