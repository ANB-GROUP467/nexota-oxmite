import { motion } from "framer-motion";
import { brands } from "../../data/dummyData";

function Brands() {
  return (
    <section className="py-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black">Top Brands</h2>

          <p className="text-gray-500 mt-2">Trusted by millions worldwide</p>
        </div>
      </div>

      <div
        className="
        grid
        grid-cols-2
        md:grid-cols-4
        lg:grid-cols-7
        gap-5
        "
      >
        {brands.map((brand, index) => (
          <motion.div
            key={brand}
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{ once: true }}
            transition={{
              delay: index * 0.05,
            }}
            whileHover={{
              y: -8,
              scale: 1.03,
            }}
            className="
            bg-white
            rounded-3xl
            h-28
            flex
            items-center
            justify-center
            shadow-sm
            border
            border-gray-100
            hover:shadow-2xl
            transition-all
            cursor-pointer
            font-bold
            text-lg
            "
          >
            {brand}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default Brands;
