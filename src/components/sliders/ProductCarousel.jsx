// ProductCarousel.jsx
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { Link } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import ProductCard from "../ui/ProductCard";
import api from "../../services/api";

const BRAND_BLUE = "#015DF0";
const BRAND_NAVY = "#0D1B3E";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" },
  }),
};

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white border border-slate-100 overflow-hidden">
      <div className="p-2 sm:p-3">
        <div className="aspect-square w-full bg-slate-100 animate-pulse rounded-lg" />
      </div>
      <div className="p-2 pt-1.5 sm:p-3 sm:pt-2 space-y-1.5">
        <div className="h-2.5 bg-slate-100 animate-pulse rounded-full w-1/3" />
        <div className="h-3 bg-slate-100 animate-pulse rounded-full w-full" />
        <div className="h-3 bg-slate-100 animate-pulse rounded-full w-2/3" />
        <div className="h-4 bg-slate-100 animate-pulse rounded-full w-1/3 mt-1" />
      </div>
    </div>
  );
}

function ProductCarousel({
  title = "Trending Products",
  subtitle = "Discover our best sellers",
  viewAllTo = "/products",
  accentColor = BRAND_BLUE,
  data = null,
}) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [products, setProducts] = useState(data || []);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (data) {
      setProducts(data);
      return;
    }

    api
      .get("/products")
      .then(({ data: res }) => setProducts(res.products || []))
      .catch((err) => console.error("Carousel fetch error:", err))
      .finally(() => setLoading(false));
  }, [data]);

  return (
    <section className="py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-4 sm:mb-6 gap-4">
        <div>
          {/* Accent line */}
          <div
            className="w-8 h-1 rounded-full mb-3"
            style={{ backgroundColor: accentColor }}
          />
          <h2
            className="text-2xl sm:text-3xl font-black tracking-tight"
            style={{ color: BRAND_NAVY }}
          >
            {title}
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* View all — desktop */}
          <Link
            to={viewAllTo}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold transition hover:underline"
            style={{ color: accentColor }}
          >
            View All <ArrowRight size={14} />
          </Link>

          {/* Nav buttons */}
          <div className="hidden md:flex gap-2">
            <button
              ref={prevRef}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex items-center justify-center text-slate-600"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              ref={nextRef}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex items-center justify-center text-slate-600"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Skeletons */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <svg
            width="40"
            height="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            className="mb-3 opacity-40"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <p className="text-sm font-medium">No products found</p>
        </div>
      )}

      {/* Carousel */}
      {!loading && products.length > 0 && (
        <>
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={16}
            loop={products.length > 4}
            observer={true}
            observeParents={true}
            watchOverflow={true}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            breakpoints={{
              0: { slidesPerView: 1.3, spaceBetween: 12 },
              480: { slidesPerView: 2, spaceBetween: 14 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
              1400: { slidesPerView: 5 },
            }}
            className="!overflow-visible sm:!overflow-hidden"
          >
            {products.map((product, index) => (
              <SwiperSlide key={product._id} className="h-auto">
                <motion.div
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="h-full"
                >
                  <ProductCard product={product} />
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* View all — mobile */}
          <div className="mt-5 flex justify-center sm:hidden">
            <Link
              to={viewAllTo}
              className="inline-flex items-center gap-1.5 text-sm font-bold border rounded-xl px-5 py-2.5 transition hover:shadow-md"
              style={{ color: accentColor, borderColor: accentColor }}
            >
              View All Products <ArrowRight size={14} />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

export default ProductCarousel;
