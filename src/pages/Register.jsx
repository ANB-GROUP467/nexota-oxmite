import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const handleSubmit = (e) => {
    e.preventDefault();

    login({
      name: form.name,
      email: form.email,
    });

    toast.success("Account Created Successfully");

    navigate("/account");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">Register</h1>

        <input placeholder="Name" className="w-full border p-3 rounded mb-4" />

        <input placeholder="Email" className="w-full border p-3 rounded mb-4" />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3 rounded mb-4"
        />

        <button className="w-full bg-[#015df0] py-3 rounded-xl">
          Register
        </button>
      </div>
    </div>
  );
}

export default Register;
