import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    login({
      name: form.email.split("@")[0],
      email: form.email,
    });

    toast.success("Login Successful");

    navigate("/");
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
        <div className="text-center mb-8">
          <h1
            className="
            text-4xl
            font-black
            "
          >
            Welcome Back
          </h1>

          <p
            className="
            mt-3
            text-gray-500
            "
          >
            Login to continue shopping
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="relative mb-4">
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
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              placeholder="Email Address"
              className="
              w-full
              h-14
              pl-12
              rounded-2xl
              border
              bg-gray-50
              outline-none
              "
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock
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
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
              placeholder="Password"
              className="
              w-full
              h-14
              pl-12
              pr-12
              rounded-2xl
              border
              bg-gray-50
              outline-none
              "
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="
              absolute
              right-4
              top-1/2
              -translate-y-1/2
              "
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex justify-end mt-3">
            <Link
              to="/forgot-password"
              className="
              text-sm
              text-[#F59E0B]
              "
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="
            w-full
            h-14
            mt-6
            rounded-2xl
            bg-[#015df0]
            hover:bg-yellow-300
            font-bold
            "
          >
            Login
          </button>
        </form>

        <p
          className="
          mt-6
          text-center
          text-gray-500
          "
        >
          Don't have an account?{" "}
          <Link
            to="/register"
            className="
            text-[#F59E0B]
            font-semibold
            "
          >
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;
