import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { LanguageProvider } from "../context/LanguageContext";
import useAuthStore from "../store/useAuthStore";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileBottomNav from "../components/navigation/MobileBottomNav";
import WishlistToastManager from "../components/ui/WishlistToastManager";
import AuthRequiredModal from "../components/ui/AuthRequiredModel";
import AccountRequired from "../components/ui/AccountRequired";
import PageTransition from "../components/ui/PageTransition";
import RouteProgressBar from "../components/ui/RoutesProgressBar";
import DealDetails from "../pages/DealDetails";

import Home from "../pages/Home";
import Cart from "../pages/Cart";
import Wishlist from "../pages/Wishlist";
import Product from "../pages/Product";
import Category from "../pages/Category";
import Deals from "../pages/Deals";
import NotFound from "../pages/NotFound";
import AllProductsPage from "../pages/AllProductspage";
import AccountDashboard from "../components/layout/AccountDashboard";
import Search from "../pages/Search";
import Checkout from "../pages/Checkout";
import Profile from "../pages/Profile";
import Orders from "../pages/Orders";
import OrderDetails from "../pages/OrderDetail";
import Addresses from "../pages/Addresses";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgetPassword";

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

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => {
        const target = document.querySelector(hash);
        if (target) target.scrollIntoView({ block: "start" });
      });

      return;
    }

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [pathname, search, hash]);

  return null;
}

function SessionBootstrap() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    initializeAuth?.();

    const handleUnauthorized = () => logout?.();

    window.addEventListener("nexota:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("nexota:unauthorized", handleUnauthorized);
    };
  }, [initializeAuth, logout]);

  return null;
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const initialized = useAuthStore((state) => state.initialized);
  const authToken = token || getStoredToken();

  if (!initialized && authToken) return null;

  if (!user && !authToken) {
    const redirectTo = `${location.pathname}${location.search}`;

    const intent = redirectTo.includes("orders")
      ? "orders"
      : redirectTo.includes("checkout")
        ? "checkout"
        : redirectTo.includes("wishlist")
          ? "wishlist"
          : redirectTo.includes("addresses")
            ? "addresses"
            : "account";

    return (
      <AccountRequired
        redirectTo={redirectTo}
        intent={intent}
        title="Account required"
        subtitle="Please sign in or register to see this content"
      />
    );
  }

  return children;
}

function AppRoutes() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <SessionBootstrap />
        <ScrollToTop />
        <RouteProgressBar />
        <Header />
        <WishlistToastManager />
        <AuthRequiredModal />

        <PageTransition>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<AllProductsPage />} />
            <Route path="/product/:slug" element={<Product />} />
            <Route path="/category/:slug" element={<Category />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/search" element={<Search />} />
            <Route path="/cart" element={<Cart />} />

            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />

            <Route path="/deal/:slug" element={<DealDetails />} />

            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/addresses"
              element={
                <ProtectedRoute>
                  <Addresses />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>

        <Footer />
        <MobileBottomNav />
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default AppRoutes;
