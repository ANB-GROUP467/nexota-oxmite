import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ChevronDown = ({ size = 15, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const ChevronRight = ({ size = 14 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const navbarData = [
  {
    id: 1,
    name: "Electronics",
    path: "/category/electronics",
    sections: [
      {
        title: "Mobiles",
        icon: "📱",
        featured: {
          title: "Top Mobile Deals",
          image:
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
        },
        items: [
          { label: "iPhone", to: "/category/mobiles/iphone" },
          { label: "Samsung Galaxy", to: "/category/mobiles/samsung" },
          { label: "Xiaomi", to: "/category/mobiles/xiaomi" },
          { label: "Oppo", to: "/category/mobiles/oppo" },
          { label: "OnePlus", to: "/category/mobiles/oneplus" },
        ],
      },
      {
        title: "Computers",
        icon: "💻",
        featured: {
          title: "Best Laptops 2026",
          image:
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
        },
        items: [
          { label: "Laptops", to: "/category/laptops" },
          { label: "Monitors", to: "/category/monitors" },
          { label: "Gaming PCs", to: "/category/gaming-pcs" },
          { label: "Keyboards", to: "/category/keyboards" },
          { label: "Mice", to: "/category/mice" },
        ],
      },
      {
        title: "Gaming",
        icon: "🎮",
        featured: {
          title: "Gaming Deals This Week",
          image:
            "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400",
        },
        items: [
          { label: "PlayStation 5", to: "/category/gaming/ps5" },
          { label: "Xbox Series X", to: "/category/gaming/xbox" },
          { label: "Nintendo Switch", to: "/category/gaming/nintendo" },
          { label: "Controllers", to: "/category/gaming/controllers" },
          { label: "Headsets", to: "/category/gaming/headsets" },
        ],
      },
      {
        title: "Audio",
        icon: "🎧",
        featured: {
          title: "Premium Sound",
          image:
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
        },
        items: [
          { label: "Headphones", to: "/category/audio/headphones" },
          { label: "Earbuds", to: "/category/audio/earbuds" },
          { label: "Speakers", to: "/category/audio/speakers" },
          { label: "Soundbars", to: "/category/audio/soundbars" },
        ],
      },
      {
        title: "Cameras",
        icon: "📷",
        featured: {
          title: "Capture Every Moment",
          image:
            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
        },
        items: [
          { label: "DSLR Cameras", to: "/category/cameras/dslr" },
          { label: "Mirrorless", to: "/category/cameras/mirrorless" },
          { label: "Action Cameras", to: "/category/cameras/action" },
          { label: "Lenses", to: "/category/cameras/lenses" },
          { label: "Tripods", to: "/category/cameras/tripods" },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Mobiles",
    path: "/category/mobiles",
    sections: [
      {
        title: "By Brand",
        icon: "🏷️",
        featured: {
          title: "Latest Smartphones 2026",
          image:
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
        },
        items: [
          { label: "Apple iPhone", to: "/category/mobiles/iphone" },
          { label: "Samsung Galaxy", to: "/category/mobiles/samsung" },
          { label: "Xiaomi", to: "/category/mobiles/xiaomi" },
          { label: "Oppo", to: "/category/mobiles/oppo" },
          { label: "OnePlus", to: "/category/mobiles/oneplus" },
        ],
      },
      {
        title: "By Type",
        icon: "📲",
        featured: {
          title: "Foldables & Flagships",
          image:
            "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
        },
        items: [
          { label: "Flagship", to: "/category/mobiles/flagship" },
          { label: "Mid-Range", to: "/category/mobiles/mid-range" },
          { label: "Budget", to: "/category/mobiles/budget" },
          { label: "Foldable", to: "/category/mobiles/foldable" },
        ],
      },
      {
        title: "Accessories",
        icon: "🔌",
        featured: {
          title: "Mobile Accessories",
          image:
            "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400",
        },
        items: [
          { label: "Cases & Covers", to: "/category/mobiles/cases" },
          { label: "Chargers", to: "/category/mobiles/chargers" },
          {
            label: "Screen Protectors",
            to: "/category/mobiles/screen-protectors",
          },
          { label: "Power Banks", to: "/category/mobiles/power-banks" },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Laptops",
    path: "/category/laptops",
    sections: [
      {
        title: "By Brand",
        icon: "🏷️",
        featured: {
          title: "Best Laptops of 2026",
          image:
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
        },
        items: [
          { label: "Apple MacBook", to: "/category/laptops/macbook" },
          { label: "Dell", to: "/category/laptops/dell" },
          { label: "HP", to: "/category/laptops/hp" },
          { label: "Lenovo", to: "/category/laptops/lenovo" },
          { label: "Asus", to: "/category/laptops/asus" },
        ],
      },
      {
        title: "By Use",
        icon: "🎯",
        featured: {
          title: "Gaming Laptops",
          image:
            "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400",
        },
        items: [
          { label: "Gaming Laptops", to: "/category/laptops/gaming" },
          { label: "Business", to: "/category/laptops/business" },
          { label: "Student", to: "/category/laptops/student" },
          { label: "Creative", to: "/category/laptops/creative" },
        ],
      },
      {
        title: "Accessories",
        icon: "🖱️",
        featured: {
          title: "Laptop Accessories",
          image:
            "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
        },
        items: [
          { label: "Laptop Bags", to: "/category/laptops/bags" },
          { label: "Stands & Docks", to: "/category/laptops/stands" },
          { label: "Cooling Pads", to: "/category/laptops/cooling" },
          { label: "External Drives", to: "/category/laptops/drives" },
        ],
      },
    ],
  },
  {
    id: 4,
    name: "Gaming",
    path: "/category/gaming",
    sections: [
      {
        title: "Consoles",
        icon: "🕹️",
        featured: {
          title: "Gaming Deals This Week",
          image:
            "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400",
        },
        items: [
          { label: "PlayStation 5", to: "/category/gaming/ps5" },
          { label: "Xbox Series X", to: "/category/gaming/xbox" },
          { label: "Nintendo Switch", to: "/category/gaming/nintendo" },
        ],
      },
      {
        title: "PC Gaming",
        icon: "🖥️",
        featured: {
          title: "Build Your Rig",
          image:
            "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400",
        },
        items: [
          { label: "Gaming PCs", to: "/category/gaming/pcs" },
          { label: "Graphics Cards", to: "/category/gaming/gpu" },
          { label: "Processors", to: "/category/gaming/cpu" },
          { label: "RAM & Storage", to: "/category/gaming/ram" },
        ],
      },
      {
        title: "Accessories",
        icon: "🎮",
        featured: {
          title: "Gaming Gear",
          image:
            "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400",
        },
        items: [
          { label: "Controllers", to: "/category/gaming/controllers" },
          { label: "Headsets", to: "/category/gaming/headsets" },
          { label: "Gaming Chairs", to: "/category/gaming/chairs" },
          { label: "Monitors", to: "/category/gaming/monitors" },
        ],
      },
    ],
  },
  {
    id: 5,
    name: "Audio",
    path: "/category/audio",
    sections: [
      {
        title: "Headphones",
        icon: "🎧",
        featured: {
          title: "Premium Headphones",
          image:
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
        },
        items: [
          { label: "Over-Ear", to: "/category/audio/over-ear" },
          { label: "On-Ear", to: "/category/audio/on-ear" },
          { label: "Noise Cancelling", to: "/category/audio/noise-cancelling" },
          { label: "Studio", to: "/category/audio/studio" },
        ],
      },
      {
        title: "Earbuds",
        icon: "🎵",
        featured: {
          title: "True Wireless Earbuds",
          image:
            "https://images.unsplash.com/photo-1606741965429-02919b58e8b1?w=400",
        },
        items: [
          { label: "True Wireless", to: "/category/audio/tws" },
          { label: "Wired Earphones", to: "/category/audio/wired" },
          { label: "Sports Earbuds", to: "/category/audio/sports" },
        ],
      },
      {
        title: "Speakers",
        icon: "🔊",
        featured: {
          title: "Home Audio Systems",
          image:
            "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400",
        },
        items: [
          { label: "Bluetooth Speakers", to: "/category/audio/bluetooth" },
          { label: "Smart Speakers", to: "/category/audio/smart" },
          { label: "Home Theatre", to: "/category/audio/home-theatre" },
          { label: "Soundbars", to: "/category/audio/soundbars" },
        ],
      },
    ],
  },
  {
    id: 6,
    name: "Cameras",
    path: "/category/cameras",
    sections: [
      {
        title: "Camera Types",
        icon: "📷",
        featured: {
          title: "Capture Every Moment",
          image:
            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
        },
        items: [
          { label: "DSLR Cameras", to: "/category/cameras/dslr" },
          { label: "Mirrorless", to: "/category/cameras/mirrorless" },
          { label: "Action Cameras", to: "/category/cameras/action" },
          { label: "Instant Cameras", to: "/category/cameras/instant" },
        ],
      },
      {
        title: "By Brand",
        icon: "🏷️",
        featured: {
          title: "Canon & Nikon Picks",
          image:
            "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400",
        },
        items: [
          { label: "Canon", to: "/category/cameras/canon" },
          { label: "Nikon", to: "/category/cameras/nikon" },
          { label: "Sony", to: "/category/cameras/sony" },
          { label: "GoPro", to: "/category/cameras/gopro" },
        ],
      },
      {
        title: "Accessories",
        icon: "🎒",
        featured: {
          title: "Camera Accessories",
          image:
            "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400",
        },
        items: [
          { label: "Lenses", to: "/category/cameras/lenses" },
          { label: "Tripods", to: "/category/cameras/tripods" },
          { label: "Camera Bags", to: "/category/cameras/bags" },
          { label: "Memory Cards", to: "/category/cameras/memory" },
        ],
      },
    ],
  },
  {
    id: 7,
    name: "All Products",
    path: "/products",
    sections: [],
  },
];

function Navbar() {
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  const handleMenuEnter = (item) => {
    if (!item.sections?.length) return;
    setActiveMenu(item);
    setActiveSection(item.sections[0]);
  };

  const handleClose = () => {
    setActiveMenu(null);
    setActiveSection(null);
  };

  return (
    <div
      className="relative bg-[#0D1B3E] border-b border-white/10"
      onMouseLeave={handleClose}
    >
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex gap-0.5 h-12 items-center overflow-x-auto scrollbar-hide">
          {navbarData.map((item) => {
            const isActive = activeMenu?.id === item.id;
            const isCurrent = location.pathname === item.path;
            const hasDropdown = item.sections?.length > 0;

            return (
              <div
                key={item.id}
                className="relative h-full flex items-center"
                onMouseEnter={() => handleMenuEnter(item)}
              >
                <Link
                  to={item.path}
                  onClick={handleClose}
                  className={`
                    flex items-center gap-1 whitespace-nowrap font-medium text-sm
                    px-4 py-1.5 rounded-full transition-all duration-200
                    ${
                      isActive
                        ? "bg-white/15 text-white"
                        : isCurrent
                          ? "text-white bg-white/10"
                          : "text-white/75 hover:text-white hover:bg-white/10"
                    }
                  `}
                >
                  {item.name}
                  {hasDropdown && (
                    <ChevronDown
                      size={13}
                      className={`opacity-60 transition-transform duration-200 ${isActive ? "rotate-180" : ""}`}
                    />
                  )}
                </Link>

                {/* Active underline indicator */}
                {isCurrent && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-white rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2-panel mega dropdown ──────────────────────────────────────────── */}
      <AnimatePresence>
        {activeMenu && activeMenu.sections?.length > 0 && (
          <motion.div
            key={activeMenu.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full w-full z-[999] bg-white border-t border-gray-100 shadow-2xl"
          >
            <div
              className="max-w-[1600px] mx-auto flex"
              style={{ minHeight: 280 }}
            >
              {/* LEFT — section tabs */}
              <div className="w-56 border-r border-gray-100 py-3 shrink-0 bg-gray-50">
                {activeMenu.sections.map((section) => {
                  const active = activeSection?.title === section.title;
                  return (
                    <button
                      key={section.title}
                      onMouseEnter={() => setActiveSection(section)}
                      className={`
                        w-full flex items-center justify-between px-5 py-3 text-sm font-medium
                        transition-all duration-150 text-left
                        ${
                          active
                            ? "bg-white text-primary border-r-2 border-primary"
                            : "text-gray-600 hover:bg-white hover:text-primary"
                        }
                      `}
                    >
                      <span className="flex items-center gap-3">
                        <span>{section.icon}</span>
                        {section.title}
                      </span>
                      <ChevronRight size={13} />
                    </button>
                  );
                })}
              </div>

              {/* RIGHT — items + featured */}
              <AnimatePresence mode="wait">
                {activeSection && (
                  <motion.div
                    key={activeSection.title}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="flex flex-1 gap-10 p-8"
                  >
                    {/* Links grid */}
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5">
                        {activeSection.title}
                      </p>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                        {activeSection.items.map((item) => (
                          <Link
                            key={item.label}
                            to={item.to}
                            onClick={handleClose}
                            className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-gray-600
                              hover:bg-primary hover:text-white transition-all duration-150 font-medium group"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-white shrink-0 transition-colors" />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Featured card */}
                    <div className="w-52 shrink-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5">
                        Featured
                      </p>
                      <Link
                        to={activeMenu.path}
                        onClick={handleClose}
                        className="block rounded-2xl overflow-hidden bg-gray-100 hover:shadow-lg transition-all duration-300 group"
                      >
                        <img
                          src={activeSection.featured.image}
                          alt={activeSection.featured.title}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="p-3">
                          <p className="font-semibold text-sm text-gray-800 leading-snug">
                            {activeSection.featured.title}
                          </p>
                          <p className="text-xs text-primary mt-1 font-semibold">
                            Shop now →
                          </p>
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Navbar;
