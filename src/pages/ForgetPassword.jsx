import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Future API Call
    console.log("Reset password for:", email);

    setSuccess(true);
  };

  return (
    <div
      className="
      min-h-screen
      bg-gradient-to-br
      from-yellow-50
      via-white
      to-orange-50
      flex
      items-center
      justify-center
      px-4
      "
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="
        w-full
        max-w-md
        bg-white
        rounded-3xl
        shadow-xl
        border
        border-gray-100
        p-8
        "
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
                <h1
                  className="
                  text-4xl
                  font-black
                  text-gray-900
                  "
                >
                  Forgot Password
                </h1>

                <p
                  className="
                  text-gray-500
                  mt-3
                  "
                >
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <Mail
                    size={18}
                    className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                    "
                  />

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="
                      w-full
                      h-14
                      pl-12
                      pr-4
                      rounded-2xl
                      border
                      border-gray-200
                      bg-gray-50
                      outline-none
                      focus:border-[#F59E0B]
                      focus:ring-4
                      focus:ring-yellow-100
                      transition-all
                    "
                  />
                </div>

                <button
                  type="submit"
                  className="
                    w-full
                    mt-6
                    h-14
                    bg-[#015df0]
                    hover:bg-yellow-300
                    rounded-2xl
                    font-bold
                    transition-all
                  "
                >
                  Send Reset Link
                </button>
              </form>

              <Link
                to="/login"
                className="
                flex
                items-center
                justify-center
                gap-2
                mt-6
                text-gray-600
                hover:text-[#F59E0B]
                "
              >
                <ArrowLeft size={16} />
                Back To Login
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
            >
              <div className="text-center">
                <CheckCircle
                  size={80}
                  className="
                  mx-auto
                  text-green-500
                  "
                />

                <h2
                  className="
                  mt-6
                  text-3xl
                  font-bold
                  "
                >
                  Check Your Email
                </h2>

                <p
                  className="
                  mt-4
                  text-gray-500
                  "
                >
                  We've sent a password reset link to:
                </p>

                <p
                  className="
                  mt-2
                  font-semibold
                  "
                >
                  {email}
                </p>

                <Link
                  to="/login"
                  className="
                  block
                  mt-8
                  bg-[#015df0]
                  hover:bg-yellow-300
                  rounded-2xl
                  py-4
                  font-bold
                  transition-all
                  "
                >
                  Return To Login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
