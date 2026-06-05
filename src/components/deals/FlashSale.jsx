import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";

function FlashSale() {
  const [time, setTime] = useState(86400);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(time / 3600);
  const mins = Math.floor((time % 3600) / 60);
  const secs = time % 60;

  return (
    <section className="py-10">
      <motion.div
        animate={{
          boxShadow: [
            "0 0 0 rgba(239,68,68,0)",
            "0 0 40px rgba(239,68,68,.35)",
            "0 0 0 rgba(239,68,68,0)",
          ],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
        }}
        className="
        bg-gradient-to-r
        from-red-500
        via-red-600
        to-orange-500
        rounded-3xl
        p-8
        text-white
        overflow-hidden
        relative
        "
      >
        <div className="flex items-center gap-3">
          <Flame size={30} />

          <h2 className="text-4xl font-black">Flash Sale</h2>
        </div>

        <p className="mt-3 text-red-100">Hurry before the deal ends</p>

        <div className="flex gap-4 mt-8">
          {[hours, mins, secs].map((item, index) => (
            <div
              key={index}
              className="
                bg-white/20
                backdrop-blur-md
                rounded-2xl
                px-6
                py-4
                text-center
                min-w-[90px]
                "
            >
              <div className="text-3xl font-black">
                {String(item).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

export default FlashSale;
