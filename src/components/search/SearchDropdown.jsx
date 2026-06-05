import { products } from "../../data/dummyData";

function SearchDropdown({ query }) {
  const filtered = products.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()),
  );

  if (!query) return null;

  return (
    <div
      className="
      absolute
      top-full
      left-0
      right-0
      bg-white
      rounded-xl
      shadow-lg
      z-50
      "
    >
      {filtered.map((product) => (
        <div key={product.id} className="p-4 hover:bg-gray-100">
          {product.title}
        </div>
      ))}
    </div>
  );
}

export default SearchDropdown;
