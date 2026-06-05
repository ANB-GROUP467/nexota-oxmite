import useCartStore from "../../store/useCartStore";

function CartDrawer() {
  const { items } = useCartStore();

  return (
    <div
      className="
      fixed
      top-0
      right-0
      w-96
      h-screen
      bg-white
      shadow-2xl
      p-5
      overflow-auto
      "
    >
      <h2 className="font-bold text-2xl">Cart</h2>

      {items.map((item) => (
        <div key={item.id} className="border-b py-3">
          {item.title}
        </div>
      ))}
    </div>
  );
}

export default CartDrawer;
