import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BadgePercent, Sparkles, ChevronRight } from "lucide-react";

import HeroSlider from "../components/home/HeroSlider";
import Categories from "../components/home/Categories";
import Brands from "../components/home/Brands";
import DealsPreview from "../components/home/DealsPreview";
import ProductSection from "../components/home/ProductSection";
import FlashSale from "../components/deals/FlashSale";

import MainLayout from "../layouts/MainLayout";

// ─── Animation variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerChildren = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

// ─── Section wrapper with editorial overline ───────────────────────────────────

function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-col gap-1 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#015DF0]">
            <span className="inline-block h-px w-5 bg-[#FEEE00]" />
            {eyebrow}
          </span>
        )}
        <h2 className="text-xl font-black leading-tight text-[#0D1B3E] sm:text-2xl lg:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
        )}
      </div>
      {action && (
        <Link
          to={action.href}
          className="group mt-3 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#E8E8F0] bg-white px-4 py-2 text-xs font-black text-[#0D1B3E] transition hover:border-[#015DF0] hover:text-[#015DF0] sm:mt-0"
        >
          {action.label}
          <ChevronRight
            size={13}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}

// ─── Stat pill used inside the CTA banner ─────────────────────────────────────

function StatPill({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
      <span className="text-xl font-black text-[#FEEE00] sm:text-2xl">
        {value}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
        {label}
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

function Home() {
  return (
    <MainLayout>
      <main className="relative overflow-x-hidden bg-[#F7F7FA] pb-10 sm:pb-16">
        {/* Ambient blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[-10%] top-0 h-[480px] w-[480px] rounded-full bg-[#FEEE00]/10 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-8%] top-[30%] h-[520px] w-[520px] rounded-full bg-[#015DF0]/8 blur-[120px]"
        />

        <div className="relative mx-auto w-full max-w-[1600px] px-3 sm:px-5 lg:px-8">
          {/* ── Hero slider ── */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="pt-3 sm:pt-5"
          >
            <HeroSlider />
          </motion.section>

          {/* ── Categories ── */}
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-8 sm:mt-10"
          >
            <SectionHeader
              eyebrow="Browse"
              title="Shop by Category"
              action={{ label: "All categories", href: "/products" }}
            />
            <Categories />
          </motion.section>

          {/* ── CTA Banner ── */}
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-8 sm:mt-10"
          >
            <div
              className="relative overflow-hidden rounded-2xl bg-[#0D1B3E] sm:rounded-3xl"
              style={{
                boxShadow:
                  "0 20px 60px -10px rgba(13,27,62,0.35), 0 4px 16px -4px rgba(1,93,240,0.2)",
              }}
            >
              {/* Diagonal stripe texture overlay */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
                  backgroundSize: "18px 18px",
                }}
              />

              {/* Glow orbs */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#015DF0]/40 blur-[64px]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-16 left-6 h-56 w-56 rounded-full bg-[#FEEE00]/15 blur-[56px]"
              />

              <div className="relative z-10 flex flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:flex-row lg:items-center lg:px-10 lg:py-12">
                {/* Left: copy */}
                <div className="flex-1">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#FEEE00] backdrop-blur-sm">
                    <Sparkles size={12} />
                    Nexota Picks
                  </span>

                  <h2 className="mt-4 max-w-xl text-2xl font-black leading-[1.15] text-white sm:text-3xl lg:text-[2.5rem]">
                    Fresh products, curated bundles and live deals — all in one
                    place.
                  </h2>

                  <p className="mt-3 max-w-lg text-sm font-medium leading-relaxed text-white/60 sm:text-base">
                    Browse our latest catalog and dynamic deals managed directly
                    from the admin panel.
                  </p>

                  {/* Stats row */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <StatPill value="2,400+" label="Products" />
                    <StatPill value="18" label="Brands" />
                    <StatPill value="Daily" label="New deals" />
                  </div>
                </div>

                {/* Right: CTAs */}
                <div className="flex flex-row flex-wrap gap-3 lg:flex-col lg:items-stretch xl:flex-row">
                  <Link
                    to="/products"
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#015DF0] px-6 text-sm font-black text-white transition hover:bg-[#0A4CD6] active:scale-[0.97] sm:flex-none"
                  >
                    Shop Products
                    <ArrowRight size={16} />
                  </Link>

                  <Link
                    to="/deals"
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#FEEE00] px-6 text-sm font-black text-[#0D1B3E] transition hover:bg-yellow-300 active:scale-[0.97] sm:flex-none"
                  >
                    View Deals
                    <BadgePercent size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ── Deals preview ── */}
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-10 sm:mt-12"
          >
            <SectionHeader
              eyebrow="Offers"
              title="Today's Deals"
              subtitle="Handpicked discounts refreshed every day"
              action={{ label: "See all deals", href: "/deals" }}
            />
            <DealsPreview />
          </motion.section>

          {/* ── Flash sale ── */}
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-10 sm:mt-12"
          >
            <SectionHeader
              eyebrow="Limited time"
              title="Flash Sale"
              subtitle="Prices drop — grab them before the clock runs out"
            />
            <FlashSale />
          </motion.section>

          {/* ── Brands ── */}
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-10 sm:mt-12"
          >
            <SectionHeader
              eyebrow="Partners"
              title="Top Brands"
              action={{ label: "View all brands", href: "/brands" }}
            />
            <Brands />
          </motion.section>

          {/* ── Recommended products ── */}
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-10 sm:mt-12"
          >
            <SectionHeader
              eyebrow="For you"
              title="Recommended Products"
              subtitle="Selected from your latest catalog"
              action={{ label: "Browse all", href: "/products" }}
            />
            <ProductSection recommendedOnly sortBy="newest" />
          </motion.section>

          {/* ── Featured products ── */}
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-10 sm:mt-12"
          >
            <SectionHeader
              eyebrow="Popular"
              title="Featured Products"
              subtitle="Top-rated picks available right now"
              action={{ label: "See more", href: "/products?featured=true" }}
            />
            <ProductSection featuredOnly sortBy="rating" pageSize={4} />
          </motion.section>

          {/* ── Bottom spacer / newsletter nudge ── */}
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-10 sm:mt-12"
          >
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#E8E8F0] bg-white px-6 py-10 text-center sm:rounded-3xl sm:py-12">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#015DF0]">
                <span className="inline-block h-px w-5 bg-[#FEEE00]" />
                Stay in the loop
                <span className="inline-block h-px w-5 bg-[#FEEE00]" />
              </span>
              <h3 className="max-w-sm text-xl font-black text-[#0D1B3E] sm:text-2xl">
                Get notified about flash sales and new arrivals
              </h3>
              <p className="max-w-xs text-sm font-medium text-slate-500">
                No spam — just the deals worth knowing about.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="mt-2 flex w-full max-w-sm flex-col gap-2.5 sm:flex-row"
              >
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="h-11 w-full flex-1 rounded-xl border border-[#E8E8F0] bg-[#F7F7FA] px-4 text-sm font-medium text-[#0D1B3E] placeholder-slate-400 outline-none ring-0 transition focus:border-[#015DF0] focus:ring-2 focus:ring-[#015DF0]/15"
                />
                <button
                  type="submit"
                  className="h-11 shrink-0 rounded-xl bg-[#0D1B3E] px-5 text-sm font-black text-white transition hover:bg-[#1A2B52] active:scale-[0.97]"
                >
                  Notify me
                </button>
              </form>
            </div>
          </motion.section>
        </div>
      </main>
    </MainLayout>
  );
}

export default Home;
