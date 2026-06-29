import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:5000/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send reset link.");
      }

      setSuccess(true);
    } catch (err) {
      // Always show the success screen even on error to avoid
      // leaking whether an email is registered (security best practice)
      if (err.message === "Failed to fetch") {
        toast.error("Network error. Please try again.");
        return;
      }
      // For "user not found" type errors we still show success
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
      >
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-4xl font-black text-gray-900">
                  Forgot Password
                </h1>
                <p className="text-gray-500 mt-3">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your email"
                    className={`w-full h-14 pl-12 pr-4 rounded-2xl border bg-gray-50 outline-none
                      focus:border-[#015df0] focus:ring-4 focus:ring-blue-100 transition-all
                      ${error ? "border-red-400" : "border-gray-200"}`}
                  />
                </div>

                {error && (
                  <p className="mt-2 text-xs text-red-500 pl-1">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 h-14 bg-[#015df0] hover:bg-[#0A4CD6] text-white rounded-2xl
                    font-bold transition-all flex items-center justify-center gap-2
                    disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Sending…
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 mt-6 text-gray-500 hover:text-[#015df0] transition-colors"
              >
                <ArrowLeft size={16} />
                Back To Login
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CheckCircle size={80} className="mx-auto text-green-500" />
                </motion.div>

                <h2 className="mt-6 text-3xl font-bold text-gray-900">
                  Check Your Email
                </h2>

                <p className="mt-4 text-gray-500">If an account exists for:</p>

                <p className="mt-2 font-semibold text-gray-800">{email}</p>

                <p className="mt-3 text-sm text-gray-400">
                  You'll receive a password reset link shortly. Check your spam
                  folder if you don't see it.
                </p>

                <Link
                  to="/login"
                  className="block mt-8 bg-[#015df0] hover:bg-[#0A4CD6] text-white rounded-2xl py-4 font-bold transition-all"
                >
                  Return To Login
                </Link>

                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Try a different email
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
