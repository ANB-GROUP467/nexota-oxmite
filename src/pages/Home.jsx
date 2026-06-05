import { motion } from "framer-motion";

import HeroSlider from "../components/home/HeroSlider";
import Categories from "../components/home/Categories";
import Brands from "../components/home/Brands";

import ProductSection from "../components/home/ProductSection";

import FlashSale from "../components/deals/FlashSale";
import ProductCarousel from "../components/sliders/ProductCarousel";

import MobileBottomNav from "../components/navigation/MobileBottomNav";

import MainLayout from "../layouts/MainLayout";

function Home() {
  return (
    <MainLayout>
      <div className="relative overflow-hidden">
        {/* Background Glow Effects */}
        <div
          className="
          absolute
          top-0
          left-0
          w-[500px]
          h-[500px]
          bg-yellow-300/10
          rounded-full
          blur-[120px]
          pointer-events-none
          "
        />

        <div
          className="
          absolute
          top-[40%]
          right-0
          w-[400px]
          h-[400px]
          bg-orange-300/10
          rounded-full
          blur-[120px]
          pointer-events-none
          "
        />

        <div className="max-w-[1600px] mx-auto px-4">
          {/* Hero */}
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.5,
            }}
          >
            <HeroSlider />
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
          >
            <Categories />
          </motion.div>

          {/* Promo Banner */}
          <section className="py-6">
            <div
              className="
              relative
              overflow-hidden
              rounded-3xl
              bg-gradient-to-r
              from-yellow-300
              via-[#015df0]
              to-orange-300
              p-10
              shadow-xl
              "
            >
              <div className="max-w-xl">
                <span
                  className="
                  inline-flex
                  px-4
                  py-2
                  rounded-full
                  bg-white/20
                  backdrop-blur-md
                  font-medium
                  "
                >
                  Limited Time Offer
                </span>

                <h2
                  className="
                  mt-4
                  text-4xl
                  md:text-5xl
                  font-black
                  "
                >
                  Save up to 50%
                </h2>

                <p className="mt-3 text-lg">
                  On electronics, gaming and accessories.
                </p>

                <button
                  className="
                  mt-6
                  bg-black
                  text-white
                  px-8
                  py-4
                  rounded-2xl
                  font-semibold
                  hover:scale-105
                  transition-all
                  "
                >
                  Shop Now
                </button>
              </div>
            </div>
          </section>

          {/* Flash Sale */}
          <FlashSale />

          {/* Brands */}
          <Brands />

          {/* Trending */}
          <ProductCarousel
            title="Trending Products"
            subtitle="Most popular products this week"
          />

          {/* Featured Deal Banner */}
          <section className="py-8">
            <div
              className="
              grid
              md:grid-cols-2
              gap-6
              "
            >
              <div
                className="
                rounded-3xl
                bg-gradient-to-br
                from-indigo-500
                to-purple-600
                text-white
                p-8
                min-h-[250px]
                flex
                flex-col
                justify-center
                "
              >
                <h3
                  className="
                  text-3xl
                  font-black
                  "
                >
                  Gaming Collection
                </h3>

                <p className="mt-3">
                  Next generation consoles, accessories and gaming gear.
                </p>
              </div>

              <div
                className="
                rounded-3xl
                bg-gradient-to-br
                from-emerald-500
                to-teal-600
                text-white
                p-8
                min-h-[250px]
                flex
                flex-col
                justify-center
                "
              >
                <h3
                  className="
                  text-3xl
                  font-black
                  "
                >
                  Premium Audio
                </h3>

                <p className="mt-3">
                  Headphones, speakers and studio equipment.
                </p>
              </div>
            </div>
          </section>

          {/* Product Section */}
          <ProductSection />

          {/* Newsletter */}
          <section className="py-16">
            <div
              className="
              bg-white
              rounded-3xl
              shadow-xl
              p-10
              text-center
              "
            >
              <h2
                className="
                text-4xl
                font-black
                "
              >
                Stay Updated
              </h2>

              <p
                className="
                mt-3
                text-gray-500
                "
              >
                Get exclusive deals and offers.
              </p>

              <div
                className="
                mt-8
                flex
                flex-col
                md:flex-row
                gap-4
                max-w-2xl
                mx-auto
                "
              >
                <input
                  placeholder="Enter your email"
                  className="
                  flex-1
                  h-14
                  px-5
                  rounded-2xl
                  border
                  outline-none
                  "
                />

                <button
                  className="
                  bg-[#015df0]
                  px-8
                  rounded-2xl
                  font-bold
                  "
                >
                  Subscribe
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <MobileBottomNav />
    </MainLayout>
  );
}

export default Home;
