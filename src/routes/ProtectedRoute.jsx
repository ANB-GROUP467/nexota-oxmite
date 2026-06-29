import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

const getStoredToken = () => {
  const direct =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");

  if (direct) return direct;

  try {
    const authStorage = JSON.parse(
      localStorage.getItem("auth-storage") || "{}",
    );
    return authStorage?.state?.token || authStorage?.token || "";
  } catch {
    return "";
  }
};

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { user, token } = useAuthStore();
  const authToken = token || getStoredToken();

  if (!user && !authToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
