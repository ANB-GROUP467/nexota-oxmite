import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-bold">404</h1>

        <p className="mt-4 text-gray-500">Page not found</p>

        <Link
          to="/"
          className="
            inline-block
            mt-6
            bg-[#015df0]
            px-6
            py-3
            rounded-xl
          "
        >
          Back Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
