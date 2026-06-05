import { Truck, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

function TopBar() {
  return (
    <motion.div
      initial={{
        y: -50,
      }}
      animate={{
        y: 0,
      }}
      className="
      bg-gradient-to-r
      from-black
      via-gray-900
      to-black
      text-white
      text-sm
      "
    >
      <div
        className="
        max-w-[1600px]
        mx-auto
        px-4
        h-10
        flex
        items-center
        justify-between
        "
      >
        <div
          className="
          flex
          items-center
          gap-2
          "
        >
          <Truck size={15} />

          <span>Free Delivery Above $50</span>
        </div>

        <div
          className="
          hidden
          md:flex
          items-center
          gap-2
          "
        >
          <ShieldCheck size={15} />

          <span>Secure Checkout & Easy Returns</span>
        </div>
      </div>
    </motion.div>
  );
}

export default TopBar;
