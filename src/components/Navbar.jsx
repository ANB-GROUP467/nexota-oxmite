import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import MegaMenu from "./navigation/MegaMenu";
import {
  fetchBrands,
  fetchNavData,
  fetchSubCategories,
  normalizeBrands,
} from "../services/categoryService";
import {
  getCategoryPath,
  getSubCategoryPath,
  matchesSubToCategory,
  normalizeCategory,
  normalizeSubCategory,
} from "../utils/refs";

function NavbarSkeleton() {
  return (
    <div className="border-t border-white/10 bg-[#0D1B3E]">
      <div className="mx-auto flex h-12 max-w-[1600px] items-center gap-3 overflow-hidden px-3 sm:px-4 lg:px-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <span
            key={index}
            className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-white/10"
          />
        ))}
      </div>
    </div>
  );
}

// ─── Core fix: subCategories ko API response se correctly parse karna ─────────
// API returns both "subCategories" and "data" keys — handle both
function parseSubCategories(raw) {
  if (Array.isArray(raw)) return raw;
  // API key preference: subCategories > data > docs
  const list =
    raw?.subCategories ?? raw?.data ?? raw?.docs ?? raw?.subcategories ?? [];
  return Array.isArray(list) ? list : [];
}

function Navbar({ categories: providedCategories, loading: providedLoading }) {
  const location = useLocation();

  const [hoveredSlug, setHoveredSlug] = useState("");
  const [localCategories, setLocalCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);

  const closeTimerRef = useRef(null);

  const scheduleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setHoveredSlug("");
    }, 150);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeMenu = useCallback(() => {
    cancelClose();
    setHoveredSlug("");
  }, [cancelClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const hasProvidedCategories = Array.isArray(providedCategories);

  useEffect(() => {
    let mounted = true;

    const loadNavData = async () => {
      setLocalLoading(true);
      try {
        if (hasProvidedCategories) {
          const [subCategoryRaw, brandList] = await Promise.all([
            fetchSubCategories(),
            fetchBrands(),
          ]);

          if (!mounted) return;

          // Fix: parse correctly then normalize
          const subList = parseSubCategories(subCategoryRaw);
          setSubCategories(subList.map(normalizeSubCategory));
          setBrands(Array.isArray(brandList) ? brandList : []);
        } else {
          const navData = await fetchNavData();

          if (!mounted) return;

          setLocalCategories(
            Array.isArray(navData.categories) ? navData.categories : [],
          );
          const subList = parseSubCategories(navData);
          setSubCategories(subList.map(normalizeSubCategory));
          setBrands(Array.isArray(navData.brands) ? navData.brands : []);
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Navbar load error:", error.message);
        setLocalCategories([]);
        setSubCategories([]);
        setBrands([]);
      } finally {
        if (mounted) setLocalLoading(false);
      }
    };

    loadNavData();

    return () => {
      mounted = false;
    };
  }, [hasProvidedCategories, providedCategories]);

  const categories = useMemo(
    () =>
      (hasProvidedCategories ? providedCategories || [] : localCategories)
        .filter((category) => category?.isActive !== false)
        .map(normalizeCategory)
        .filter((category) => category._id && category.slug),
    [hasProvidedCategories, localCategories, providedCategories],
  );

  const normalizedBrands = useMemo(() => normalizeBrands(brands), [brands]);

  const loading =
    typeof providedLoading === "boolean" ? providedLoading : localLoading;

  const activeCategory = useMemo(
    () => categories.find((category) => category.slug === hoveredSlug),
    [categories, hoveredSlug],
  );

  const routeCategory = useMemo(
    () =>
      categories.find(
        (category) => location.pathname === getCategoryPath(category),
      ),
    [categories, location.pathname],
  );

  const mobileCategory = routeCategory || categories[0];

  // ─── Core fix: match by slug from the populated category object ─────────────
  // API returns subCategory.category as a full object { _id, name, slug }
  // So we can reliably match by slug — most robust approach
  const getCategorySubCategories = useCallback(
    (category) => {
      if (!category) return [];
      const targetSlug = (category.slug || "").toLowerCase().trim();
      const targetId = category._id || "";

      return subCategories.filter((sub) => {
        // Try slug match first (most reliable with populated data)
        const subCatObj = sub._rawCategory || sub.category;
        if (subCatObj && typeof subCatObj === "object") {
          const subSlug = (subCatObj.slug || "").toLowerCase().trim();
          if (subSlug && targetSlug && subSlug === targetSlug) return true;
          const subId = subCatObj._id || subCatObj.id || "";
          if (subId && targetId && subId === targetId) return true;
        }
        // Fallback: normalized fields from normalizeSubCategory
        return matchesSubToCategory(sub, category);
      });
    },
    [subCategories],
  );

  const activeSubCategories = useMemo(
    () => getCategorySubCategories(activeCategory),
    [activeCategory, getCategorySubCategories],
  );

  const mobileSubCategories = useMemo(
    () => getCategorySubCategories(mobileCategory),
    [mobileCategory, getCategorySubCategories],
  );

  const isCategoryActive = useCallback(
    (category) => {
      const path = getCategoryPath(category);
      return (
        location.pathname === path || location.pathname.startsWith(`${path}/`)
      );
    },
    [location.pathname],
  );

  if (loading) return <NavbarSkeleton />;

  return (
    <>
      {/* ════ Desktop Navbar ════ */}
      <div
        className="relative z-[100] hidden border-t border-white/10 bg-[#0D1B3E] lg:block"
        onMouseLeave={scheduleClose}
        onMouseEnter={cancelClose}
      >
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="flex h-14 items-center gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => {
              const active = isCategoryActive(category);
              const hovered = hoveredSlug === category.slug;

              return (
                <div
                  key={category._id}
                  className="relative flex h-full shrink-0 items-center"
                  onMouseEnter={() => {
                    cancelClose();
                    setHoveredSlug(category.slug);
                  }}
                >
                  <Link
                    to={getCategoryPath(category)}
                    className={`flex h-10 items-center rounded-full px-4 text-sm font-black transition ${
                      active || hovered
                        ? "bg-white/15 text-white"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {category.name}
                  </Link>

                  {(active || hovered) && (
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-[#FEEE00]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {activeCategory && (
            <div
              onMouseEnter={() => {
                cancelClose();
                setHoveredSlug(activeCategory.slug);
              }}
              onMouseLeave={scheduleClose}
              className="absolute left-0 top-full z-[9999] w-full"
            >
              <MegaMenu
                category={activeCategory}
                categories={categories}
                subCategories={activeSubCategories}
                brands={normalizedBrands}
                onClose={closeMenu}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ════ Mobile Navbar ════ */}
      <div className="border-t border-white/10 bg-[#0D1B3E] lg:hidden">
        <div className="flex gap-2 overflow-x-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => {
            const active = isCategoryActive(category);
            return (
              <Link
                key={category._id}
                to={getCategoryPath(category)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
                  active
                    ? "bg-[#FEEE00] text-[#0D1B3E]"
                    : "bg-white/10 text-white"
                }`}
              >
                {category.name}
              </Link>
            );
          })}

          <Link
            to="/products"
            className="shrink-0 rounded-full border border-white/15 px-4 py-2 text-sm font-black text-white"
          >
            All
          </Link>
        </div>

        {mobileSubCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto border-t border-white/10 px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {mobileSubCategories.map((subCategory) => (
              <Link
                key={subCategory._id}
                to={getSubCategoryPath(mobileCategory, subCategory)}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#0D1B3E]"
              >
                {subCategory.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Navbar;
