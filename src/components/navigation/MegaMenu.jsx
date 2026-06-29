import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Sparkles, Tag } from "lucide-react";
import {
  getCategoryPath,
  getId,
  getName,
  getSubCategoryPath,
} from "../../utils/refs";

const BRAND_BLUE = "#015DF0";
const BRAND_NAVY = "#0D1B3E";
const BRAND_YELLOW = "#FEEE00";

// ─── Promo images keyed by category slug ─────────────────────────────────────
const categoryPromo = {
  mobiles: {
    title: "Latest Smartphones",
    subtitle: "iPhone, Samsung & more",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&auto=format&fit=crop",
  },
  laptops: {
    title: "Powerful Laptops",
    subtitle: "Work, gaming and study",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700&auto=format&fit=crop",
  },
  "mobile-accessories": {
    title: "Mobile Essentials",
    subtitle: "Chargers, cases & earbuds",
    image:
      "https://images.unsplash.com/photo-1588599376442-3cbf9c67449e?w=700&auto=format&fit=crop",
  },
  electronics: {
    title: "Top Electronics",
    subtitle: "Gadgets, accessories & more",
    image:
      "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=700&auto=format&fit=crop",
  },
};

const DEFAULT_PROMO_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700&auto=format&fit=crop";

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ─── Brand card ───────────────────────────────────────────────────────────────
function BrandCard({ brand, onClose }) {
  const name = getName(brand);
  const hasLogo =
    brand.logo &&
    typeof brand.logo === "string" &&
    brand.logo.startsWith("http");

  return (
    <Link
      to={`/products?brand=${brand.slug || getId(brand)}`}
      onClick={onClose}
      className="group relative grid h-10 w-[90px] shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white px-2 transition-all duration-200 hover:border-[#015DF0]/50 hover:shadow-lg hover:shadow-blue-100/60 hover:-translate-y-0.5"
    >
      {hasLogo ? (
        <img
          src={brand.logo}
          alt={name}
          className="max-h-5 max-w-full object-contain opacity-60 transition-all duration-200 group-hover:opacity-100 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextSibling.style.display = "block";
          }}
        />
      ) : null}
      <span
        className="line-clamp-1 text-center text-[11px] font-black text-slate-500 transition-colors group-hover:text-[#015DF0]"
        style={{ display: hasLogo ? "none" : "block" }}
      >
        {name}
      </span>
      {/* subtle blue glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 ring-1 ring-[#015DF0]/30 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

// ─── Subcategory link ─────────────────────────────────────────────────────────
function SubCategoryLink({ sub, activeCategory, onClose }) {
  return (
    <Link
      key={getId(sub)}
      to={getSubCategoryPath(activeCategory, sub)}
      onClick={onClose}
      className="group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-bold text-slate-700 transition-all duration-150 hover:bg-blue-50 hover:text-[#015DF0]"
    >
      {sub.image && (
        <img
          src={sub.image}
          alt={getName(sub)}
          className="h-5 w-5 shrink-0 rounded-md object-cover opacity-60 transition group-hover:opacity-100"
        />
      )}
      <span className="truncate">{getName(sub)}</span>
      <ChevronRight
        size={13}
        className="ml-auto shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-[#015DF0]"
      />
    </Link>
  );
}

// ─── MegaMenu ─────────────────────────────────────────────────────────────────
function MegaMenu({
  category,
  categories = [],
  subCategories = [],
  brands = [],
  onClose,
}) {
  const activeCategory = category || categories[0];
  if (!activeCategory) return null;

  const visibleBrands = brands
    .filter((brand) => brand?.isActive !== false)
    .slice(0, 10);

  const slug = activeCategory.slug || "";
  const promo = categoryPromo[slug] || {
    title: getName(activeCategory),
    subtitle: "Explore latest products and deals",
    image: activeCategory.image || DEFAULT_PROMO_IMAGE,
  };

  const ITEMS_PER_COL = 7;
  const MAX_COLS = 3;
  const subCategoryColumns = chunkArray(subCategories, ITEMS_PER_COL).slice(
    0,
    MAX_COLS,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.99 }}
      transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mx-auto w-full max-w-[1588px] px-6"
    >
      <div className="overflow-hidden rounded-b-2xl border border-t-0 border-slate-200/70 bg-white shadow-2xl shadow-slate-900/12">
        <div className="flex">
          {/* ── Left accent strip ── */}
          <div
            className="hidden w-1 shrink-0 xl:block"
            style={{
              background: `linear-gradient(to bottom, ${BRAND_BLUE}, ${BRAND_NAVY})`,
            }}
          />

          {/* ── Sub-category columns ── */}
          <div className="flex min-w-0 flex-1 p-5">
            {subCategories.length === 0 ? (
              <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-10 text-sm font-bold text-slate-400">
                <Tag size={16} className="opacity-50" />
                No sub-categories yet
              </div>
            ) : (
              <div className="flex flex-1 gap-1">
                {subCategoryColumns.map((col, colIdx) => (
                  <div
                    key={colIdx}
                    className="flex flex-1 flex-col min-w-[150px]"
                  >
                    {/* Column heading */}
                    <div className="mb-3 flex items-center gap-2 px-2.5">
                      {colIdx === 0 ? (
                        <>
                          <span
                            className="h-3 w-0.5 rounded-full"
                            style={{ backgroundColor: BRAND_BLUE }}
                          />
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#015DF0]">
                            {getName(activeCategory)}
                          </p>
                        </>
                      ) : (
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-transparent select-none">
                          &nbsp;
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      {col.map((sub) => (
                        <SubCategoryLink
                          key={getId(sub)}
                          sub={sub}
                          activeCategory={activeCategory}
                          onClose={onClose}
                        />
                      ))}
                    </div>

                    {/* "View all" only on last visible column */}
                    {colIdx === subCategoryColumns.length - 1 && (
                      <Link
                        to={getCategoryPath(activeCategory)}
                        onClick={onClose}
                        className="mt-3 flex items-center gap-1 px-2.5 text-xs font-extrabold text-[#015DF0] opacity-80 hover:opacity-100 hover:underline"
                      >
                        View all {getName(activeCategory)}
                        <ArrowRight size={11} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Promo image ── */}
          <div className="hidden w-[185px] shrink-0 p-4 xl:block">
            <Link
              to={getCategoryPath(activeCategory)}
              onClick={onClose}
              className="group block h-full overflow-hidden rounded-xl"
            >
              <div className="relative h-full min-h-[180px]">
                <img
                  src={promo.image}
                  alt={promo.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                {/* dark gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, #0D1B3E 30%, rgba(13,27,62,0.2) 60%, transparent)",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <span
                    className="mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black"
                    style={{ backgroundColor: BRAND_YELLOW, color: BRAND_NAVY }}
                  >
                    <Sparkles size={8} />
                    Featured
                  </span>
                  <h3 className="text-xs font-black leading-snug text-white">
                    {promo.title}
                  </h3>
                  <p className="mt-0.5 text-[10px] font-semibold text-white/60">
                    {promo.subtitle}
                  </p>
                  <span
                    className="mt-2.5 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-black transition-all duration-200 group-hover:gap-2"
                    style={{ backgroundColor: BRAND_BLUE, color: "white" }}
                  >
                    Shop Now <ArrowRight size={9} />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Top Brands row ── */}
        {visibleBrands.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <div className="flex items-center gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex shrink-0 items-center gap-1.5">
                <span
                  className="h-3 w-0.5 rounded-full"
                  style={{ backgroundColor: BRAND_BLUE }}
                />
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Top Brands
                </h3>
              </div>
              <div className="flex gap-2">
                {visibleBrands.map((brand) => (
                  <BrandCard
                    key={getId(brand)}
                    brand={brand}
                    onClose={onClose}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between px-5 py-2.5"
          style={{
            background: `linear-gradient(to right, #f8faff, #f1f5ff)`,
            borderTop: "1px solid #e8edf8",
          }}
        >
          <p className="text-[11px] font-semibold text-slate-400">
            Browse all Nexota categories
          </p>
          <Link
            to="/products"
            onClick={onClose}
            className="flex items-center gap-1 text-[11px] font-extrabold text-[#015DF0] transition-all hover:gap-1.5 hover:underline"
          >
            View All Products <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default MegaMenu;
