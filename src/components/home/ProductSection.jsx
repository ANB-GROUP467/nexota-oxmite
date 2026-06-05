import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "../ui/ProductCard";
import { products } from "../../data/dummyData";

// ✅ FIX: Kitne products ek baar dikhane hain
const PAGE_SIZE = 8;

// ✅ PERF: Variants object component ke bahar — har render pe naya object nahi banega
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: "easeOut" },
  }),
};

function ProductSection() {
  const [visible, setVisible] = useState(PAGE_SIZE);

  // ✅ PERF: useMemo — sirf tab re-compute ho jab "visible" change ho
  const displayedProducts = useMemo(
    () => products.slice(0, visible),
    [visible],
  );

  const hasMore = visible < products.length;

  return (
    <section className="py-14">
      <div className="mb-8">
        <h2 className="text-3xl font-black">Best Deals</h2>
        <p className="text-gray-500 mt-2">Handpicked offers just for you</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedProducts.map((product, index) =>
          // ✅ PERF: Sirf pehle PAGE_SIZE cards animate honge, baaki plain div
          index < PAGE_SIZE ? (
            <motion.div
              key={product.id}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              // ❌ whileInView HATA DIYA — yeh har scroll pe re-render trigger karta tha
            >
              <ProductCard product={product} />
            </motion.div>
          ) : (
            // ✅ Baad wale cards — plain div, zero animation overhead
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ),
        )}
      </div>

      {/* ✅ FIX: Load More button — saare products ek saath mat dikhao */}
      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="px-8 py-3 bg-[#FEEE00] hover:bg-yellow-300
              font-bold rounded-2xl transition-colors text-sm shadow-sm"
          >
            Load More Products
          </button>
        </div>
      )}
    </section>
  );
}

export default ProductSection;
