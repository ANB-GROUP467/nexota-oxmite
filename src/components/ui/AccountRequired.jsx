import { LockKeyhole, PackageSearch, UserRound } from "lucide-react";

const BRAND_NAVY = "#0D1B3E";
const BRAND_BLUE = "#015DF0";
const BRAND_YELLOW = "#FEEE00";

function AccountRequired({
  redirectTo = "/orders",
  intent = "orders",
  title = "Account required",
  subtitle = "Please sign in or register to see this content",
}) {
  const openOtpForm = () => {
    window.dispatchEvent(
      new CustomEvent("nexota:auth-required", {
        detail: {
          intent,
          redirectTo,
          title:
            intent === "orders"
              ? "Login to view your orders"
              : intent === "wishlist"
                ? "Login to view your wishlist"
                : "Login to continue",
          mode: "login",
          startStep: "identifier",
        },
      }),
    );
  };

  return (
    <main className="min-h-[calc(100dvh-9rem)] bg-[#f6f7fb] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto flex min-h-[460px] w-full max-w-3xl flex-col items-center justify-center text-center">
        <div className="relative h-44 w-64 max-w-full sm:h-56 sm:w-72">
          <div className="absolute bottom-4 left-1/2 h-2 w-52 max-w-[82%] -translate-x-1/2 rounded-full bg-slate-200 sm:w-64" />

          <div className="absolute left-1/2 top-3 h-36 w-28 -translate-x-1/2 rounded-lg border-4 border-slate-300 bg-white sm:top-4 sm:h-40 sm:w-32">
            <div className="absolute -right-1 -top-1 h-10 w-10 rounded-bl-lg border-b-4 border-l-4 border-slate-300 bg-[#f6f7fb] sm:h-12 sm:w-12" />

            <div className="mx-auto mt-10 grid h-11 w-11 place-items-center rounded-full bg-slate-100 sm:mt-12 sm:h-12 sm:w-12">
              <LockKeyhole size={24} className="text-white" fill="#CBD5E1" />
            </div>

            <div className="mx-auto mt-5 h-2.5 w-14 rounded-full bg-slate-200 sm:h-3 sm:w-16" />
            <div className="mx-auto mt-4 h-2.5 w-16 rounded-full bg-slate-200 sm:h-3 sm:w-20" />
          </div>

          <div
            className="absolute left-6 top-10 grid h-14 w-14 place-items-center rounded-full border-4 border-yellow-300 shadow-sm sm:left-8 sm:top-12 sm:h-16 sm:w-16"
            style={{ backgroundColor: BRAND_YELLOW }}
          >
            <span
              className="text-2xl font-black sm:text-3xl"
              style={{ color: BRAND_NAVY }}
            >
              !
            </span>
          </div>

          <div className="absolute right-6 top-20 grid h-11 w-11 place-items-center rounded-xl bg-blue-50 sm:right-8 sm:top-24 sm:h-12 sm:w-12">
            {intent === "orders" ? (
              <PackageSearch size={24} style={{ color: BRAND_BLUE }} />
            ) : (
              <UserRound size={24} style={{ color: BRAND_BLUE }} />
            )}
          </div>
        </div>

        <h1 className="mt-3 max-w-xl text-2xl font-extrabold leading-tight text-slate-800 sm:mt-4 sm:text-3xl">
          {title}
        </h1>

        <p className="mt-3 max-w-md text-sm font-medium leading-6 text-slate-500 sm:text-lg sm:leading-7">
          {subtitle}
        </p>

        <button
          type="button"
          onClick={openOtpForm}
          className="mt-7 inline-flex h-12 min-w-[180px] items-center justify-center rounded-xl px-6 text-sm font-extrabold uppercase text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-blue-200 active:scale-[0.98] sm:mt-8 sm:h-14 sm:min-w-[210px] sm:px-8 sm:text-base"
          style={{ backgroundColor: BRAND_BLUE }}
        >
          Login/Signup
        </button>
      </div>
    </main>
  );
}

export default AccountRequired;
