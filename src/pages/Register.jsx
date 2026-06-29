import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";

const BRAND_BLUE = "#015DF0";
const BRAND_NAVY = "#0D1B3E";
const LOGO_SRC = "/logo.png";

const passwordStrength = (password) => {
  if (!password) return { label: "", bars: 0, color: "#e2e8f0" };
  if (password.length >= 12)
    return { label: "Strong", bars: 4, color: "#22c55e" };
  if (password.length >= 10)
    return { label: "Good", bars: 3, color: "#84cc16" };
  if (password.length >= 8) return { label: "Fair", bars: 2, color: "#f59e0b" };
  return { label: "Weak", bars: 1, color: "#ef4444" };
};

function Spinner({ label }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="white"
          strokeWidth="4"
        />
        <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      {label}
    </span>
  );
}

function LogoHeader() {
  return (
    <Link
      to="/"
      className="mx-auto mb-6 flex h-20 w-28 items-center justify-center overflow-hidden rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
      aria-label="Go to Nexota home"
    >
      <img
        src={LOGO_SRC}
        alt="Nexota"
        className="block h-full w-full object-contain"
      />
    </Link>
  );
}

function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-[#f6f7fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-lg items-center justify-center">
        <section className="w-full">{children}</section>
      </div>
    </div>
  );
}

function Register() {
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    showPassword: false,
  });

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const strength = passwordStrength(form.password);

  useEffect(() => {
    if (resendTimer <= 0) return undefined;

    const interval = window.setInterval(() => {
      setResendTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const startResendTimer = () => setResendTimer(60);

  const handleSendOtp = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error("Please fill all fields");
      return;
    }

    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/request-otp", {
        identifier: form.email.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        mode: "register",
      });
      toast.success("OTP sent to your email");
      setStep("otp");
      startResendTimer();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    try {
      setResendLoading(true);
      await api.post("/auth/request-otp", {
        identifier: form.email.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        mode: "register",
      });
      toast.success("OTP resent to your email");
      setOtpValue("");
      startResendTimer();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (otpValue.length !== 6) {
      toast.error("Please enter a valid 6 digit OTP");
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post("/auth/verify-otp", {
        identifier: form.email.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        otp: otpValue.trim(),
        mode: "register",
        name: form.name.trim(),
        password: form.password,
      });

      if (data.success) {
        localStorage.setItem("token", data.token);
        login?.(data.user, data.token);
        toast.success("Account created successfully!");
        navigate("/account");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <AuthShell>
        <LogoHeader />

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
          <div
            className="h-1.5 w-full"
            style={{
              background: `linear-gradient(90deg, ${BRAND_BLUE}, #6ea8fe)`,
            }}
          />

          <div className="p-6 sm:p-8 md:p-10">
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setOtpValue("");
              }}
              className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-800"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back
            </button>

            <div className="mb-5 flex justify-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-md"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                <svg
                  width="30"
                  height="30"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <h1
              className="text-center text-2xl font-black sm:text-3xl"
              style={{ color: BRAND_NAVY }}
            >
              Check your email
            </h1>
            <p className="mt-2 text-center text-sm text-slate-500">
              We sent a 6-digit code to
            </p>
            <p className="mx-auto mt-1 max-w-full truncate px-4 text-center text-sm font-black text-slate-800">
              {form.email}
            </p>

            <form onSubmit={handleVerifyOtp} className="mt-7 space-y-5">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpValue}
                onChange={(event) =>
                  setOtpValue(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                required
                autoFocus
                className="w-full rounded-2xl border-2 border-slate-200 py-4 text-center text-2xl font-black tracking-[0.32em] outline-none transition placeholder:text-slate-200 focus:border-blue-500 sm:text-3xl sm:tracking-[0.5em]"
              />

              <button
                type="submit"
                disabled={loading || otpValue.length !== 6}
                className="w-full rounded-2xl py-4 text-sm font-extrabold uppercase tracking-widest text-white transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                {loading ? <Spinner label="Verifying..." /> : "Create Account"}
              </button>
            </form>

            <div className="mt-5 text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-slate-400">
                  Resend OTP in{" "}
                  <span className="font-bold text-slate-600">
                    {resendTimer}s
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="text-sm font-bold transition hover:underline disabled:opacity-50"
                  style={{ color: BRAND_BLUE }}
                >
                  {resendLoading ? "Sending..." : "Resend OTP"}
                </button>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              OTP expires in 2 minutes
            </p>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <LogoHeader />

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
        <div
          className="h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${BRAND_BLUE}, #6ea8fe)`,
          }}
        />

        <div className="p-6 sm:p-8 md:p-10">
          <h1
            className="text-2xl font-black sm:text-3xl"
            style={{ color: BRAND_NAVY }}
          >
            Create account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Join Nexota and start shopping smarter.
          </p>

          <form onSubmit={handleSendOtp} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Muhammad Ali"
                required
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border-2 border-slate-200 py-3 pl-10 pr-4 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  type={form.showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  required
                  className="w-full rounded-xl border-2 border-slate-200 py-3 pl-10 pr-12 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      showPassword: !prev.showPassword,
                    }))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  aria-label={
                    form.showPassword ? "Hide password" : "Show password"
                  }
                >
                  {form.showPassword ? (
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {form.password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-1 flex-1 rounded-full transition-all"
                        style={{
                          backgroundColor:
                            index < strength.bars ? strength.color : "#e2e8f0",
                        }}
                      />
                    ))}
                  </div>
                  <span className="min-w-10 text-right text-xs text-slate-400">
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-2xl py-4 text-sm font-extrabold uppercase tracking-widest text-white transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: BRAND_BLUE }}
            >
              {loading ? <Spinner label="Sending OTP..." /> : "Continue"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs font-medium text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-extrabold transition hover:underline"
              style={{ color: BRAND_BLUE }}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      <p className="mt-6 px-4 text-center text-xs leading-5 text-slate-400">
        By creating an account, you agree to our{" "}
        <span className="cursor-pointer font-semibold text-slate-500 hover:underline">
          Terms
        </span>
        {" & "}
        <span className="cursor-pointer font-semibold text-slate-500 hover:underline">
          Privacy Policy
        </span>
      </p>
    </AuthShell>
  );
}

export default Register;
