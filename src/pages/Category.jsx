import { useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ProductCard from "../components/ui/ProductCard";
import { products } from "../data/dummyData";
import { useMemo, useState } from "react";

// Derive unique brands from product data dynamically
function getBrands(slug) {
  return [
    ...new Set(
      products
        .filter((p) => p.category?.toLowerCase() === slug?.toLowerCase())
        .map((p) => p.brand)
        .filter(Boolean),
    ),
  ];
}

function Category() {
  const { slug } = useParams();
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState("featured");

  const brands = useMemo(() => getBrands(slug), [slug]);

  const filteredProducts = useMemo(() => {
    let data = products.filter(
      (product) => product.category?.toLowerCase() === slug?.toLowerCase(),
    );

    if (selectedBrand) {
      data = data.filter(
        (product) =>
          product.brand?.toLowerCase() === selectedBrand.toLowerCase(),
      );
    }

    if (selectedRating > 0) {
      data = data.filter((product) => Number(product.rating) >= selectedRating);
    }

    data = data.filter((product) => Number(product.price) <= maxPrice);

    if (sortBy === "low-high") {
      data = [...data].sort((a, b) => a.price - b.price);
    } else if (sortBy === "high-low") {
      data = [...data].sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      data = [...data].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "newest") {
      data = [...data].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    }

    return data;
  }, [slug, selectedBrand, selectedRating, maxPrice, sortBy]);

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4 capitalize">
          Home / {slug}
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold capitalize mb-8">{slug}</h1>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Filters</h2>
                <button
                  onClick={() => {
                    setSelectedBrand("");
                    setSelectedRating(0);
                    setMaxPrice(5000);
                  }}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Reset all
                </button>
              </div>

              <div className="space-y-6">
                {/* Brand Filter */}
                <div>
                  <h3 className="font-semibold mb-2">Brand</h3>

                  <label className="flex items-center gap-2 cursor-pointer mb-1">
                    <input
                      type="radio"
                      name="brand"
                      checked={selectedBrand === ""}
                      onChange={() => setSelectedBrand("")}
                    />
                    <span>All</span>
                  </label>

                  {brands.map((brand) => (
                    <label
                      key={brand}
                      className="flex items-center gap-2 cursor-pointer mb-1"
                    >
                      <input
                        type="radio"
                        name="brand"
                        checked={selectedBrand === brand}
                        onChange={() => setSelectedBrand(brand)}
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>

                {/* Rating Filter */}
                <div>
                  <h3 className="font-semibold mb-2">Min. Rating</h3>

                  {[0, 3, 4].map((rating) => (
                    <label
                      key={rating}
                      className="flex items-center gap-2 cursor-pointer mb-1"
                    >
                      <input
                        type="radio"
                        name="rating"
                        checked={selectedRating === rating}
                        onChange={() => setSelectedRating(rating)}
                      />
                      <span>{rating === 0 ? "All" : `${rating}★ & Above`}</span>
                    </label>
                  ))}
                </div>

                {/* Price Filter */}
                <div>
                  <h3 className="font-semibold mb-2">
                    Max Price:{" "}
                    <span className="text-blue-600 font-bold">${maxPrice}</span>
                  </h3>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="50"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>$0</span>
                    <span>$5000</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Products */}
          <section className="lg:col-span-3">
            {/* Sort Bar */}
            <div className="bg-white rounded-xl p-4 mb-6 flex justify-between items-center shadow-sm">
              <p className="text-sm text-gray-600">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "Product" : "Products"}
              </p>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded-lg px-4 py-2 outline-none text-sm focus:ring-2 focus:ring-blue-200"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="low-high">Price: Low → High</option>
                <option value="high-low">Price: High → Low</option>
                <option value="rating">Best Rating</option>
              </select>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl p-10 text-center shadow-sm text-gray-500">
                No products found matching your filters.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </MainLayout>
  );
}

export default Category;
