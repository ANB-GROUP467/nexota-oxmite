import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import useCartStore from "../../store/useCartStore";
import useWishlistStore from "../../store/useWishlistStore";

const formatQAR = (amount) =>
  `QAR ${Number(amount).toLocaleString("en-QA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function ProductCard({ product }) {
  const { items, addToCart, removeFromCart } = useCartStore();
  const { wishlist, addWishlist, removeWishlist } = useWishlistStore();

  const isWishlisted = wishlist.some((item) => item.id === product.id);

  const isInCart = items.some((item) => item.id === product.id);

  const discount =
    product.oldPrice && product.price
      ? Math.round(
          ((product.oldPrice - product.price) / product.oldPrice) * 100,
        )
      : 0;

  const handleWishlist = () => {
    if (isWishlisted) {
      removeWishlist(product.id);
    } else {
      addWishlist(product);
    }
  };

  return (
    <motion.div
      layout
      whileHover={{
        y: -8,
      }}
      transition={{
        duration: 0.25,
      }}
      className="
      group
      bg-white
      rounded-3xl
      
      overflow-hidden
      border
      border-gray-100
      shadow-sm
      hover:shadow-2xl
      transition-all
      duration-500
      "
    >
      {/* Image Area */}
      <div className="relative overflow-hidden">
        {/* Discount Badge */}
        {discount > 0 && (
          <div
            className="
            absolute
            top-3
            left-3
            z-20
            bg-red-500
            text-white
            text-xs
            font-bold
            px-3
            py-1
            rounded-full
            "
          >
            -{discount}%
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="
          absolute
          top-3
          right-3
          z-20
          w-10
          h-10
          rounded-full
          bg-white
          shadow-md
          flex
          items-center
          justify-center
          "
        >
          <Heart
            size={18}
            className={
              isWishlisted ? "fill-yellow-500 text-yellow-500" : "text-gray-600"
            }
          />
        </button>

        <Link
          to={`/product/${product.title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <div className="overflow-hidden">
            <motion.img
              whileHover={{
                scale: 1.08,
              }}
              transition={{
                duration: 0.4,
              }}
              src={product.image}
              alt={product.title}
              className="
              w-full
              h-60
              object-cover
              "
            />
          </div>
        </Link>

        {/* Hover Overlay */}
        <div
          className="
          absolute
          inset-0
          bg-black/20
          opacity-0
          group-hover:opacity-100
          transition-opacity
          duration-300
          "
        />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <Link
          to={`/product/${product.title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <h3
            className="
            font-semibold
            text-gray-900
            line-clamp-2
            min-h-[48px]
            hover:text-[#015DF0]
            transition-colors
            "
          >
            {product.title}
          </h3>
        </Link>

        {/* Rating */}
        <div
          className="
          flex
          items-center
          gap-2
          mt-3
          "
        >
          <div
            className="
            flex
            items-center
            gap-1
            text-yellow-500
            "
          >
            <Star size={16} fill="currentColor" />

            <span className="font-medium">{product.rating}</span>
          </div>

          <span
            className="
            text-xs
            text-gray-400
            "
          >
            (120 Reviews)
          </span>
        </div>

        {/* Price */}
        <div
          className="
          flex
          items-center
          gap-3
          mt-4
          "
        >
          <div className="flex items-center gap-3 mt-4">
            <span className="text-2xl font-black text-[#015DF0]">
              {formatQAR(product.price)}
            </span>

            {product.oldPrice && (
              <span className="line-through text-gray-400">
                {formatQAR(product.oldPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Stock */}
        <div
          className="
          mt-2
          text-xs
          text-green-600
          font-medium
          "
        >
          In Stock
        </div>

        {/* Button */}

        <motion.button
          whileTap={{
            scale: 0.95,
          }}
          onClick={() => {
            if (isInCart) {
              removeFromCart(product.id);
            } else {
              addToCart(product);
            }
          }}
          className={`
    w-full
    mt-5
    flex
    items-center
    justify-center
    gap-2
    text-white
    font-semibold
    py-3
    rounded-2xl
    transition-all
    duration-300
    ${
      isInCart
        ? "bg-yellow-500 hover:bg-red-600"
        : "bg-[#015DF0] hover:bg-[#0A4CD6]"
    }
  `}
        >
          <ShoppingCart size={18} />

          {isInCart ? "Remove From Cart" : "Add To Cart"}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default ProductCard;
