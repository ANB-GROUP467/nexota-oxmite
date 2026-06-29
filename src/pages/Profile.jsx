import { useState } from "react";
import toast from "react-hot-toast";
import MainLayout from "../layouts/MainLayout";
import useAuthStore from "../store/useAuthStore";

function Profile() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const changePassword = useAuthStore((state) => state.changePassword);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    address: user?.address || "",
    password: user?.password || "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSave = () => {
    updateProfile(form);

    toast.success("Profile Updated Successfully");
  };
  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    changePassword(currentPassword, newPassword);

    toast.success("Password Updated");

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl shadow-sm border p-8">
          <h1 className="text-3xl font-black mb-8">My Profile</h1>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="text-sm text-gray-500">Full Name</label>

              <input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="
                  w-full
                  mt-2
                  border
                  rounded-2xl
                  p-4
                  outline-none
                  focus:border-[#015DF0]
                "
                placeholder="Enter Name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-gray-500">Email Address</label>

              <input
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                className="
                  w-full
                  mt-2
                  border
                  rounded-2xl
                  p-4
                  outline-none
                  focus:border-[#015DF0]
                "
                placeholder="Enter Email"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="text-sm text-gray-500">Address</label>

              <textarea
                value={form.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: e.target.value,
                  })
                }
                rows={4}
                className="
                  w-full
                  mt-2
                  border
                  rounded-2xl
                  p-4
                  outline-none
                  resize-none
                  focus:border-[#015DF0]
                "
                placeholder="Enter Address"
              />
            </div>

            {/* Password */}
            <div className="md:col-span-2">
              <label className="text-sm text-gray-500">Change Password</label>

              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                className="
                  w-full
                  mt-2
                  border
                  rounded-2xl
                  p-4
                  outline-none
                  focus:border-[#015DF0]
                "
                placeholder="New Password"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="
              mt-8
              bg-[#015DF0]
              hover:bg-[#0A4CD6]
              text-white
              px-8
              py-4
              rounded-2xl
              font-bold
              transition-all
            "
          >
            Save Changes
          </button>
        </div>
      </div>
    </MainLayout>
  );
}

export default Profile;
