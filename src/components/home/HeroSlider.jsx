import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import { motion } from "framer-motion";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { banners } from "../../data/dummyData";

function HeroSlider() {
  return (
    <section className="relative py-4">
      {/* Glow Effect */}
      <div
        className="
        absolute
        top-0
        left-1/2
        -translate-x-1/2
        w-[600px]
        h-[300px]
        bg-yellow-300/20
        blur-[120px]
        rounded-full
        -z-10
        "
      />

      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        slidesPerView={1}
        loop
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        navigation
        className="rounded-3xl overflow-hidden"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div
              className="
              relative
              h-[320px]
              md:h-[500px]
              overflow-hidden
              rounded-3xl
              "
            >
              {/* Image */}
              <img
                src={banner.image}
                alt={banner.title}
                className="
                w-full
                h-full
                object-cover
                scale-105
                "
              />

              {/* Overlay */}
              <div
                className="
                absolute
                inset-0
                bg-gradient-to-r
                from-black/70
                via-black/30
                to-transparent
                "
              />

              {/* Content */}
              <motion.div
                initial={{
                  opacity: 0,
                  x: -40,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: 0.8,
                }}
                className="
                absolute
                inset-0
                flex
                items-center
                "
              >
                <div
                  className="
                  max-w-[600px]
                  px-8
                  md:px-14
                  text-white
                  "
                >
                  <span
                    className="
                    inline-flex
                    items-center
                    px-4
                    py-2
                    rounded-full
                    bg-white/10
                    backdrop-blur-md
                    text-sm
                    mb-4
                    "
                  >
                    New Collection
                  </span>

                  <h1
                    className="
                    text-4xl
                    md:text-6xl
                    font-black
                    leading-tight
                    "
                  >
                    {banner.title}
                  </h1>

                  <p
                    className="
                    mt-4
                    text-gray-200
                    text-sm
                    md:text-lg
                    "
                  >
                    Discover premium products, unbeatable deals and latest
                    technology.
                  </p>

                  <motion.button
                    whileHover={{
                      scale: 1.05,
                    }}
                    whileTap={{
                      scale: 0.95,
                    }}
                    className="
                    mt-8
                    bg-[#015df0]
                    text-black
                    font-bold
                    px-8
                    py-4
                    rounded-2xl
                    shadow-xl
                    "
                  >
                    Shop Now
                  </motion.button>
                </div>
              </motion.div>

              {/* Floating Card */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                }}
                className="
                hidden
                lg:flex
                absolute
                bottom-8
                right-8
                bg-white/90
                backdrop-blur-xl
                p-5
                rounded-2xl
                shadow-2xl
                "
              >
                <div>
                  <h3
                    className="
                    font-bold
                    text-gray-900
                    "
                  >
                    Limited Offer
                  </h3>

                  <p
                    className="
                    text-gray-500
                    text-sm
                    "
                  >
                    Up to 50% Off
                  </p>
                </div>
              </motion.div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

export default HeroSlider;
