import { useMemo, useState } from "react";
import { Search as SearchIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import MainLayout from "../layouts/MainLayout";
import ProductCard from "../components/ui/ProductCard";
import { products } from "../data/dummyData";

function Search() {
  const [query, setQuery] = useState("");

  const trendingSearches = [
    "iPhone",
    "Gaming",
    "Laptop",
    "Samsung",
    "Headphones",
    "PlayStation",
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query]);

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black">Search Products</h1>

          <p className="mt-3 text-gray-500">Find products instantly</p>
        </motion.div>

        {/* Search Input */}
        <div className="relative mb-6">
          <SearchIcon
            size={20}
            className="
              absolute
              left-5
              top-1/2
              -translate-y-1/2
              text-gray-400
            "
          />

          <input
            type="text"
            placeholder="Search for products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="
              w-full
              h-14
              pl-14
              pr-5
              rounded-2xl
              border
              border-gray-200
              bg-white
              shadow-sm
              outline-none
              focus:border-[#F59E0B]
              focus:ring-4
              focus:ring-yellow-100
              transition-all
            "
          />
        </div>

        {/* Trending Searches */}
        {!query && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-[#F59E0B]" />

              <h2 className="font-bold">Trending Searches</h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {trendingSearches.map((item) => (
                <button
                  key={item}
                  onClick={() => setQuery(item)}
                  className="
                    px-4
                    py-2
                    bg-white
                    rounded-full
                    border
                    hover:border-[#F59E0B]
                    hover:text-[#F59E0B]
                    transition-all
                  "
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-8">
          <p className="text-gray-500">
            {filteredProducts.length} product
            {filteredProducts.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {filteredProducts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="
                bg-white
                rounded-3xl
                p-16
                text-center
                shadow-sm
                border
                border-gray-100
              "
            >
              <div className="text-7xl mb-6">🔍</div>

              <h2 className="text-3xl font-bold">No products found</h2>

              <p className="mt-4 text-gray-500">
                Try a different keyword or browse categories.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4
                gap-6
              "
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    delay: index * 0.05,
                  }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}

export default Search;
