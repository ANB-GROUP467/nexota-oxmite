import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { categories } from "../../data/dummyData";

function Categories() {
  return (
    <section className="py-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2
            className="
            text-3xl
            font-black
            text-gray-900
            "
          >
            Shop By Category
          </h2>

          <p
            className="
            text-gray-500
            mt-2
            "
          >
            Discover trending categories
          </p>
        </div>

        <button
          className="
          hidden
          md:block
          text-[#F59E0B]
          font-semibold
          "
        >
          View All
        </button>
      </div>

      <div
        className="
        grid
        grid-cols-2
        md:grid-cols-3
        lg:grid-cols-6
        gap-5
        "
      >
        {categories.map((item, index) => (
          <motion.div
            key={item.id}
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
            whileHover={{
              y: -10,
              scale: 1.03,
            }}
          >
            <Link
              to={`/category/${item.name.toLowerCase()}`}
              className="
                group
                relative
                block
                overflow-hidden
                rounded-3xl
                bg-white
                border
                border-gray-100
                p-6
                shadow-sm
                hover:shadow-2xl
                transition-all
                duration-500
              "
            >
              {/* Glow */}
              <div
                className="
                absolute
                inset-0
                opacity-0
                group-hover:opacity-100
                transition-opacity
                duration-500
                bg-gradient-to-br
                from-yellow-100
                via-transparent
                to-orange-100
                "
              />

              {/* Floating Circle */}
              <div
                className="
                absolute
                -top-10
                -right-10
                w-24
                h-24
                rounded-full
                bg-yellow-100
                blur-2xl
                opacity-0
                group-hover:opacity-100
                transition-all
                duration-500
                "
              />

              <div
                className="
                relative
                z-10
                "
              >
                <motion.div
                  whileHover={{
                    rotate: 8,
                    scale: 1.15,
                  }}
                  className="
                  text-5xl
                  flex
                  justify-center
                  "
                >
                  {item.icon}
                </motion.div>

                <h3
                  className="
                  mt-5
                  text-center
                  font-bold
                  text-gray-800
                  group-hover:text-[#F59E0B]
                  transition-colors
                  "
                >
                  {item.name}
                </h3>

                <p
                  className="
                  mt-2
                  text-xs
                  text-center
                  text-gray-500
                  "
                >
                  Explore Now
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default Categories;
