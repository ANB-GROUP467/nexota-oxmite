import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";

function Brands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data } = await api.get("/brands");

        console.log("Brands API Response:", data);

        setBrands(data.brands || []);
      } catch (error) {
        console.error("Brands Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  if (loading) {
    return (
      <section className="py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black">Top Brands</h2>
            <p className="text-gray-500 mt-2">Loading brands...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black">Top Brands</h2>
          <p className="text-gray-500 mt-2">Trusted by millions worldwide</p>
        </div>
      </div>

      {brands.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          No brands found.
        </div>
      ) : (
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
              key={brand._id}
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
              {brand.name}
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Brands;
