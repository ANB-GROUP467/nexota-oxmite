import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Mail, ShieldCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import useAuthStore from "../../store/useAuthStore";

const BRAND_NAVY = "#0D1B3E";
const BRAND_BLUE = "#015DF0";
const BRAND_YELLOW = "#FEEE00";
const BRAND_DEEP = "#061126";
const REDIRECT_KEY = "nexota_auth_redirect";
const OTP_LENGTH = 6;

const normalizeIdentifier = (value) => value.trim().toLowerCase();
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isPhone = (value) => /^[+]?[\d\s().-]{7,16}$/.test(value);

function AuthRequiredModal() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const fetchMe = useAuthStore((state) => state.fetchMe);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState("identifier");
  const [redirectTo, setRedirectTo] = useState("/account");
  const [intent, setIntent] = useState("account");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [title, setTitle] = useState("Login to continue");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const identifierRef = useRef(null);
  const firstOtpRef = useRef(null);
  const focusTimerRef = useRef(null);

  const focusIdentifierOnce = () => {
    window.clearTimeout(focusTimerRef.current);
    focusTimerRef.current = window.setTimeout(() => {
      identifierRef.current?.focus({ preventScroll: true });
    }, 120);
  };

  useEffect(() => {
    const handleAuthRequired = (event) => {
      const detail = event.detail || {};
      const nextIntent = detail.intent || "account";
      const nextRedirect = detail.redirectTo || `/${nextIntent}`;

      setIntent(nextIntent);
      setRedirectTo(nextRedirect);
      setTitle(
        detail.title ||
          (nextIntent === "orders"
            ? "Login to view your orders"
            : nextIntent === "wishlist"
              ? "Login to view your wishlist"
              : "Login to continue"),
      );
      setMode(detail.mode || "login");
      setStep("identifier");
      setIdentifier("");
      setOtp(Array(OTP_LENGTH).fill(""));
      setError("");
      setMessage("");
      setResendCooldown(0);
      setOpen(true);
      localStorage.setItem(REDIRECT_KEY, nextRedirect);
      focusIdentifierOnce();
    };

    window.addEventListener("nexota:auth-required", handleAuthRequired);
    return () => {
      window.removeEventListener("nexota:auth-required", handleAuthRequired);
      window.clearTimeout(focusTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeModal();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!user) return;

    const savedRedirect = localStorage.getItem(REDIRECT_KEY);
    if (savedRedirect) {
      localStorage.removeItem(REDIRECT_KEY);
      setOpen(false);
      navigate(savedRedirect, { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = window.setTimeout(
      () => setResendCooldown((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const subtitle = useMemo(() => {
    if (step === "otp") {
      return `Enter the ${OTP_LENGTH}-digit OTP sent to ${identifier}.`;
    }

    if (mode === "register") {
      return "Create your Nexota account with OTP verification.";
    }

    return "Enter your email or mobile number to receive an OTP.";
  }, [identifier, mode, step]);

  const identifierError = useMemo(() => {
    if (!identifier.trim()) return "";
    if (!isEmail(identifier.trim()) && !isPhone(identifier.trim())) {
      return "Please enter a valid email or mobile number.";
    }
    return "";
  }, [identifier]);

  const otpValue = otp.join("");

  const closeModal = () => {
    window.clearTimeout(focusTimerRef.current);
    setOpen(false);
    setIdentifier("");
    setOtp(Array(OTP_LENGTH).fill(""));
    setStep("identifier");
    setError("");
    setMessage("");
    setResendCooldown(0);
  };

  const requestOtp = async () => {
    const cleanIdentifier = normalizeIdentifier(identifier);

    if (!cleanIdentifier || identifierError) {
      setError(identifierError || "Please enter your email or mobile number.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const { data } = await api.post("/auth/request-otp", {
        identifier: cleanIdentifier,
        mode,
      });

      setIdentifier(cleanIdentifier);
      setStep("otp");
      setOtp(Array(OTP_LENGTH).fill(""));
      setMessage(data?.success === false ? "" : "OTP sent successfully.");
      setResendCooldown(30);

      window.setTimeout(
        () => firstOtpRef.current?.focus({ preventScroll: true }),
        80,
      );
    } catch (err) {
      console.error("OTP request failed:", err);
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const cleanIdentifier = normalizeIdentifier(identifier);

    if (otpValue.length !== OTP_LENGTH) {
      setError(`Please enter the complete ${OTP_LENGTH}-digit OTP.`);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await api.post("/auth/verify-otp", {
        identifier: cleanIdentifier,
        otp: otpValue,
        mode,
      });

      const token = data?.token || data?.accessToken || data?.data?.token;
      const verifiedUser = data?.user || data?.data?.user || data?.data;

      if (!token || !verifiedUser) {
        throw new Error("Invalid OTP login response.");
      }

      setToken?.(token);
      setUser?.(verifiedUser);
      fetchMe?.().catch?.(() => {});

      localStorage.setItem(REDIRECT_KEY, redirectTo);
      setOpen(false);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("OTP verification failed:", err);
      setError("Invalid OTP. Please try again.");
      setOtp(Array(OTP_LENGTH).fill(""));
      window.setTimeout(
        () => firstOtpRef.current?.focus({ preventScroll: true }),
        80,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setStep("identifier");
    setOtp(Array(OTP_LENGTH).fill(""));
    setError("");
    setMessage("");
    setResendCooldown(0);
    focusIdentifierOnce();
  };

  const handleOtpChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, "");

    if (!cleanValue) {
      const next = [...otp];
      next[index] = "";
      setOtp(next);
      return;
    }

    const chars = cleanValue.slice(0, OTP_LENGTH - index).split("");
    const next = [...otp];
    chars.forEach((char, offset) => {
      next[index + offset] = char;
    });
    setOtp(next);

    const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
    document
      .getElementById(`auth-otp-${nextIndex}`)
      ?.focus({ preventScroll: true });
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      document
        .getElementById(`auth-otp-${index - 1}`)
        ?.focus({ preventScroll: true });
    }

    if (event.key === "Enter") verifyOtp();
  };

  const handleOtpPaste = (event) => {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (pasted) {
      const next = Array(OTP_LENGTH).fill("");
      pasted.split("").forEach((char, index) => {
        next[index] = char;
      });
      setOtp(next);
      document
        .getElementById(`auth-otp-${Math.min(pasted.length, OTP_LENGTH) - 1}`)
        ?.focus({ preventScroll: true });
    }

    event.preventDefault();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center overflow-x-hidden overflow-y-auto bg-[#061126]/75 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-5 sm:py-6"
      onMouseDown={closeModal}
      role="presentation"
    >
      <section
        className="relative my-auto w-full max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-blue-950/40 sm:max-w-[460px]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-required-title"
      >
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-slate-700 shadow-sm ring-1 ring-white/40 transition hover:bg-slate-100"
          aria-label="Close login modal"
        >
          <X size={20} />
        </button>

        <div
          className="relative flex min-h-[108px] items-center justify-between overflow-hidden px-4 py-4 text-white sm:min-h-[122px] sm:px-6 sm:py-5"
          style={{
            background:
              "linear-gradient(135deg, #061126 0%, #0D1B3E 46%, #015DF0 100%)",
          }}
        >
          <div className="absolute -left-10 -top-14 h-36 w-36 rounded-full bg-[#015DF0]/25 blur-sm" />
          <div className="absolute -bottom-16 right-10 h-32 w-32 rounded-full bg-[#FEEE00]/20 blur-sm" />
          <div className="absolute bottom-0 left-0 h-1 w-full bg-[#FEEE00]" />

          <div className="relative flex min-w-0 items-center gap-3">
            <div className="grid h-14 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/95 p-2 shadow-lg ring-1 ring-white/30 sm:h-16 sm:w-20">
              <img
                src="/logo.png"
                alt="Nexota"
                className="block h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wide text-[#FEEE00] sm:text-xs">
                Nexota account
              </p>
              <p className="mt-1 truncate text-sm font-bold leading-tight text-white">
                Secure OTP login
              </p>
            </div>
          </div>

          <div
            className="relative mr-9 hidden h-14 w-14 place-items-center rounded-2xl text-white shadow-lg sm:grid"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <ShieldCheck size={30} />
          </div>
        </div>

        <div className="max-h-[calc(100dvh-140px)] overflow-x-hidden overflow-y-auto px-4 pb-6 pt-5 sm:max-h-[calc(100dvh-160px)] sm:px-7">
          <div className="text-center">
            <h2
              id="auth-required-title"
              className="mx-auto max-w-full break-words px-1 text-[21px] font-black leading-tight text-slate-950 sm:text-[28px]"
            >
              {step === "otp" ? "Enter OTP" : title}
            </h2>
            <p className="mx-auto mt-2 max-w-sm break-words text-sm font-medium leading-6 text-slate-500">
              {subtitle}
            </p>
          </div>

          <div
            className="mt-5 grid grid-cols-2 rounded-xl p-1"
            style={{ backgroundColor: BRAND_NAVY }}
          >
            <button
              type="button"
              onClick={() => handleModeChange("login")}
              disabled={loading}
              className={`h-11 min-w-0 rounded-lg px-2 text-sm font-black transition ${
                mode === "login"
                  ? "text-[#0D1B3E] shadow-sm"
                  : "text-white hover:bg-white/10"
              }`}
              style={{
                backgroundColor:
                  mode === "login" ? BRAND_YELLOW : "transparent",
              }}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("register")}
              disabled={loading}
              className={`h-11 min-w-0 rounded-lg px-2 text-sm font-black transition ${
                mode === "register"
                  ? "text-[#0D1B3E] shadow-sm"
                  : "text-white hover:bg-white/10"
              }`}
              style={{
                backgroundColor:
                  mode === "register" ? BRAND_YELLOW : "transparent",
              }}
            >
              Sign Up
            </button>
          </div>

          {step === "identifier" && (
            <>
              <label className="mt-5 block text-sm font-black text-slate-700">
                Email or mobile number
              </label>
              <div
                className={`mt-2 flex h-12 items-center rounded-xl border px-3 transition ${
                  identifierError && identifier
                    ? "border-red-400"
                    : "border-slate-300 focus-within:border-[#015DF0]"
                }`}
              >
                <Mail size={18} className="shrink-0 text-slate-400" />
                <input
                  ref={identifierRef}
                  value={identifier}
                  onChange={(event) => {
                    setIdentifier(event.target.value);
                    setError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") requestOtp();
                  }}
                  placeholder="Email or mobile number"
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none"
                  style={{ outline: "none", boxShadow: "none" }}
                  autoComplete="username"
                />
              </div>
              {identifierError && identifier && (
                <p className="mt-1.5 text-xs font-bold text-red-500">
                  {identifierError}
                </p>
              )}
            </>
          )}

          {step === "otp" && (
            <>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep("identifier");
                    setOtp(Array(OTP_LENGTH).fill(""));
                    setError("");
                    setMessage("");
                    focusIdentifierOnce();
                  }}
                  className="inline-flex items-center gap-2 text-sm font-black text-slate-600 transition hover:text-slate-950"
                >
                  <ArrowLeft size={16} />
                  Change email/mobile
                </button>

                <button
                  type="button"
                  onClick={resendCooldown > 0 ? undefined : requestOtp}
                  disabled={loading || resendCooldown > 0}
                  className="text-left text-sm font-black transition disabled:opacity-45 sm:text-right"
                  style={{ color: BRAND_BLUE }}
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend OTP"}
                </button>
              </div>

              <label className="mt-4 block text-sm font-black text-slate-700">
                OTP code
              </label>
              <div
                className="mt-3 grid grid-cols-6 gap-2"
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`auth-otp-${index}`}
                    ref={index === 0 ? firstOtpRef : undefined}
                    value={digit}
                    onChange={(event) =>
                      handleOtpChange(index, event.target.value)
                    }
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    inputMode="numeric"
                    maxLength={1}
                    className={`h-11 min-w-0 rounded-xl border text-center text-lg font-black outline-none transition focus:border-[#015DF0] focus:outline-none focus-visible:outline-none sm:h-12 sm:text-xl ${
                      digit
                        ? "border-[#015DF0] bg-blue-50 text-slate-950"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                    style={{ outline: "none", boxShadow: "none" }}
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                  />
                ))}
              </div>
            </>
          )}

          {message && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-600">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={step === "otp" ? verifyOtp : requestOtp}
            disabled={loading}
            className="mt-5 h-12 w-full rounded-xl text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-300"
            style={{
              backgroundColor: loading ? undefined : BRAND_BLUE,
              boxShadow: loading
                ? undefined
                : "0 14px 24px rgba(1,93,240,0.22)",
            }}
          >
            {loading
              ? "Please wait..."
              : step === "otp"
                ? "Verify OTP"
                : "Send OTP"}
          </button>

          <p className="mt-4 text-center text-xs font-medium leading-5 text-slate-500">
            By continuing, you agree to our{" "}
            <span className="font-black" style={{ color: BRAND_BLUE }}>
              Privacy Policy
            </span>{" "}
            and{" "}
            <span className="font-black" style={{ color: BRAND_BLUE }}>
              Terms of Service
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}

export default AuthRequiredModal;
