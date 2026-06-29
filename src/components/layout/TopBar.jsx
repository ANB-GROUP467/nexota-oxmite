import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const BRAND_BLUE = "#015DF0";

const messages = [
  {
    icon: (
      <svg
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 5v3h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    text: "Free Delivery on orders over QAR 200",
  },
  {
    icon: (
      <svg
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    text: "Secure Checkout & Easy 15-day Returns",
  },
  {
    icon: (
      <svg
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    text: "Top Brands. Best Prices. Every Day.",
  },
];

function TopBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-gradient-to-r from-black via-gray-900 to-black text-white text-xs sm:text-sm overflow-hidden"
    >
      <div className="max-w-[1600px] mx-auto px-4 h-9 sm:h-10 flex items-center justify-between gap-4">
        {/* Left — rotating message (mobile: full width centered, desktop: left) */}
        <div className="flex-1 overflow-hidden flex items-center justify-center sm:justify-start">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <span style={{ color: BRAND_BLUE }}>{messages[index].icon}</span>
              <span className="text-gray-300 font-medium">
                {messages[index].text}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right — links (desktop only) */}
        <div className="hidden md:flex items-center gap-5 shrink-0">
          {["Track Order", "Help Center", "Sell on Nexota"].map((label) => (
            <a
              key={label}
              href="#"
              className="text-gray-500 hover:text-white transition-colors duration-150 text-xs font-medium"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Dot indicators — mobile only */}
        <div className="flex sm:hidden items-center gap-1 shrink-0">
          {messages.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="w-1.5 h-1.5 rounded-full transition-all duration-200"
              style={{ backgroundColor: i === index ? BRAND_BLUE : "#4b5563" }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default TopBar;
