import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import WishlistToastManager from "../components/ui/WishlistToastManager";

function MainLayout({ children }) {
  return (
    <>
      <WishlistToastManager />
      <main className="min-h-screen">{children}</main>
    </>
  );
}

export default MainLayout;
