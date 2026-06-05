const menu = {
  Electronics: ["Mobiles", "Laptops", "Gaming", "Cameras"],

  Fashion: ["Men", "Women", "Kids"],

  Home: ["Furniture", "Decor", "Kitchen"],
};

function MegaMenu() {
  return (
    <div
      className="
      hidden
      lg:grid
      grid-cols-3
      gap-10
      bg-white
      p-8
      rounded-xl
      shadow-xl
      "
    >
      {Object.entries(menu).map(([category, items]) => (
        <div key={category}>
          <h3 className="font-bold mb-3">{category}</h3>

          {items.map((item) => (
            <div key={item} className="py-2 cursor-pointer">
              {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default MegaMenu;
