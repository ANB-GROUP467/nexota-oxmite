import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Gamepad2,
  Headphones,
  Laptop,
  Monitor,
  Plug,
  ShoppingBag,
  Smartphone,
  TabletSmartphone,
  Watch,
} from "lucide-react";
import api from "../../services/api";

const BRAND_BLUE = "#015DF0";
const BRAND_NAVY = "#0D1B3E";
const BRAND_YELLOW = "#FEEE00";

const BG_COLORS = [
  "from-blue-50 to-indigo-100",
  "from-yellow-50 to-amber-100",
  "from-emerald-50 to-green-100",
  "from-sky-50 to-cyan-100",
  "from-slate-50 to-blue-100",
  "from-rose-50 to-pink-100",
];

const getList = (response, keys = []) => {
  if (Array.isArray(response)) return response;

  for (const key of keys) {
    const value = response?.[key];
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
  }

  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  if (value.$oid) return String(value.$oid);
  return "";
};

const getName = (value) => value?.name || value?.title || "Untitled";

const getCategoryPath = (category) =>
  `/category/${encodeURIComponent(category.slug || getId(category))}`;

const getIcon = (slug = "") => {
  const text = slug.toLowerCase();

  if (text.includes("mobile") || text.includes("phone")) return Smartphone;
  if (text.includes("laptop") || text.includes("macbook")) return Laptop;
  if (text.includes("gaming")) return Gamepad2;
  if (text.includes("audio") || text.includes("headphone")) return Headphones;
  if (text.includes("camera")) return Monitor;
  if (text.includes("tablet")) return TabletSmartphone;
  if (text.includes("tv")) return Monitor;
  if (text.includes("wear")) return Watch;
  if (text.includes("accessor") || text.includes("charger")) return Plug;

  return ShoppingBag;
};

function CategorySkeleton() {
  return (
    <div className="h-34 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:h-40">
      <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-slate-100" />
      <div className="mx-auto mt-4 h-4 w-24 animate-pulse rounded-full bg-slate-100" />
      <div className="mx-auto mt-2 h-3 w-16 animate-pulse rounded-full bg-slate-100" />
    </div>
  );
}

function Categories() {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      try {
        const [categoryRes, subCategoryRes] = await Promise.all([
          api.get("/categories"),
          api.get("/subcategories").catch(() => ({ data: [] })),
        ]);

        if (!mounted) return;

        const categoryList = getList(categoryRes.data, ["categories", "data"]);
        const subCategoryList = getList(subCategoryRes.data, [
          "subCategories",
          "subcategories",
          "data",
        ]);

        setCategories(
          categoryList
            .filter((category) => category?.isActive !== false)
            .map((category) => ({
              ...category,
              _id: getId(category),
              name: getName(category),
              slug: category.slug || getId(category),
            })),
        );

        setSubCategories(
          subCategoryList
            .filter((subCategory) => subCategory?.isActive !== false)
            .filter((subCategory) => getId(subCategory.category)),
        );
      } catch (error) {
        if (!mounted) return;
        console.error("Categories:", error.message);
        setCategories([]);
        setSubCategories([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  const categoryCards = useMemo(() => {
    return categories.map((category) => {
      const count = subCategories.filter((subCategory) => {
        return getId(subCategory.category) === getId(category);
      }).length;

      return {
        ...category,
        subCategoryCount: count,
      };
    });
  }, [categories, subCategories]);

  return (
    <section className="py-10 sm:py-14">
      <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div className="min-w-0">
          <div
            className="mb-3 h-1 w-8 rounded-full"
            style={{ backgroundColor: BRAND_BLUE }}
          />
          <h2
            className="text-2xl font-black tracking-tight sm:text-3xl"
            style={{ color: BRAND_NAVY }}
          >
            Shop By Category
          </h2>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Discover trending categories and sub-categories
          </p>
        </div>

        <Link
          to="/products"
          className="hidden shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition hover:bg-blue-50 sm:inline-flex"
          style={{ color: BRAND_BLUE }}
        >
          View All <ArrowRight size={14} />
        </Link>
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <CategorySkeleton key={index} />
          ))}
        </div>
      )}

      {!loading && categoryCards.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-400">
          No categories found.
        </div>
      )}

      {!loading && categoryCards.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-6">
          {categoryCards.map((item, index) => {
            const Icon = getIcon(item.slug);

            return (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.04, duration: 0.28 }}
              >
                <Link
                  to={getCategoryPath(item)}
                  className={`group relative flex h-36 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br ${
                    BG_COLORS[index % BG_COLORS.length]
                  } p-4 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:h-40 sm:p-5`}
                >
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/45 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div
                    className="relative z-10 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 sm:h-16 sm:w-16"
                    style={{
                      borderBottom: `3px solid ${BRAND_YELLOW}`,
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Icon size={28} style={{ color: BRAND_BLUE }} />
                    )}
                  </div>

                  <h3 className="relative z-10 mt-3 line-clamp-2 text-sm font-extrabold leading-tight text-slate-800 transition-colors group-hover:text-[#0D1B3E] sm:text-base">
                    {item.name}
                  </h3>

                  <p className="relative z-10 mt-1 text-[11px] font-bold text-slate-500">
                    {item.subCategoryCount > 0
                      ? `${item.subCategoryCount} sub-categories`
                      : "Explore"}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && categoryCards.length > 0 && (
        <div className="mt-5 flex justify-center sm:hidden">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 rounded-xl border px-5 py-2.5 text-sm font-bold transition hover:shadow-md"
            style={{ color: BRAND_BLUE, borderColor: BRAND_BLUE }}
          >
            View All Categories <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </section>
  );
}

export default Categories;
