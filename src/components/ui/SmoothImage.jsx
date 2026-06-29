import { useState } from "react";

function SmoothImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  fallback = "/placeholder.png",
  loading = "lazy",
  aspect = "aspect-[4/3]",
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imageSrc = failed || !src ? fallback : src;

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 ${aspect} ${wrapperClassName}`}
    >
      {!loaded && <div className="ux-shimmer absolute inset-0" />}
      <img
        src={imageSrc}
        alt={alt || ""}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true);
          setLoaded(true);
        }}
        className={`h-full w-full object-cover transition duration-500 ${
          loaded
            ? "scale-100 opacity-100 blur-0"
            : "scale-[1.02] opacity-0 blur-sm"
        } ${className}`}
      />
    </div>
  );
}

export default SmoothImage;
