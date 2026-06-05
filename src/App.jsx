import { Toaster } from "react-hot-toast";
import Routes from "../src/routes/AppRoutes";

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
        }}
      />

      <Routes />
    </>
  );
}
export default App;
