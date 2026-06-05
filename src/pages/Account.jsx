import { Link, Navigate } from "react-router-dom";
import { User, ShoppingBag, Heart, LogOut, Mail, Package } from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import useAuthStore from "../store/useAuthStore";
import useOrderStore from "../store/useOrderStore";
import useWishlistStore from "../store/useWishlistStore";

function Account() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const orders = useOrderStore((state) => state.orders || []);
  const wishlist = useWishlistStore((state) => state.wishlist || []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-gray-900">My Account</h1>

          <p className="text-gray-500 mt-2">
            Manage your profile, orders and wishlist
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border h-fit">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="
                w-14
                h-14
                rounded-full
                bg-[#015DF0]
                text-white
                flex
                items-center
                justify-center
                font-bold
                text-xl
                "
              >
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div>
                <h3 className="font-bold">{user?.name}</h3>

                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/account"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50"
              >
                <User size={18} />
                My Account
              </Link>

              <Link
                to="/orders"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50"
              >
                <Package size={18} />
                My Orders
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
                className="
                w-full
                flex
                items-center
                gap-3
                p-3
                rounded-xl
                text-red-500
                hover:bg-red-50
                "
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-5">
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <ShoppingBag size={30} className="text-[#015DF0]" />

                <h3 className="mt-4 text-3xl font-black">{orders.length}</h3>

                <p className="text-gray-500">Total Orders</p>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <Heart size={30} className="text-red-500" />

                <h3 className="mt-4 text-3xl font-black">{wishlist.length}</h3>

                <p className="text-gray-500">Wishlist Items</p>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <Package size={30} className="text-green-600" />

                <h3 className="mt-4 text-3xl font-black">
                  {
                    orders.filter((order) => order.status === "Delivered")
                      .length
                  }
                </h3>

                <p className="text-gray-500">Delivered</p>
              </div>
            </div>

            {/* Profile */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border">
              <h2 className="text-2xl font-bold mb-6">Profile Details</h2>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm text-gray-500">Full Name</label>

                  <div className="mt-2 p-4 border rounded-2xl">
                    {user?.name}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Email Address</label>

                  <div className="mt-2 p-4 border rounded-2xl flex items-center gap-2">
                    <Mail size={16} />
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Recent Orders</h2>

                <Link to="/orders" className="text-[#015DF0] font-semibold">
                  View All
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-10">
                  <Package size={60} className="mx-auto text-gray-300" />

                  <h3 className="mt-4 text-xl font-semibold">No Orders Yet</h3>

                  <p className="text-gray-500 mt-2">
                    Start shopping to see orders here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="
                      border
                      rounded-2xl
                      p-4
                      flex
                      flex-col
                      md:flex-row
                      md:items-center
                      md:justify-between
                      gap-3
                      "
                    >
                      <div>
                        <h4 className="font-bold">Order #{order.id}</h4>

                        <p className="text-sm text-gray-500">{order.date}</p>
                      </div>

                      <div>
                        <span
                          className="
                          px-3
                          py-1
                          rounded-full
                          bg-blue-100
                          text-blue-700
                          text-sm
                          "
                        >
                          {order.status}
                        </span>
                      </div>

                      <div className="font-bold">
                        QAR {Number(order.total).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Account;
