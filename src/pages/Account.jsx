import { Link, Navigate } from "react-router-dom";
import { User, ShoppingBag, Heart, LogOut, Mail, Package } from "lucide-react";
import { useEffect, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import useAuthStore from "../store/useAuthStore";
import api from "../services/api";

function Account() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, wishlistRes] = await Promise.all([
          api.get("/orders"),
          api.get(`/wishlist/${user._id}`),
        ]);

        setOrders(ordersRes.data.orders || []);
        setWishlist(wishlistRes.data.wishlist || []);
      } catch (error) {
        console.error("Account Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchData();
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto py-20 text-center">Loading...</div>
      </MainLayout>
    );
  }

  const deliveredOrders = orders.filter(
    (order) => order.orderStatus === "Delivered",
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-black mb-2">My Account</h1>

        <p className="text-gray-500 mb-8">
          Manage your profile, orders and wishlist
        </p>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-3xl border">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                {user?.name?.charAt(0)}
              </div>

              <div>
                <h3 className="font-bold">{user?.name}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/orders"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50"
              >
                <Package size={18} />
                Orders
              </Link>

              <Link
                to="/wishlist"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50"
              >
                <Heart size={18} />
                Wishlist
              </Link>

              <button
                onClick={logout}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="grid md:grid-cols-3 gap-5 mb-6">
              <div className="bg-white p-6 rounded-3xl border">
                <ShoppingBag size={30} />
                <h2 className="text-3xl font-black mt-3">{orders.length}</h2>
                <p>Total Orders</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border">
                <Heart size={30} />
                <h2 className="text-3xl font-black mt-3">{wishlist.length}</h2>
                <p>Wishlist Items</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border">
                <Package size={30} />
                <h2 className="text-3xl font-black mt-3">
                  {deliveredOrders.length}
                </h2>
                <p>Delivered</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">Profile Details</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-500">Name</label>

                  <div className="p-4 border rounded-xl mt-2">{user.name}</div>
                </div>

                <div>
                  <label className="text-gray-500">Email</label>

                  <div className="p-4 border rounded-xl mt-2 flex items-center gap-2">
                    <Mail size={16} />
                    {user.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Account;
