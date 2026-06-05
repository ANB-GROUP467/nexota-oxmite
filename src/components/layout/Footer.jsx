import { Link } from "react-router-dom";

// ─── Social icons ─────────────────────────────────────────────────────────────
const FacebookIcon = ({ size = 18 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const InstagramIcon = ({ size = 18 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);
const TwitterIcon = ({ size = 18 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const YoutubeIcon = ({ size = 18 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
);

// ─── Trust icons ──────────────────────────────────────────────────────────────
const TruckIcon = ({ size = 22 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const RefreshIcon = ({ size = 22 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const ShieldIcon = ({ size = 22 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

// ─── App store icons ──────────────────────────────────────────────────────────
const AppleIcon = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);
const PlayStoreIcon = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M3.18 23.76c.3.17.64.22.99.14l12.5-7.17-2.75-2.75-10.74 9.78zM.5 1.4C.19 1.74 0 2.24 0 2.9v18.2c0 .66.19 1.16.5 1.5l.08.07 10.2-10.2v-.24L.58 1.33.5 1.4zm20.34 9.1-2.9-1.67-3.06 3.07 3.06 3.06 2.92-1.68c.83-.48.83-1.26-.02-1.78zM4.17.24L16.67 7.4l-2.75 2.75L3.18.37c.35-.2.71-.24.99-.13z" />
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────
const footerLinks = {
  Shop: [
    { label: "Mobiles", to: "/category/mobiles" },
    { label: "Laptops", to: "/category/laptops" },
    { label: "Gaming", to: "/category/gaming" },
    { label: "Audio", to: "/category/audio" },
    { label: "Cameras", to: "/category/cameras" },
    { label: "TVs", to: "/category/tvs" },
  ],
  Support: [
    { label: "Contact Us", to: "/contact" },
    { label: "Returns", to: "/returns" },
    { label: "Track Order", to: "/track-order" },
    { label: "Help Center", to: "/help" },
  ],
  Company: [
    { label: "About Nexota", to: "/about" },
    { label: "Careers", to: "/careers" },
    { label: "Press", to: "/press" },
    { label: "Sell on Nexota", to: "/sell" },
  ],
};

const socials = [
  { icon: <FacebookIcon size={16} />, label: "Facebook", href: "#" },
  { icon: <InstagramIcon size={16} />, label: "Instagram", href: "#" },
  { icon: <TwitterIcon size={16} />, label: "Twitter", href: "#" },
  { icon: <YoutubeIcon size={16} />, label: "YouTube", href: "#" },
];

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="mt-24 bg-[#0D1B3E] text-white">
      {/* Trust band */}
      <div className="border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          {[
            {
              icon: <TruckIcon />,
              text: (
                <>
                  Free delivery on orders over{" "}
                  <span className="text-[#015df0] font-bold">QAR 200</span>
                </>
              ),
            },
            {
              icon: <RefreshIcon />,
              text: (
                <>
                  Easy <span className="text-[#015df0] font-bold">15-day</span>{" "}
                  returns
                </>
              ),
            },
            {
              icon: <ShieldIcon />,
              text: (
                <>
                  <span className="text-[#015df0] font-bold">100% secure</span>{" "}
                  payments
                </>
              ),
            },
          ].map(({ icon, text }, i) => (
            <div
              key={i}
              className="flex items-center justify-center sm:justify-start gap-3"
            >
              <span className="text-[#015df0] shrink-0">{icon}</span>
              <span className="text-sm text-gray-300 font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-[1600px] mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="col-span-2 flex flex-col gap-5">
            <img
              src="/logo.png"
              alt="Nexota"
              className="h-12 w-auto object-contain"
            />
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Qatar's favourite online electronics destination. Millions of
              products, delivered fast across Doha and beyond.
            </p>

            {/* Socials */}
            <div className="flex gap-3 mt-1">
              {socials.map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center
                    text-gray-400 hover:border-[#015df0] hover:text-[#015df0] transition-all duration-200"
                >
                  {icon}
                </a>
              ))}
            </div>

            {/* App badges */}
            <div className="flex gap-3 flex-wrap">
              {[
                {
                  icon: <AppleIcon />,
                  sub: "Download on the",
                  label: "App Store",
                },
                {
                  icon: <PlayStoreIcon />,
                  sub: "Get it on",
                  label: "Google Play",
                },
              ].map(({ icon, sub, label }) => (
                <div
                  key={label}
                  className="px-3 py-2 rounded-lg border border-white/15 flex items-center gap-2
                    cursor-pointer hover:border-[#015df0] transition-colors"
                >
                  {icon}
                  <div>
                    <p className="text-[10px] text-gray-500 leading-none">
                      {sub}
                    </p>
                    <p className="text-xs font-semibold leading-none mt-0.5">
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-5">
                {heading}
              </h3>
              <ul className="space-y-3">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-sm text-gray-400 hover:text-white transition-colors duration-150"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>© 2026 Nexota Store. All Rights Reserved.</p>
          <div className="flex gap-5 flex-wrap justify-center">
            <Link
              to="/privacy"
              className="hover:text-gray-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-gray-400 transition-colors">
              Terms of Use
            </Link>
            <Link
              to="/cookies"
              className="hover:text-gray-400 transition-colors"
            >
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
