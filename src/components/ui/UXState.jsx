import { AlertCircle, PackageSearch, RefreshCw } from "lucide-react";

const BRAND_BLUE = "#015DF0";
const BRAND_NAVY = "#0D1B3E";
const BRAND_YELLOW = "#FEEE00";

function UXState({
  type = "empty",
  title,
  message,
  actionLabel,
  onAction,
  className = "",
}) {
  const isError = type === "error";
  const Icon = isError ? AlertCircle : PackageSearch;

  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-white px-5 py-12 text-center shadow-sm ${className}`}
    >
      <div
        className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
        style={{
          backgroundColor: isError ? "#fee2e2" : BRAND_YELLOW,
          color: isError ? "#dc2626" : BRAND_NAVY,
        }}
      >
        <Icon size={32} />
      </div>
      <h2 className="mt-5 text-2xl font-black text-slate-950">
        {title || (isError ? "Something went wrong" : "Nothing found")}
      </h2>
      {message && (
        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
          {message}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black text-white transition hover:brightness-95"
          style={{ backgroundColor: BRAND_BLUE }}
        >
          <RefreshCw size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function UXGridSkeleton({ count = 8, className = "" }) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6 ${className}`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
        >
          <div className="ux-shimmer aspect-[4/3]" />
          <div className="space-y-3 p-4">
            <div className="ux-shimmer h-3 w-20 rounded-full" />
            <div className="ux-shimmer h-4 w-full rounded-full" />
            <div className="ux-shimmer h-4 w-4/5 rounded-full" />
            <div className="ux-shimmer h-6 w-28 rounded-full" />
            <div className="ux-shimmer h-11 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { UXGridSkeleton };
export default UXState;
