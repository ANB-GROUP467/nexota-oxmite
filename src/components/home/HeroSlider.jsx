import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { motion } from "framer-motion";
import { ArrowRight, Tag, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { banners } from "../../data/dummyData";

// ─── Slide meta ───────────────────────────────────────────────────────────────
// viewAllPath = us slide ki category ke saare products
const SLIDE_META = [
  {
    badge: "New Arrival",
    subtitle: "Experience next-gen performance with the latest tech",
    cta: "Shop Mobiles",
    ctaPath: "/category/mobiles",
    viewAllPath: "/products?category=mobiles", // ← sirf mobiles
    tag: "Up to 30% Off",
    accent: "from-[#015df0]/80 via-[#0D1B3E]/50",
  },
  {
    badge: "Hot Deals 🔥",
    subtitle: "Unbeatable prices on top gaming gear",
    cta: "Shop Gaming",
    ctaPath: "/category/gaming",
    viewAllPath: "/products?category=gaming", // ← sirf gaming
    tag: "Limited Time",
    accent: "from-black/80 via-black/40",
  },
  {
    badge: "Best Sellers",
    subtitle: "Premium laptops for work & play",
    cta: "Shop Laptops",
    ctaPath: "/category/laptops",
    viewAllPath: "/products?category=laptops", // ← sirf laptops
    tag: "Free Delivery",
    accent: "from-[#0D1B3E]/85 via-[#0D1B3E]/40",
  },
];

function HeroSlider() {
  const navigate = useNavigate();
  // Active slide track karne ke liye ref
  const activeIndexRef = useRef(0);

  return (
    <section className="relative py-2 sm:py-4 px-2 sm:px-0">
      {/* Ambient glow — desktop only */}
      <div
        className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2
        w-[700px] h-[350px] bg-[#015df0]/15 blur-[140px] rounded-full -z-10 pointer-events-none"
      />

      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        slidesPerView={1}
        loop
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{
          clickable: true,
          bulletClass: "swiper-bullet",
          bulletActiveClass: "swiper-bullet-active",
        }}
        navigation={{
          prevEl: ".hero-prev",
          nextEl: ".hero-next",
        }}
        // Real index track karna loop mode mein
        onSlideChange={(swiper) => {
          activeIndexRef.current = swiper.realIndex;
        }}
        className="rounded-2xl sm:rounded-3xl overflow-hidden"
      >
        {banners.map((banner, i) => {
          const meta = SLIDE_META[i % SLIDE_META.length];
          return (
            <SwiperSlide key={banner.id}>
              <div className="relative h-[220px] xs:h-[260px] sm:h-[380px] md:h-[460px] lg:h-[520px] overflow-hidden">
                {/* Bg image */}
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover object-center scale-[1.03]
                    transition-transform duration-[8000ms]"
                />

                {/* Gradient overlays */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${meta.accent} to-transparent`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Main content */}
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center"
                >
                  <div className="w-full max-w-[560px] px-4 sm:px-8 md:px-12 text-white">
                    {/* Badge */}
                    <motion.span
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="hidden xs:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                        bg-white/15 backdrop-blur-md text-[10px] sm:text-xs font-semibold
                        border border-white/20 mb-2 sm:mb-4"
                    >
                      <Tag size={10} />
                      {meta.badge}
                    </motion.span>

                    {/* Title */}
                    <motion.h1
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-xl xs:text-2xl sm:text-4xl md:text-5xl lg:text-6xl
                        font-black leading-tight tracking-tight"
                    >
                      {banner.title}
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="hidden sm:block mt-2 md:mt-3 text-white/80
                        text-xs sm:text-sm md:text-base leading-relaxed max-w-xs md:max-w-sm"
                    >
                      {meta.subtitle}
                    </motion.p>

                    {/* CTA buttons */}
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-4 sm:mt-6 md:mt-7 flex items-center gap-2 sm:gap-3 flex-wrap"
                    >
                      {/* Primary CTA */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(meta.ctaPath)}
                        className="flex items-center gap-1.5 sm:gap-2 bg-[#015df0] hover:bg-[#0148c0]
                          text-white font-bold
                          px-4 py-2.5 sm:px-6 sm:py-3 md:px-7 md:py-3.5
                          rounded-xl sm:rounded-2xl shadow-lg shadow-blue-900/40
                          transition-colors text-xs sm:text-sm"
                      >
                        {meta.cta}
                        <ArrowRight size={13} className="sm:w-4 sm:h-4" />
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Floating offer card — lg+ only */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 3.5,
                    ease: "easeInOut",
                  }}
                  className="hidden lg:block absolute bottom-8 right-8 cursor-pointer"
                  onClick={() => navigate(meta.ctaPath)}
                >
                  <div
                    className="bg-white/95 backdrop-blur-xl px-5 py-4 rounded-2xl
                    shadow-2xl border border-white/50 min-w-[180px] hover:shadow-blue-200/50 transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <span className="text-xl">🎁</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {meta.tag}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          On selected items
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "68%" }}
                        transition={{
                          delay: 0.8,
                          duration: 1.2,
                          ease: "easeOut",
                        }}
                        className="h-full bg-[#015df0] rounded-full"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      68% claimed · Tap to shop
                    </p>
                  </div>
                </motion.div>

                {/* Slide counter */}
                <div
                  className="hidden sm:flex absolute top-4 right-4 bg-black/30 backdrop-blur-sm
                  text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20"
                >
                  {i + 1} / {banners.length}
                </div>
              </div>
            </SwiperSlide>
          );
        })}

        {/* Nav arrows */}
        <button
          className="hero-prev hidden sm:flex absolute left-3 md:left-4 top-1/2
          -translate-y-1/2 z-10 w-9 h-9 md:w-10 md:h-10 rounded-xl
          bg-white/20 hover:bg-white/40 backdrop-blur-sm border border-white/30
          text-white items-center justify-center transition-all duration-200 hover:scale-110"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          className="hero-next hidden sm:flex absolute right-3 md:right-4 top-1/2
          -translate-y-1/2 z-10 w-9 h-9 md:w-10 md:h-10 rounded-xl
          bg-white/20 hover:bg-white/40 backdrop-blur-sm border border-white/30
          text-white items-center justify-center transition-all duration-200 hover:scale-110"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </Swiper>

      <style>{`
        .swiper-bullet {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.4);
          margin: 0 3px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .swiper-bullet-active { width: 22px; background: #015df0; }
        .swiper-pagination { bottom: 10px !important; }
        @media (min-width: 640px) {
          .swiper-bullet { width: 8px; height: 8px; }
          .swiper-bullet-active { width: 26px; }
          .swiper-pagination { bottom: 14px !important; }
        }
      `}</style>
    </section>
  );
}

export default HeroSlider;
