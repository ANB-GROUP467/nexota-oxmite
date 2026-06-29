import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";

function PageTransition({ children }) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className="page-transition">{children}</div>;
  }

  return (
    <motion.div
      key={`${location.pathname}${location.search}`}
      className="page-transition"
      initial={{ y: 4 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
