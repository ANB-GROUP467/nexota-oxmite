import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules"; // ✅ Pagination HATA DIYA

import "swiper/css";
import "swiper/css/navigation";
// ✅ pagination css import bhi hata diya

import ProductCard from "../ui/ProductCard";
import { products } from "../../data/dummyData";

// ✅ PERF: Variants bahar nikale
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" },
  }),
};

function ProductCarousel({
  title = "Trending Products",
  subtitle = "Discover our best sellers",
  data = products,
}) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <section className="py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900">{title}</h2>
          <p className="text-gray-500 mt-2">{subtitle}</p>
        </div>

        {/* Arrows */}
        <div className="hidden md:flex gap-3">
          <button
            ref={prevRef}
            className="w-11 h-11 rounded-full bg-white border shadow-sm
            hover:shadow-lg transition-all flex items-center justify-center"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            ref={nextRef}
            className="w-11 h-11 rounded-full bg-white border shadow-sm
            hover:shadow-lg transition-all flex items-center justify-center"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <Swiper
        modules={[Navigation, Autoplay]} // ✅ Pagination module removed
        spaceBetween={24}
        loop
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
        }}
        // ✅ pagination prop completely hata diya — yahi dots bana raha tha
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onBeforeInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        breakpoints={{
          320: { slidesPerView: 1.2 },
          480: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
          1400: { slidesPerView: 5 },
        }}
      >
        {data.map((product, index) => (
          <SwiperSlide key={product.id}>
            <motion.div
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible" // ✅ whileInView HATA DIYA — animate use kiya
            >
              <ProductCard product={product} />
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

export default ProductCarousel;
