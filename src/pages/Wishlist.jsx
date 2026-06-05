import { motion } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import useWishlistStore from "../store/useWishlistStore";
import ProductCard from "../components/ui/ProductCard";
import { Link } from "react-router-dom";

function Wishlist() {
  const { wishlist } = useWishlistStore();

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-black text-gray-900">
            My Wishlist
          </h1>

          <p className="mt-3 text-gray-500">
            {wishlist.length} saved product
            {wishlist.length !== 1 ? "s" : ""}
          </p>
        </motion.div>

        {/* Empty State */}
        {wishlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
            <div className="text-7xl mb-6">❤️</div>

            <h2 className="text-3xl font-bold text-gray-900">
              Your wishlist is empty
            </h2>

            <p className="text-gray-500 mt-4 max-w-md mx-auto">
              Save products you love and come back later to purchase them.
            </p>

            <Link to="/">
              <button
                className="
      mt-8
      bg-[#015df0]
      hover:bg-[#0A4CD6]
      text-white
      px-8
      py-4
      rounded-2xl
      font-semibold
      transition-all
    "
              >
                Continue Shopping
              </button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Wishlist Grid */}
            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4
                gap-6
              "
            >
              {wishlist.map((product, index) => (
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
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default Wishlist;
