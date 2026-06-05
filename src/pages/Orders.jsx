import MainLayout from "../layouts/MainLayout";
import useOrderStore from "../store/useOrderStore";
import { Package, Calendar, CreditCard, Truck } from "lucide-react";

const formatQAR = (amount) =>
  `QAR ${Number(amount).toLocaleString("en-QA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function Orders() {
  const orders = useOrderStore((state) => state.orders || []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-700";
      case "Shipped":
        return "bg-blue-100 text-blue-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black">My Orders</h1>

          <p className="mt-2 text-gray-500">View and track all your orders</p>
        </div>

        {orders.length === 0 ? (
          <div
            className="
            bg-white
            rounded-3xl
            p-12
            text-center
            border
            shadow-sm
            "
          >
            <Package size={80} className="mx-auto text-gray-300" />

            <h2 className="mt-6 text-2xl font-bold">No Orders Found</h2>

            <p className="mt-3 text-gray-500">
              Your placed orders will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="
                bg-white
                rounded-3xl
                border
                shadow-sm
                p-6
                "
              >
                {/* Top */}
                <div
                  className="
                  flex
                  flex-col
                  lg:flex-row
                  lg:items-center
                  lg:justify-between
                  gap-4
                  "
                >
                  <div>
                    <h3 className="font-black text-xl">Order #{order.id}</h3>

                    <div className="flex items-center gap-2 mt-2 text-gray-500">
                      <Calendar size={16} />
                      {order.date}
                    </div>
                  </div>

                  <span
                    className={`
                    px-4
                    py-2
                    rounded-full
                    text-sm
                    font-semibold
                    w-fit
                    ${getStatusColor(order.status)}
                    `}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Order Info */}
                <div className="grid md:grid-cols-3 gap-5 mt-6">
                  <div>
                    <div className="text-sm text-gray-500">Payment Method</div>

                    <div className="flex items-center gap-2 mt-2">
                      <CreditCard size={18} />
                      {order.paymentMethod}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Items</div>

                    <div className="mt-2 font-semibold">
                      {order.items?.length || 0} Products
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Total</div>

                    <div className="mt-2 font-black text-[#015DF0]">
                      {formatQAR(order.total)}
                    </div>
                  </div>
                </div>

                {/* Products */}
                {order.items?.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-bold mb-4">Products</h4>

                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="
                          flex
                          gap-4
                          items-center
                          border
                          rounded-2xl
                          p-3
                          "
                        >
                          <img
                            src={item.image}
                            alt={item.title}
                            className="
                            w-20
                            h-20
                            rounded-xl
                            object-cover
                            "
                          />

                          <div className="flex-1">
                            <h5 className="font-semibold">{item.title}</h5>

                            <p className="text-gray-500 text-sm mt-1">
                              {formatQAR(item.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tracking */}
                <div
                  className="
                  mt-6
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-gray-500
                  "
                >
                  <Truck size={16} />
                  Track your shipment from your dashboard
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default Orders;
